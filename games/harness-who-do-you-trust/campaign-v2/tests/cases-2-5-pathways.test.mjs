import test from "node:test";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import {createCampaignStore} from "../runtime/campaign-store.mjs";
import {
  beginTrust, chooseDecision, commitTrust, completeCaseSession, consultAdvisor,
  createCaseSession, decisionStatus, inspectEvidence, isBestOutcome, openReview,
  setAdvisorWeight, toggleTrustedAdvisor, trustStatus, visibleEvidence
} from "../runtime/case-engine.mjs";

const manifest = JSON.parse(readFileSync(new URL("../campaign.json", import.meta.url)));
const data = (level) => JSON.parse(readFileSync(new URL(`../data/episode-00${level}.json`, import.meta.url)));

function inspectAvailable(caseData, original) {
  let state = original, previous;
  do {
    previous = state.inspectedSources.length;
    for (const record of visibleEvidence(caseData, state)) {
      state = inspectEvidence(caseData, state, record.id);
    }
  } while (state.inspectedSources.length > previous);
  return state;
}

function consultAndInspect(caseData, original) {
  let state = original;
  for (let i = 0; i < 8; i++) {
    const previous = state.revealedSources.length;
    for (const advisor of caseData.advisorOrder) {
      state = consultAdvisor(caseData, state, advisor).state;
    }
    state = inspectAvailable(caseData, state);
    if (state.revealedSources.length === previous) break;
  }
  return state;
}

function combinations(items, k, pos = 0, chosen = []) {
  if (k === 0) return [chosen];
  const out = [];
  for (let i = pos; i <= items.length - k; i++) {
    out.push(...combinations(items, k - 1, i + 1, [...chosen, items[i]]));
  }
  return out;
}

function prepareTrust(caseData, inspected, selection) {
  let state = beginTrust(caseData, inspected);
  assert.equal(state.sceneId, "trust", "Trust becomes available after inspecting and consulting");
  const options = caseData.trustJudgment.options.map((option) => option.advisorId);
  if (caseData.trustJudgment.mode === "weigh_each") {
    for (const advisor of options) {
      const result = setAdvisorWeight(caseData, state, advisor, selection.includes(advisor) ? "high" : "medium");
      assert.equal(result.changed, true);
      state = result.state;
    }
  } else {
    for (const advisor of selection) {
      const result = toggleTrustedAdvisor(caseData, state, advisor);
      assert.equal(result.changed, true);
      state = result.state;
    }
  }
  state = consultAndInspect(caseData, inspectAvailable(caseData, state));
  assert.equal(trustStatus(caseData, state).complete, true);
  state = commitTrust(caseData, state);
  assert.equal(state.sceneId, "decide");
  return state;
}

test("Campaign enforces sequential unlocks and rejects unapproved case skips", () => {
  const map = new Map();
  const storage = {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key)
  };
  const store = createCampaignStore(manifest, storage);
  assert.deepEqual(store.listCases().map((item) => item.status), ["available", "locked", "locked", "locked", "locked"]);
  assert.equal(store.completeCase("episode-003", "invalid-skip"), false);
  assert.equal(store.caseStatus("episode-003"), "locked");
  for (let i = 1; i <= 4; i++) {
    const id = `episode-00${i}`, next = `episode-00${i + 1}`;
    assert.equal(store.completeCase(id, "qa-predecessor-completed"), true);
    assert.equal(store.caseStatus(next), "available");
  }
  assert.equal(store.caseStatus("episode-005"), "available");
  assert.equal(store.completeCase("episode-005", "qa-finale"), true);
  assert.equal(store.listCases().every((item) => item.completed), true);
  assert.equal(store.resetCase("episode-005"), true);
  assert.equal(store.caseStatus("episode-005"), "completed", "Resetting a local save does not erase the campaign unlock record");
});

test("Case 2 keeps its frozen playable source, fingerprint and inspector", () => {
  const entry = manifest.cases.find((item) => item.id === "episode-002");
  const source = readFileSync(new URL("../../../../android/harness-who-do-you-trust/www/index.html", import.meta.url));
  assert.equal(createHash("sha256").update(source).digest("hex"), entry.runtime.sourceHash);
  assert.equal(entry.runtime.kind, "legacy-monolith");
  assert.match(source.toString("utf8"), /window\.HarnessV34/);
});

for (const level of [3, 4, 5]) {
  test(`Case ${level}: four evidence cards, hidden discovery, every reachable decision and persistence`, () => {
    const caseData = data(level);
    const id = caseData.id;
    let state = createCaseSession(caseData);
    assert.equal(state.sceneId, "briefing");
    assert.equal(state.completed, false);
    assert.equal(visibleEvidence(caseData, state).length, 4);
    for (const record of caseData.evidence.filter((item) => item.hidden)) {
      const attempted = inspectEvidence(caseData, state, record.id);
      assert.equal(attempted.inspectedSources.includes(record.id), false, "No hidden-clue bypass");
    }
    state = consultAndInspect(caseData, inspectAvailable(caseData, state));
    assert.equal(trustStatus(caseData, state).available, true);

    const advisors = caseData.trustJudgment.options.map((item) => item.advisorId);
    const choices = combinations(advisors, caseData.trustJudgment.requiredHigh ?? 2);
    const accessible = new Set(), hidden = new Set();
    let bestPaths = 0, completedPaths = 0;

    for (const selection of choices) {
      const ready = prepareTrust(caseData, state, selection);
      for (const record of ready.revealedSources) hidden.add(record);
      for (const decision of caseData.decisions) {
        if (!decisionStatus(caseData, ready, decision.id).available) continue;
        accessible.add(decision.id);
        const outcome = chooseDecision(caseData, ready, decision.id);
        assert.equal(outcome.sceneId, "outcome");
        const review = openReview(caseData, outcome);
        assert.equal(review.sceneId, "review");
        const completed = completeCaseSession(caseData, review);
        assert.equal(completed.completed, true);
        assert.equal(completed.outcomeId, decision.id);
        if (isBestOutcome(caseData, completed)) bestPaths++;
        completedPaths++;
      }
    }
    assert.deepEqual([...accessible].sort(), caseData.decisions.map((item) => item.id).sort(),
      "Every authored decision needs at least one legal evidence/advisor path");
    assert.ok(bestPaths > 0, "Best-case ending is legally reachable");
    assert.ok(completedPaths >= caseData.decisions.length);
    assert.ok(caseData.evidence.some((item) => item.hidden && hidden.has(item.id)),
      "At least one hidden clue can be found through real case actions");

    // Verify the exact serialized session is a valid save and reloads without losing the ending.
    const ready = prepareTrust(caseData, state, choices[0]);
    const legal = caseData.decisions.find((option) => decisionStatus(caseData, ready, option.id).available);
    assert.ok(legal);
    const complete = completeCaseSession(caseData, openReview(caseData, chooseDecision(caseData, ready, legal.id)));
    const mem = new Map();
    const storage = {getItem: (key) => mem.get(key) ?? null, setItem: (key, value) => mem.set(key, String(value)), removeItem: (key) => mem.delete(key)};
    const campaign = createCampaignStore(manifest, storage);
    for (let earlier = 1; earlier < level; earlier++) {
      assert.equal(campaign.completeCase(`episode-00${earlier}`, "qa-valid-predecessor"), true);
    }
    assert.equal(campaign.saveCase(id, complete), true);
    assert.equal(campaign.caseStatus(id), "completed");
    assert.equal(campaign.loadCase(id).session.outcomeId, legal.id);
    if (level < 5) assert.equal(campaign.caseStatus(`episode-00${level + 1}`), "available");
  });
}
