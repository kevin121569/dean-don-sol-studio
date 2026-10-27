import {createHash} from "node:crypto";
import {readFile, readdir} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

const BUILD_ID = "C3-20261027-A";
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const dist = path.join(root, "dist");
const failures = [];
const ok = (condition, message) => { if (!condition) failures.push(message); };
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function json(relative) {
  return JSON.parse(await readFile(path.join(root, relative), "utf8"));
}

async function recursiveFiles(directory, base = directory) {
  const entries = await readdir(directory, {withFileTypes: true});
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await recursiveFiles(absolute, base));
    else if (entry.isFile()) files.push(path.relative(base, absolute).split(path.sep).join("/"));
  }
  return files.sort();
}

const config = await json("capacitor.config.json");
const manifest = await json("dist/campaign/campaign.json");
const inventory = await json("dist/qa-manifest.json");
const rootHtml = await readFile(path.join(dist, "index.html"), "utf8");
const playHtml = await readFile(path.join(dist, "campaign/app/play.html"), "utf8");
const {createCampaignStore} = await import(pathToFileURL(path.join(dist, "campaign/runtime/campaign-store.mjs")));

ok(config.appId === "com.theidealabstudio.harness.campaign.case3qa", "QA package ID changed");
ok(config.appName === "HARNESS QA · CASE 3", "QA launcher name changed");
ok(config.webDir === "dist", "QA webDir must remain dist");
ok(rootHtml.includes(`BUILD ${BUILD_ID}`), "root QA build stamp missing");
ok(playHtml.includes(`HARNESS QA · CASE 3 · ${BUILD_ID}`), "in-game QA build banner missing");
ok(manifest.qa?.buildId === BUILD_ID && manifest.qa?.productionRelease === false, "QA manifest identity missing");
ok(manifest.cases.find((item) => item.id === "episode-003")?.launch === `./play.html?case=episode-003&qa=${BUILD_ID}`, "Case 3 QA launch route missing");
ok(manifest.cases.find((item) => item.id === "episode-004")?.launch === null, "Case 4 must remain disconnected");
ok(manifest.cases.find((item) => item.id === "episode-005")?.launch === null, "Case 5 must remain disconnected");
ok(manifest.cases.find((item) => item.id === "episode-002")?.runtime?.source === "build/level-2.html", "packaged Case 2 route is not local");

const expectedLevel1 = "4fbe004e42c12af00a34006a939deed8dc14d74b74ae6c1d44bbd5c535ba4ccd";
const expectedLevel2 = "83089e531ae5a88162f54d68cee96bb0146f2bf2fa0793333595c704a66d8b60";
ok(sha256(await readFile(path.join(dist, "campaign/build/level-1.html"))) === expectedLevel1, "approved Case 1 bytes changed");
ok(sha256(await readFile(path.join(dist, "campaign/build/level-2.html"))) === expectedLevel2, "approved Case 2 bytes changed");

const case3 = manifest.cases.find((item) => item.id === "episode-003");
ok(Object.keys(case3?.art ?? {}).length === 6, "Case 3 must package six evidence illustrations");
for (const [evidenceId, art] of Object.entries(case3?.art ?? {})) {
  const artPath = path.join(dist, "campaign", art.source);
  ok(sha256(await readFile(artPath)) === art.sourceHash, `${evidenceId} art fingerprint changed`);
}

const memory = new Map();
const qaStore = createCampaignStore(manifest, {
  getItem: (key) => memory.get(key) ?? null,
  setItem: (key, value) => memory.set(key, String(value)),
  removeItem: (key) => memory.delete(key)
});
ok(qaStore.caseStatus("episode-003") === "locked", "Case 3 must preserve production progression before QA seeding");
qaStore.saveCase("episode-001", {episodeId: "episode-001", completed: true, outcomeId: "qa-prerequisite-pass", sceneId: "review"});
qaStore.saveCase("episode-002", {episodeId: "episode-002", completed: true, outcomeId: "qa-prerequisite-pass", sceneId: "review"});
ok(qaStore.caseStatus("episode-003") === "available", "QA launcher cannot unlock Case 3 in its isolated store");

const actualFiles = (await recursiveFiles(dist)).filter((file) => file !== "qa-manifest.json");
ok(JSON.stringify(actualFiles) === JSON.stringify(Object.keys(inventory.files).sort()), "QA inventory file list does not match dist");
for (const file of actualFiles) {
  ok(sha256(await readFile(path.join(dist, file))) === inventory.files[file], `QA inventory hash mismatch: ${file}`);
}

if (failures.length) {
  console.error(`HARNESS QA validation failed (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`HARNESS QA validation passed: ${BUILD_ID}; ${actualFiles.length} files; exact Cases 1-2; six Case 3 art assets; isolated Case 3 unlock; unique package ID.`);

