import {createHash} from "node:crypto";
import {readFile, readdir} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

const BUILD_ID = "FULL5-20261027-C";
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
const campaignIndex = await readFile(path.join(dist, "campaign/app/index.html"), "utf8");
const campaignScript = await readFile(path.join(dist, "campaign/app/campaign.mjs"), "utf8");
const playHtml = await readFile(path.join(dist, "campaign/app/play.html"), "utf8");
const {createCampaignStore} = await import(pathToFileURL(path.join(dist, "campaign/runtime/campaign-store.mjs")));

ok(config.appId === "com.theidealabstudio.harness.campaign.fullqa", "QA package ID changed");
ok(config.appName === "HARNESS QA · 5 CASES", "QA launcher name changed");
ok(config.webDir === "dist", "QA webDir must remain dist");
ok(rootHtml.includes(`BUILD ${BUILD_ID}`), "root QA build stamp missing");
ok(playHtml.includes(`HARNESS QA · FIVE CASES · ${BUILD_ID}`), "in-game QA build banner missing");
ok(campaignIndex.includes('id="caseMapList"') && campaignIndex.includes("5 / 5 CASES SHOWN"), "selector must visibly prove all five cases are present");
ok(campaignScript.includes('mapButton.innerHTML = `<span>${item.completed ? "✓" : item.level}</span><small>CASE ${item.level}</small>`'), "selector must render five numbered case-map buttons from the manifest");
ok(manifest.qa?.buildId === BUILD_ID && manifest.qa?.productionRelease === false, "QA manifest identity missing");
for (const level of [3, 4, 5]) {
  const id = `episode-00${level}`;
  ok(manifest.cases.find((item) => item.id === id)?.launch === `./play.html?case=${id}`, `${id} launch route missing`);
}
ok(manifest.cases.find((item) => item.id === "episode-002")?.runtime?.source === "build/level-2.html", "packaged Case 2 route is not local");

const expectedLevel1 = "4fbe004e42c12af00a34006a939deed8dc14d74b74ae6c1d44bbd5c535ba4ccd";
const expectedLevel2 = "83089e531ae5a88162f54d68cee96bb0146f2bf2fa0793333595c704a66d8b60";
ok(sha256(await readFile(path.join(dist, "campaign/build/level-1.html"))) === expectedLevel1, "approved Case 1 bytes changed");
ok(sha256(await readFile(path.join(dist, "campaign/build/level-2.html"))) === expectedLevel2, "approved Case 2 bytes changed");

for (const caseId of ["episode-003", "episode-004", "episode-005"]) {
  const entry = manifest.cases.find((item) => item.id === caseId);
  ok(Object.keys(entry?.art ?? {}).length === 6, `${caseId} must package six evidence illustrations`);
  for (const [evidenceId, art] of Object.entries(entry?.art ?? {})) {
    const artPath = path.join(dist, "campaign", art.source);
    ok(sha256(await readFile(artPath)) === art.sourceHash, `${caseId}/${evidenceId} art fingerprint changed`);
  }
}

const memory = new Map();
const qaStore = createCampaignStore(manifest, {
  getItem: (key) => memory.get(key) ?? null,
  setItem: (key, value) => memory.set(key, String(value)),
  removeItem: (key) => memory.delete(key)
});
ok(JSON.stringify(qaStore.listCases().map((item) => item.status)) === JSON.stringify(["available", "locked", "locked", "locked", "locked"]), "fresh QA install must begin with only Case 1 unlocked");
ok(!rootHtml.includes("qa-prerequisite-pass"), "full-campaign launcher must not seed completed cases");

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

console.log(`HARNESS QA validation passed: ${BUILD_ID}; ${actualFiles.length} files; exact Cases 1-2; eighteen Case 3-5 art assets; sequential fresh start; unique package ID.`);

