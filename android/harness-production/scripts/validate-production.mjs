import {createHash} from "node:crypto";
import {readFile, readdir} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

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
const rootHtml = await readFile(path.join(dist, "index.html"), "utf8");
const selectorHtml = await readFile(path.join(dist, "campaign/app/index.html"), "utf8");
const stagedPrivacy = await readFile(path.join(dist, "campaign/app/privacy.html"), "utf8");
const privacySource = await readFile(path.join(root, "privacy-policy.html"), "utf8");
const publicPrivacy = await readFile(path.resolve(root, "../../harness-privacy/index.html"), "utf8");
const level1 = await readFile(path.join(dist, "campaign/build/level-1.html"));
const level2 = await readFile(path.join(dist, "campaign/build/level-2.html"));
const {createCampaignStore} = await import(pathToFileURL(path.join(dist, "campaign/runtime/campaign-store.mjs")));

ok(config.appId === "com.theidealabstudio.harness", "Permanent production application ID changed.");
ok(config.appName === "HARNESS: Who Do You Trust?", "Production launcher name changed.");
ok(config.webDir === "dist", "Production webDir must remain dist.");
ok(rootHtml.includes('location.replace("./campaign/app/index.html")'), "Production root must replace-navigation into the selector.");
ok(selectorHtml.includes('href="./privacy.html"'), "Production selector must expose local Privacy Policy access.");
ok(sha256(stagedPrivacy) === sha256(privacySource), "Staged in-app privacy policy differs from approved production source.");
ok(stagedPrivacy.includes("donsol@theidealabstudio.com"), "In-app privacy policy is missing the public support contact.");
ok(publicPrivacy.includes('https://theidealabstudio.com/harness-privacy/'), "Public privacy draft is missing the approved candidate URL.");
ok(publicPrivacy.includes("donsol@theidealabstudio.com"), "Public privacy draft is missing the support contact.");
ok(!("qa" in manifest), "Production campaign manifest must not contain QA metadata.");
ok(Array.isArray(manifest.cases) && manifest.cases.length === 5, "Production campaign must contain exactly five cases.");
ok(manifest.cases.find((item) => item.id === "episode-002")?.runtime?.source === "build/level-2.html", "Packaged Case 2 must use the approved local source.");

const expectedLevel1 = "4fbe004e42c12af00a34006a939deed8dc14d74b74ae6c1d44bbd5c535ba4ccd";
const expectedLevel2 = "83089e531ae5a88162f54d68cee96bb0146f2bf2fa0793333595c704a66d8b60";
ok(sha256(level1) === expectedLevel1, "Approved Case 1 bytes changed.");
ok(sha256(level2) === expectedLevel2, "Approved Case 2 bytes changed.");

for (const caseId of ["episode-003", "episode-004", "episode-005"]) {
  const entry = manifest.cases.find((item) => item.id === caseId);
  ok(Object.keys(entry?.art ?? {}).length === 6, `${caseId} must package six evidence illustrations.`);
  for (const [evidenceId, art] of Object.entries(entry?.art ?? {})) {
    const artPath = path.join(dist, "campaign", art.source);
    ok(sha256(await readFile(artPath)) === art.sourceHash, `${caseId}/${evidenceId} art fingerprint changed.`);
  }
}

const memory = new Map();
const store = createCampaignStore(manifest, {
  getItem: (key) => memory.get(key) ?? null,
  setItem: (key, value) => memory.set(key, String(value)),
  removeItem: (key) => memory.delete(key)
});
ok(
  JSON.stringify(store.listCases().map((item) => item.status)) === JSON.stringify(["available", "locked", "locked", "locked", "locked"]),
  "Fresh production install must begin with only Case 1 unlocked."
);

const bannedMarkers = [
  "HARNESS QA",
  "NOT FOR PLAY STORE",
  "FULL5-20261030-H3",
  "com.theidealabstudio.harness.campaign.fullqa.h3",
  "qaBuildBanner",
  '"productionRelease": false'
];

const textExtensions = new Set([".html", ".js", ".mjs", ".json"]);
const allowedNamespaceUrls = new Set([
  "http://www.w3.org/2000/svg",
  "http://www.w3.org/1999/xlink"
]);
const externalPattern = /(?:https?:\/\/|wss?:\/\/)[^"'\s<>]+/g;

for (const relative of await recursiveFiles(dist)) {
  if (!textExtensions.has(path.extname(relative))) continue;
  const content = await readFile(path.join(dist, relative), "utf8");
  for (const marker of bannedMarkers) {
    ok(!content.includes(marker), `QA marker "${marker}" found in ${relative}.`);
  }
  for (const match of content.matchAll(externalPattern)) {
    const url = match[0].replace(/[),.;]+$/, "");
    ok(allowedNamespaceUrls.has(url), `External network destination found in ${relative}: ${url}`);
  }
}

if (failures.length) {
  console.error(`HARNESS production validation failed (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("HARNESS production web validation passed: permanent ID, five cases, frozen source hashes, art hashes, fresh unlock state, local privacy access, public privacy draft, no QA markers, no external web destinations.");
