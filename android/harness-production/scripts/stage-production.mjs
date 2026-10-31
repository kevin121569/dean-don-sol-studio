import {cp, mkdir, readFile, rm, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const wrapperRoot = path.resolve(here, "..");
const repoRoot = path.resolve(wrapperRoot, "../..");
const campaignRoot = path.join(repoRoot, "games/harness-who-do-you-trust/campaign-v2");
const approvedLevel2 = path.join(repoRoot, "android/harness-who-do-you-trust/www/index.html");
const distRoot = path.join(wrapperRoot, "dist");
const stagedCampaign = path.join(distRoot, "campaign");

await rm(distRoot, {recursive: true, force: true});
await mkdir(path.join(stagedCampaign, "build"), {recursive: true});

for (const directory of ["app", "runtime", "data", "assets"]) {
  await cp(path.join(campaignRoot, directory), path.join(stagedCampaign, directory), {recursive: true});
}

await cp(path.join(campaignRoot, "build/level-1.html"), path.join(stagedCampaign, "build/level-1.html"));
await cp(approvedLevel2, path.join(stagedCampaign, "build/level-2.html"));

const sourceManifest = JSON.parse(await readFile(path.join(campaignRoot, "campaign.json"), "utf8"));
const stagedManifest = structuredClone(sourceManifest);
delete stagedManifest.qa;

const case2 = stagedManifest.cases.find((item) => item.id === "episode-002");
if (!case2?.runtime) throw new Error("Campaign manifest is missing Case 2.");
case2.runtime.source = "build/level-2.html";

await writeFile(
  path.join(stagedCampaign, "campaign.json"),
  `${JSON.stringify(stagedManifest, null, 2)}\n`
);

const rootHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="theme-color" content="#07151f">
  <title>HARNESS: Who Do You Trust?</title>
  <script>location.replace("./campaign/app/index.html");</script>
</head>
<body>
  <main>
    <h1>HARNESS: Who Do You Trust?</h1>
    <p><a href="./campaign/app/index.html">Open game</a></p>
  </main>
</body>
</html>
`;

await writeFile(path.join(distRoot, "index.html"), rootHtml);

console.log("HARNESS production web stage ready; five-case H3 campaign staged without QA identity.");
