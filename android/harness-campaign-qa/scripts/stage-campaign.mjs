import {createHash} from "node:crypto";
import {cp, mkdir, readFile, readdir, rm, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const BUILD_ID = "C3-20261027-A";
const here = path.dirname(fileURLToPath(import.meta.url));
const wrapperRoot = path.resolve(here, "..");
const repoRoot = path.resolve(wrapperRoot, "../..");
const campaignRoot = path.join(repoRoot, "games/harness-who-do-you-trust/campaign-v2");
const approvedLevel2 = path.join(repoRoot, "android/harness-who-do-you-trust/www/index.html");
const distRoot = path.join(wrapperRoot, "dist");
const stagedCampaign = path.join(distRoot, "campaign");

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function replaceOnce(text, from, to, label) {
  const count = text.split(from).length - 1;
  if (count !== 1) throw new Error(`Expected one ${label}; found ${count}.`);
  return text.replace(from, to);
}

async function recursiveFiles(root, directory = root) {
  const entries = await readdir(directory, {withFileTypes: true});
  const files = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await recursiveFiles(root, absolute));
    else if (entry.isFile()) files.push(path.relative(root, absolute).split(path.sep).join("/"));
  }
  return files;
}

await rm(distRoot, {recursive: true, force: true});
await mkdir(path.join(stagedCampaign, "build"), {recursive: true});

for (const directory of ["app", "runtime", "data", "assets"]) {
  await cp(path.join(campaignRoot, directory), path.join(stagedCampaign, directory), {recursive: true});
}

await cp(path.join(campaignRoot, "build/level-1.html"), path.join(stagedCampaign, "build/level-1.html"));
await cp(approvedLevel2, path.join(stagedCampaign, "build/level-2.html"));

const sourceManifest = JSON.parse(await readFile(path.join(campaignRoot, "campaign.json"), "utf8"));
const stagedManifest = structuredClone(sourceManifest);
const case2 = stagedManifest.cases.find((item) => item.id === "episode-002");
const case3 = stagedManifest.cases.find((item) => item.id === "episode-003");
if (!case2?.runtime || !case3) throw new Error("Campaign manifest is missing Case 2 or Case 3.");
case2.runtime.source = "build/level-2.html";
case3.launch = "./play.html?case=episode-003&qa=C3-20261027-A";
case3.status = "qa-playable";
stagedManifest.qa = {
  buildId: BUILD_ID,
  appId: "com.theidealabstudio.harness.campaign.case3qa",
  caseId: "episode-003",
  productionRelease: false
};
await writeFile(path.join(stagedCampaign, "campaign.json"), `${JSON.stringify(stagedManifest, null, 2)}\n`);

const qaBanner = `<div id="qaBuildBanner" style="position:relative;z-index:1000;padding:8px 12px;background:#ffd166;color:#07151f;font:950 12px/1.3 system-ui;text-align:center;letter-spacing:.08em">HARNESS QA · CASE 3 · ${BUILD_ID} · NOT FOR PLAY STORE</div>`;
for (const filename of ["index.html", "case.html", "play.html"]) {
  const target = path.join(stagedCampaign, "app", filename);
  const html = await readFile(target, "utf8");
  await writeFile(target, replaceOnce(html, "<body>", `<body>\n  ${qaBanner}`, `${filename} body marker`));
}

const rootHtml = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#07151f"><title>HARNESS QA · Case 3</title>
<style>:root{color-scheme:dark;font-family:Inter,system-ui,sans-serif;background:#06111a;color:#edf8ff}*{box-sizing:border-box}body{margin:0;min-height:100svh;display:grid;place-items:center;padding:16px;background:radial-gradient(circle at 80% 0,#17445b,transparent 38rem),#06111a}.card{width:min(100%,520px);padding:24px;border:1px solid #2c627c;border-radius:22px;background:#0b2230;box-shadow:0 22px 60px #0008}.build{display:inline-block;padding:6px 9px;border-radius:99px;background:#ffd166;color:#07151f;font-size:12px;font-weight:950;letter-spacing:.08em}h1{margin:16px 0 4px;font-size:clamp(32px,10vw,52px);line-height:.95}h2{margin:0 0 18px;color:#62dcf1;font-size:20px}p{color:#bdd3df;line-height:1.55}.warning{padding:12px;border-left:4px solid #ff6b6b;background:#321d24;color:#ffdadd}.actions{display:grid;gap:10px;margin-top:20px}button,a{min-height:52px;display:flex;align-items:center;justify-content:center;border-radius:12px;font:900 16px system-ui;text-decoration:none;cursor:pointer}.primary{border:1px solid #9cefff;background:#62dcf1;color:#06202a}.secondary{border:1px solid #37677d;background:#102f3f;color:#edf8ff}.small{margin-top:18px;color:#87a5b4;font-size:12px}</style></head>
<body><main class="card"><span class="build">BUILD ${BUILD_ID}</span><h1>HARNESS QA</h1><h2>Case 3 phone gate</h2><p>This separate test app contains the exact approved Cases 1–2 plus the new playable Case 3 renderer and Cold Mirror art.</p><p class="warning"><strong>QA ONLY:</strong> This cannot replace the old game and must never be uploaded to Google Play.</p><div class="actions"><button id="startCase3" class="primary">START CASE 3 DEVICE TEST →</button><a class="secondary" href="./campaign/app/index.html">OPEN FULL CAMPAIGN</a></div><p id="status" class="small">Case 3 test access changes only this QA app's local storage.</p></main>
<script type="module">import{createCampaignStore}from'./campaign/runtime/campaign-store.mjs';const status=document.querySelector('#status');document.querySelector('#startCase3').addEventListener('click',async()=>{try{const manifest=await fetch('./campaign/campaign.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('Manifest unavailable');return r.json()});const store=createCampaignStore(manifest);if(store.caseStatus('episode-003')==='locked'){store.saveCase('episode-001',{episodeId:'episode-001',completed:true,outcomeId:'qa-prerequisite-pass',sceneId:'review'});store.saveCase('episode-002',{episodeId:'episode-002',completed:true,outcomeId:'qa-prerequisite-pass',sceneId:'review'})}if(store.caseStatus('episode-003')==='locked')throw new Error('QA prerequisite seeding failed');location.href='./campaign/app/play.html?case=episode-003&qa=${BUILD_ID}'}catch(error){status.textContent='BLOCKED: '+error.message;status.style.color='#ff9d9d'}});</script></body></html>`;
await writeFile(path.join(distRoot, "index.html"), rootHtml);

const inventoryFiles = (await recursiveFiles(distRoot)).filter((file) => file !== "qa-manifest.json");
const inventory = {};
for (const file of inventoryFiles) inventory[file] = sha256(await readFile(path.join(distRoot, file)));
await writeFile(path.join(distRoot, "qa-manifest.json"), `${JSON.stringify({buildId: BUILD_ID, files: inventory}, null, 2)}\n`);

console.log(`HARNESS QA web stage ready: ${BUILD_ID}; ${inventoryFiles.length} fingerprinted files.`);

