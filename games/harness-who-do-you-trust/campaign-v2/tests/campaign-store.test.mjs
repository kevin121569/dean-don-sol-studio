import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createCampaignStore, emitCaseCompleted, PROGRESS_SCHEMA, SAVE_SCHEMA} from "../runtime/campaign-store.mjs";

const manifest = JSON.parse(readFileSync(new URL("../campaign.json", import.meta.url)));

function memoryStorage() {
  const values = new Map();
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key)
  };
}

const session = (episodeId, patch = {}) => ({
  episodeId,
  completed: false,
  outcomeId: null,
  sceneId: "investigate",
  inspectedSources: [],
  ...patch
});

test("fresh campaign exposes five cases and unlocks only Case 1", () => {
  const store = createCampaignStore(manifest, memoryStorage());
  const cases = store.listCases();
  assert.equal(cases.length, 5);
  assert.deepEqual(cases.map((item) => item.status), ["available", "locked", "locked", "locked", "locked"]);
  assert.deepEqual(store.loadProgress(), {schema: PROGRESS_SCHEMA, cases: {}});
});

test("any completed ending unlocks the next case", () => {
  const store = createCampaignStore(manifest, memoryStorage());
  assert.equal(store.saveCase("episode-001", session("episode-001", {completed: true, outcomeId: "d_shutdown", sceneId: "outcome"})), true);
  assert.deepEqual(store.listCases().map((item) => item.status), ["completed", "available", "locked", "locked", "locked"]);
  assert.equal(store.loadProgress().cases["episode-001"].outcomeId, "d_shutdown");
});

test("saving an incomplete replay never relocks later cases", () => {
  const storage = memoryStorage();
  const store = createCampaignStore(manifest, storage);
  store.saveCase("episode-001", session("episode-001", {completed: true, outcomeId: "d_verify", sceneId: "outcome"}));
  store.saveCase("episode-001", session("episode-001", {inspectedSources: ["e_monitor"]}));
  assert.equal(store.caseStatus("episode-001"), "completed");
  assert.equal(store.caseStatus("episode-002"), "available");
});

test("case saves are isolated and a reset does not erase season completion", () => {
  const storage = memoryStorage();
  const store = createCampaignStore(manifest, storage);
  store.saveCase("episode-001", session("episode-001", {completed: true, outcomeId: "d_hybrid", sceneId: "postmortem"}));
  store.saveCase("episode-002", session("episode-002", {inspectedSources: ["e_controller"]}));
  const case2Before = storage.getItem(store.saveKey("episode-002"));
  assert.equal(store.resetCase("episode-001"), true);
  assert.equal(store.loadCase("episode-001"), null);
  assert.equal(storage.getItem(store.saveKey("episode-002")), case2Before);
  assert.equal(store.caseStatus("episode-002"), "in_progress");
});

test("deleted progress is rebuilt from completed case saves", () => {
  const storage = memoryStorage();
  const store = createCampaignStore(manifest, storage);
  store.saveCase("episode-001", session("episode-001", {completed: true, outcomeId: "d_preserve", sceneId: "outcome"}), {bestReached: true});
  storage.removeItem(store.progressKey);
  const rebuilt = store.loadProgress();
  assert.equal(rebuilt.cases["episode-001"].completed, true);
  assert.equal(rebuilt.cases["episode-001"].bestReached, true);
  assert.equal(store.caseStatus("episode-002"), "available");
});

test("rebuild refuses an out-of-order forged completion save", () => {
  const storage = memoryStorage();
  const store = createCampaignStore(manifest, storage);
  const item = manifest.cases.find((entry) => entry.id === "episode-005");
  storage.setItem(store.saveKey("episode-005"), JSON.stringify({
    schema: SAVE_SCHEMA,
    caseId: "episode-005",
    episodeId: "episode-005",
    contentVersion: item.contentVersion,
    contentHash: item.contentHash,
    session: session("episode-005", {completed: true, outcomeId: "d_bounded_authority", sceneId: "outcome"}),
    beat: 0,
    uxSignals: {},
    bestReached: true
  }));
  assert.deepEqual(store.rebuildProgress(), {schema: PROGRESS_SCHEMA, cases: {}});
  assert.equal(store.caseStatus("episode-005"), "locked");
});

