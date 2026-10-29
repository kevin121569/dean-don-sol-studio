import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createCampaignStore} from "../runtime/campaign-store.mjs";
import {
  beginTrust, chooseDecision, commitTrust, completeCaseSession,
  consultAdvisor, createCaseSession, inspectEvidence, isBestOutcome,
  normalizeCaseSession, openReview, setAdvisorWeight, toggleTrustedAdvisor,
  trustStatus, visibleEvidence
} from "../runtime/case-engine.mjs";

const manifest = JSON.parse(readFileSync(new URL("../campaign.json", import.meta.url), "utf8"));
const laterCases = [3, 4, 5].map(n =>
  JSON.parse(readFileSync(new URL(`../data/episode-00${n}.json`, import.meta.url), "utf8"))
);

function memoryStorage() {
  const map = new Map();
  return {
    map,
    getItem(key) { return map.get(key) ?? null; },
    setItem(key, value) { map.set(key, String(value)); },
    removeItem(key) { map.delete(key); }
  };
}

function completeLegacyForStorage(store, id) {
  // This tests the campaign's legacy handoff contract, not actual UI gameplay.
  // d_hybrid is a known real approved ending in the frozen legacy source.
  const completed = {episodeId:id, sceneId:"review", completed:true, outcomeId:"d_hybrid"};
  assert.equal(store.saveCase(id, completed), true, `${id}: valid legacy completion should save`);
  assert.equal(store.caseStatus(id), "completed");
  return completed;
}

function investigateEntireCase(data, state) {
  for (const record of data.evidence.filter(e => !e.hidden))
    state = inspectEvidence(data, state, record.id);
  for (const id of data.advisorOrder) {
    const result = consultAdvisor(data, state, id);
    state = result.state;
    for (const sourceId of state.revealedSources)
      state = inspectEvidence(data, state, sourceId);
  }
  assert.equal(visibleEvidence(data, state).length, data.evidence.length, `${data.id}: every hidden clue must be discoverable`);
  assert.equal(trustStatus(data, state).available, true, `${data.id}: trust stage must unlock`);
  return state;
}

function finishLaterCase(data, state) {
  state = beginTrust(data, state);
  assert.equal(state.sceneId, "trust");
  if (data.trustJudgment.mode === "weigh_each") {
    for (const [advisorId, weight] of [
      ["boy","low"], ["tooth","high"], ["darth","medium"], ["donsol","high"]
    ]) state = setAdvisorWeight(data, state, advisorId, weight).state;
  } else {
    for (const id of ["tooth","donsol"]) state = toggleTrustedAdvisor(data, state, id).state;
  }
  assert.equal(trustStatus(data, state).complete, true, `${data.id}: selection gate incomplete`);
  state = commitTrust(data, state);
  assert.equal(state.sceneId, "decide");
  state = chooseDecision(data, state, data.bestDecisionId);
  assert.equal(state.sceneId, "outcome", `${data.id}: best decision should be reachable with full evidence`);
  state = openReview(data, state);
  state = completeCaseSession(data, state);
  assert.equal(state.completed, true);
  assert.equal(isBestOutcome(data, state), true);
  return state;
}

test("five-case QA: sequential unlock, real Case 3–5 decisions, save/resume and season completion", () => {
  const storage = memoryStorage();
  let store = createCampaignStore(manifest, storage);
  assert.deepEqual(store.listCases().map(x => x.status),
    ["available","locked","locked","locked","locked"]);

  for (const legacyId of ["episode-001","episode-002"]) {
    completeLegacyForStorage(store, legacyId);
    store = createCampaignStore(manifest, storage);
    assert.equal(store.loadCase(legacyId)?.session.completed, true);
  }
  assert.deepEqual(store.listCases().map(x => x.status),
    ["completed","completed","available","locked","locked"]);

  for (const [index, data] of laterCases.entries()) {
    assert.equal(store.caseStatus(data.id), "available");
    let state = investigateEntireCase(data, createCaseSession(data));
    assert.equal(store.saveCase(data.id, state), true, `${data.id}: partial investigation must persist`);
    store = createCampaignStore(manifest, storage);
    assert.equal(store.caseStatus(data.id), "in_progress");
    state = normalizeCaseSession(data, store.loadCase(data.id).session);
    assert.equal(state.completed, false);

    state = finishLaterCase(data, state);
    assert.equal(store.saveCase(data.id, state, {bestReached:true}), true);
    store = createCampaignStore(manifest, storage);
    assert.equal(store.caseStatus(data.id), "completed");
    assert.equal(store.loadCase(data.id).session.outcomeId, data.bestDecisionId);
    assert.equal(store.listCases()[index+2].bestReached, true);
    if (index < laterCases.length-1)
      assert.equal(store.caseStatus(laterCases[index+1].id), "available");
  }

  assert.deepEqual(store.listCases().map(x => x.status),
    ["completed","completed","completed","completed","completed"]);
  const persisted = store.loadProgress();
  assert.equal(Object.keys(persisted.cases).length, 5);
  storage.removeItem(store.progressKey);
  const reopened = createCampaignStore(manifest, storage);
  assert.deepEqual(reopened.listCases().map(x => x.status),
    ["completed","completed","completed","completed","completed"],
    "reconstruction from five valid case saves must preserve full season");
});

test("five-case QA: no later-case save or forged completion can skip a previous lock", () => {
  const storage = memoryStorage();
  const store = createCampaignStore(manifest, storage);
  for (const data of laterCases) {
    assert.equal(store.saveCase(data.id, createCaseSession(data)), false);
    assert.equal(store.completeCase(data.id, data.bestDecisionId), false);
    assert.equal(store.caseStatus(data.id), "locked");
  }
  completeLegacyForStorage(store, "episode-001");
  assert.equal(store.caseStatus("episode-003"), "locked", "Case 2 cannot be skipped");
});

test("five-case QA: common evidence and case routes match the approved content without weakening locks", () => {
  assert.deepEqual(manifest.caseOrder, manifest.cases.map(x => x.id));
  assert.equal(manifest.cases.length, 5);
  for (const data of laterCases) {
    const item = manifest.cases.find(x => x.id === data.id);
    assert.equal(item.runtime.kind, "shared-case-renderer");
    assert.equal(item.launch, `./play.html?case=${data.id}`);
    assert.equal(item.contentHash.length, 64);
    assert.equal(item.runtime.sourceHash.length, 64);
    assert.equal(data.evidence.filter(x => !x.hidden).length, 4);
    assert.ok(data.evidence.some(x => x.hidden));
    assert.equal(data.progression.unlocks, item.unlocks);
  }
});
