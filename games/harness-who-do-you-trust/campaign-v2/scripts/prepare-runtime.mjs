import {createHash} from "node:crypto";
import {execFileSync} from "node:child_process";
import {copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {dirname, join, resolve} from "node:path";
import {fileURLToPath} from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const campaignRoot = resolve(here, "..");
const repoRoot = resolve(campaignRoot, "../../..");
const frozen = JSON.parse(readFileSync(join(campaignRoot, "frozen-sources.json"), "utf8"));
const level2 = join(repoRoot, "android/harness-who-do-you-trust/www/index.html");
const outputDir = join(campaignRoot, "build");
const temporary = mkdtempSync(join(tmpdir(), "harness-campaign-runtime-"));
const historicalInputs = Object.freeze({
  generator: {
    ref: "2c7b0afeb20c418df0d526fc3bdc2933dac9859d:android/harness-who-do-you-trust/scripts/build-multilevel.mjs",
    hash: "de460b4a109780aa1e9e96b8db0a64f927470b9cce6c359bcb722f9508b4779a",
    filename: "approved-builder.mjs"
  },
  episode: {
    ref: "bdcf40c00cbc27cfc7dfaf966b9105791d299148:games/harness-who-do-you-trust/data/episode-001.json",
    hash: "2b80d1945aafbfbef81641c2ed61434a51369aa316ed0721fc8039a6b43964fc",
    filename: "approved-episode-001.json"
  }
});

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

try {
  const materialized = {};
  for (const [name, input] of Object.entries(historicalInputs)) {
    const path = join(temporary, input.filename);
    let bytes;
    try {
      bytes = execFileSync("git", ["show", input.ref], {cwd: repoRoot, maxBuffer: 4 * 1024 * 1024});
    } catch {
      throw new Error(`The approved ${name} input is unavailable. Fetch full repository history before preparing the campaign runtime.`);
    }
    writeFileSync(path, bytes);
    if (sha256(path) !== input.hash) throw new Error(`The approved ${name} input fingerprint changed.`);
    materialized[name] = path;
  }

  if (sha256(level2) !== frozen.level2Monolith.sha256) throw new Error("The approved Level 2 source fingerprint changed.");
  execFileSync(process.execPath, [materialized.generator, level2, materialized.episode, temporary], {stdio: "ignore"});
  const generated = join(temporary, "level-1.html");
  const actual = sha256(generated);
  const expected = frozen.level1Monolith.sha256;
  if (actual !== expected) throw new Error(`Generated Level 1 fingerprint changed: expected ${expected}, received ${actual}`);
  mkdirSync(outputDir, {recursive: true});
  copyFileSync(generated, join(outputDir, "level-1.html"));
  console.log(`Prepared approved Level 1 runtime: ${actual}`);
} finally {
  rmSync(temporary, {recursive: true, force: true});
}