test("foreign, stale, and malformed save envelopes are rejected", () => {
  const storage = memoryStorage();
  const store = createCampaignStore(manifest, storage);
  const wrong = {
    schema: SAVE_SCHEMA,
    caseId: "episode-001",
    episodeId: "episode-001",
    contentVersion: 1,
    contentHash: "manifest:1:episode-001",
    session: session("episode-001")
  };
  storage.setItem(store.saveKey("episode-002"), JSON.stringify(wrong));
  assert.equal(store.loadCase("episode-002"), null, "a Case 1 envelope cannot load under Case 2's key");
  assert.equal(store.caseStatus("episode-002"), "locked", "a foreign raw value cannot create an in-progress state");
  storage.setItem(store.saveKey("episode-001"), "{bad json");
  assert.equal(store.loadCase("episode-001"), null);
  assert.equal(store.saveCase("episode-001", session("episode-999")), false);
});

test("corrupt progress cannot unlock a case and is safely rebuilt", () => {
  const storage = memoryStorage();
  const store = createCampaignStore(manifest, storage);
  storage.setItem(store.progressKey, JSON.stringify({schema: PROGRESS_SCHEMA, cases: {"episode-001": {completed: "yes"}}}));
  assert.deepEqual(store.listCases().map((item) => item.status), ["available", "locked", "locked", "locked", "locked"]);
  storage.setItem(store.progressKey, JSON.stringify({schema: PROGRESS_SCHEMA, cases: {intruder: {completed: true, outcomeId: "x"}}}));
  assert.deepEqual(store.loadProgress(), {schema: PROGRESS_SCHEMA, cases: {}});
});

test("a locked case cannot be saved or completed through a forged event", () => {
  const store = createCampaignStore(manifest, memoryStorage());
  assert.equal(store.saveCase("episode-005", session("episode-005")), false);
  assert.equal(store.completeCase("episode-005", "d_bounded_authority"), false);
  assert.equal(store.caseStatus("episode-005"), "locked");
});

test("blocked storage never prevents play", () => {
  const broken = {
    getItem() { throw new Error("blocked"); },
    setItem() { throw new Error("quota"); },
    removeItem() { throw new Error("blocked"); }
  };
  const store = createCampaignStore(manifest, broken);
  assert.deepEqual(store.listCases().map((item) => item.status), ["available", "locked", "locked", "locked", "locked"]);
  assert.equal(store.saveCase("episode-001", session("episode-001")), false);
  assert.equal(store.resetCase("episode-001"), false);
});

test("completion uses one explicit event instead of a DOM mutation observer", () => {
  const received = [];
  const target = {dispatchEvent(event) { received.push(event); return true; }};
  assert.equal(emitCaseCompleted(target, {caseId: "episode-001", outcomeId: "d_hybrid"}), true);
  assert.equal(received.length, 1);
  assert.equal(received[0].type, "harness:case-completed");
  assert.deepEqual(received[0].detail, {caseId: "episode-001", outcomeId: "d_hybrid"});
  assert.equal(emitCaseCompleted(target, {caseId: "episode-001"}), false);
});

test("resetCampaign removes every case save and the completion ledger", () => {
  const storage = memoryStorage();
  const store = createCampaignStore(manifest, storage);
  store.saveCase("episode-001", session("episode-001", {completed: true, outcomeId: "d_verify", sceneId: "outcome"}));
  store.saveCase("episode-002", session("episode-002"));
  assert.equal(store.resetCampaign(), true);
  assert.deepEqual(store.listCases().map((item) => item.status), ["available", "locked", "locked", "locked", "locked"]);
});
