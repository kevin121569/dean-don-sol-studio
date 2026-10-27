import test from "node:test";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import {
  LEGACY_BRIDGE_PROTOCOL,
  LEGACY_OBSERVER_SCRIPT_ID,
  normalizeLegacyMessage,
  prepareLegacyHtml
} from "../runtime/legacy-adapter.mjs";

const manifest = JSON.parse(readFileSync(new URL("../campaign.json", import.meta.url)));
const level1 = readFileSync(new URL("../build/level-1.html", import.meta.url), "utf8");
const level2 = readFileSync(new URL("../../../../android/harness-who-do-you-trust/www/index.html", import.meta.url), "utf8");
const hash = (value) => createHash("sha256").update(value).digest("hex");
const runtime = (id) => manifest.cases.find((item) => item.id === id).runtime;

test("prepared Level 1 and repository Level 2 are the exact approved sources", () => {
  assert.equal(hash(level1), runtime("episode-001").sourceHash);
  assert.equal(hash(level2), runtime("episode-002").sourceHash);
});

test("Level 1 adapter removes only the known observer script and adds the explicit bridge", () => {
  assert.match(level1, new RegExp(`<script id="${LEGACY_OBSERVER_SCRIPT_ID}">`));
  assert.match(level1, /new MutationObserver\(enhance\)/);
  const art = runtime("episode-001").art;
  const evidenceArt = Object.fromEntries(Object.entries(art).map(([id, item]) => [id, item.asset]));
  const assetOverrides = Object.fromEntries(Object.values(art).map((item) => [item.asset, "data:image/jpeg;base64,AA=="]));
  const html = prepareLegacyHtml(level1, {
    caseId: "episode-001",
    episodeId: "episode-001",
    inspector: "HarnessV34",
    transforms: runtime("episode-001").transforms,
    evidenceArt,
    assetOverrides
  });
  assert.doesNotMatch(html, new RegExp(`<script id="${LEGACY_OBSERVER_SCRIPT_ID}">`));
  assert.doesNotMatch(html, /new MutationObserver\(enhance\)/);
  assert.match(html, /id="harness-campaign-bridge"/);
  assert.match(html, /window\.HarnessV34=harnessInspector/);
  assert.match(html, /"caseId":"episode-001"/);
  assert.doesNotMatch(html, /const img=\{e_monitor:'v34\/ledger\.jpg'/);
  assert.doesNotMatch(html, /-webkit-line-clamp:2/);
  assert.match(html, /id="harness-server4-phone-text-repair"/);
  assert.match(html, /dialog\{overflow-y:auto/);
  for (const item of Object.values(art)) assert.match(html, new RegExp(item.asset.replace(".", "\\.")));
  assert.ok(html.indexOf('id="harness-server4-art"') < html.indexOf("window.HarnessEpisode = "));
});

test("Level 2 adapter preserves the approved game and adds only its bridge", () => {
  const html = prepareLegacyHtml(level2, {
    caseId: "episode-002",
    episodeId: "episode-002",
    inspector: "HarnessV34",
    transforms: []
  });
  const bridgeAt = html.indexOf('<script id="harness-campaign-bridge">');
  assert.ok(bridgeAt > 0);
  assert.equal(html.slice(0, bridgeAt), level2.slice(0, level2.lastIndexOf("</body>")));
  assert.match(html, /"caseId":"episode-002"/);
});

test("adapter fails closed when an approved marker is absent or a transform is unknown", () => {
  assert.throws(() => prepareLegacyHtml("<body></body>", {
    caseId: "episode-001", episodeId: "episode-001", inspector: "HarnessV34", transforms: []
  }), /inspector/);
  assert.throws(() => prepareLegacyHtml(level2, {
    caseId: "episode-002", episodeId: "episode-002", inspector: "HarnessV34", transforms: ["invent-a-fix"]
  }), /Unknown legacy transform/);
});

test("bridge messages accept only the selected case and a valid completed outcome", () => {
  const base = {
    ...LEGACY_BRIDGE_PROTOCOL,
    caseId: "episode-001",
    state: {episodeId: "episode-001", sceneId: "investigate", completed: false, outcomeId: null},
    beat: 2
  };
  assert.deepEqual(normalizeLegacyMessage(base, "episode-001"), {
    episodeId: "episode-001", sceneId: "investigate", completed: false, outcomeId: null, beat: 2
  });
  assert.equal(normalizeLegacyMessage({...base, caseId: "episode-002"}, "episode-001"), null);
  assert.equal(normalizeLegacyMessage({...base, state: {...base.state, completed: true}}, "episode-001"), null);
  assert.equal(normalizeLegacyMessage({
    ...base,
    state: {...base.state, sceneId: "outcome", completed: true, outcomeId: "d_hybrid"}
  }, "episode-001")?.outcomeId, "d_hybrid");
});

test("all five approved cases have launch routes and preserve their runtime types", () => {
  assert.deepEqual(
    manifest.cases.map((item) => [item.id, Boolean(item.launch), item.runtime.kind]),
    [
      ["episode-001", true, "legacy-monolith"],
      ["episode-002", true, "legacy-monolith"],
      ["episode-003", true, "shared-case-renderer"],
      ["episode-004", true, "shared-case-renderer"],
      ["episode-005", true, "shared-case-renderer"]
    ]
  );
});
