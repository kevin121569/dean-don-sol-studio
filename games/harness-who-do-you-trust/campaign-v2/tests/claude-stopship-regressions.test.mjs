import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createCampaignStore} from "../runtime/campaign-store.mjs";
import {restartCompletedCase, legacyReplaySaveKeys} from "../runtime/campaign-replay.mjs";

const manifest = JSON.parse(readFileSync(new URL("../campaign.json", import.meta.url)));
const read = relative => readFileSync(new URL(relative, import.meta.url), "utf8");

function backend() {
  const records = new Map();
  return {
    records,
    getItem: key => records.get(key) ?? null,
    setItem: (key,value) => {records.set(key, String(value));},
    removeItem: key => {records.delete(key);}
  };
}

test("Locked Cases 3–5 cannot be opened with a preview URL", () => {
  const shared = read("../app/play.mjs");
  assert.doesNotMatch(shared, /get\(["']preview["']\)/);
  assert.doesNotMatch(shared, /\bif\s*\(\s*!preview/);
  assert.match(shared, /if \(store\.caseStatus\(caseData\.id\) === "locked"\) return lockedScreen\(\)/);
  assert.match(shared, /const saved = store\.loadCase\(caseData\.id\)/);
});

test("One Android Back handler owns Cases 3–5, with case-menu return", () => {
  const shared = read("../app/play.mjs");
  const nav = read("../app/mobile-navigation.mjs");
  assert.doesNotMatch(shared, /(?:popstate|backButton|function handleBack)/);
  assert.match(nav, /addListener\?\.\("backButton", toCaseMenu\)/);
  assert.match(nav, /location\.replace\("\.\/index\.html"\)/);
});

test("Play Again removes a completed Case 3 save, not unlocks", () => {
  const storage=backend();
  const store=createCampaignStore(manifest,storage);
  for(let i=1;i<=3;i++) {
    assert.equal(store.completeCase(`episode-00${i}`, `d_complete_${i}`),true);
  }
  const id="episode-003";
  assert.equal(store.saveCase(id,{episodeId:id,completed:true,outcomeId:"d_complete_3",sceneId:"review"}),true);
  assert.ok(store.loadCase(id));
  assert.equal(restartCompletedCase(store,id,storage),true);
  assert.equal(store.loadCase(id),null);
  assert.equal(store.caseStatus(id),"completed");
  assert.equal(store.caseStatus("episode-004"),"available");
  assert.equal(store.loadProgress().cases[id].outcomeId,"d_complete_3");
});

test("Play Again clears only the chosen frozen case's save", () => {
  const storage=backend(),store=createCampaignStore(manifest,storage);
  assert.equal(store.completeCase("episode-001","d_complete"),true);
  const key=legacyReplaySaveKeys["episode-001"];
  storage.setItem(key, '{"complete":true}');
  storage.setItem("unrelated-other-game","keep");
  assert.equal(restartCompletedCase(store,"episode-001",storage),true);
  assert.equal(storage.getItem(key),null);
  assert.equal(storage.getItem("unrelated-other-game"),"keep");
  assert.equal(store.caseStatus("episode-002"),"available");
  assert.equal(store.caseStatus("episode-001"),"completed");
  assert.equal(restartCompletedCase(store,"episode-002",storage),false);
});

test("Frozen Case 2 uses a distinct v12 save key", () => {
  assert.equal(legacyReplaySaveKeys["episode-002"],"harness-v34:episode-002:illustrated-master-control:v12-motorola-audio-scroll-fix");
  assert.notEqual(legacyReplaySaveKeys["episode-001"],legacyReplaySaveKeys["episode-002"]);
  const storage=backend(),store=createCampaignStore(manifest,storage);
  store.completeCase("episode-001","completed1");
  store.completeCase("episode-002","completed2");
  storage.setItem(legacyReplaySaveKeys["episode-001"],"retain");
  storage.setItem(legacyReplaySaveKeys["episode-002"],"erase");
  assert.equal(restartCompletedCase(store,"episode-002",storage),true);
  assert.equal(storage.getItem(legacyReplaySaveKeys["episode-001"]),"retain");
  assert.equal(storage.getItem(legacyReplaySaveKeys["episode-002"]),null);
  assert.equal(store.caseStatus("episode-003"),"available");
});

test("Campaign Play Again button calls the deliberate replay action", () => {
  const campaign=read("../app/campaign.mjs");
  assert.match(campaign,/restartCompletedCase\(store, item\.id, globalThis\.localStorage\)/);
  assert.match(campaign,/if \(item\.completed\)/);
});
