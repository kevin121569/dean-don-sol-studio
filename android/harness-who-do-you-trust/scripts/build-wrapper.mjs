import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const sourceDir = path.join(root, 'www');
const distDir = path.join(root, 'dist');
const sourceFile = path.join(sourceDir, 'index.html');
const episode1File = path.resolve(root, '../../games/harness-who-do-you-trust/data/episode-001.json');
const campaignBuilder = path.join(here, 'build-multilevel.mjs');
const campaignValidator = path.join(here, 'validate-multilevel.mjs');
const expectedGitBlobSha = '87a58a174e1c43471840823cbadb525dfcd877bb';
const expectedSha256 = '57ec892c224fe6f37bd922773dd33420680541f013f4d4447740f7b2b6686b71';

function gitBlobSha(buffer) {
  const header = Buffer.from(`blob ${buffer.length}\0`);
  return createHash('sha1').update(header).update(buffer).digest('hex');
}

const entries = await readdir(sourceDir, {withFileTypes: true});
const files = entries.filter(entry => entry.isFile()).map(entry => entry.name).sort();
const directories = entries.filter(entry => entry.isDirectory()).map(entry => entry.name).sort();
if (JSON.stringify(files) !== JSON.stringify(['index.html']) || directories.length) {
  throw new Error(`Locked Kate-tested v09 source must contain only index.html; found files=${files.join(',')} directories=${directories.join(',')}`);
}

const bytes = await readFile(sourceFile);
const actualGitBlobSha = gitBlobSha(bytes);
const actualSha256 = createHash('sha256').update(bytes).digest('hex');
if (actualGitBlobSha !== expectedGitBlobSha) throw new Error(`Kate-tested v09 git blob drift: expected ${expectedGitBlobSha} but got ${actualGitBlobSha}`);
if (actualSha256 !== expectedSha256) throw new Error(`Kate-tested v09 SHA-256 drift: expected ${expectedSha256} but got ${actualSha256}`);
if (bytes.length !== 1_909_490) throw new Error(`Kate-tested v09 byte count drift: expected 1909490 but got ${bytes.length}`);

const html = bytes.toString('utf8');
const requiredMarkers = [
  'HARNESS V3.4 · Illustrated Master Control v09',
  'LOOK BACK',
  'const v35Glossary=',
  'class="mc-adviser-card',
  'harness-v34:episode-002:illustrated-master-control:v09',
  'data:image/jpeg;base64,',
  'data:audio/x-wav;base64,'
];
for (const marker of requiredMarkers) {
  if (!html.includes(marker)) throw new Error(`Required Kate-tested v09 marker missing: ${marker}`);
}
const definitionCount = (html.match(/plain:/g) ?? []).length;
const jpegCount = (html.match(/data:image\/jpeg;base64,/g) ?? []).length;
const svgCount = (html.match(/data:image\/svg\+xml;base64,/g) ?? []).length;
const wavCount = (html.match(/data:audio\/x-wav;base64,/g) ?? []).length;
if (definitionCount < 20 || jpegCount < 14 || svgCount < 14 || wavCount < 3) {
  throw new Error(`Kate-tested v09 assets incomplete: definitions=${definitionCount} jpeg=${jpegCount} svg=${svgCount} wav=${wavCount}`);
}

await rm(distDir, {recursive: true, force: true});
await mkdir(distDir, {recursive: true});
for (const [script, args] of [
  [campaignBuilder, [sourceFile, episode1File, distDir]],
  [campaignValidator, [distDir]]
]) {
  const result = spawnSync(process.execPath, [script, ...args], {stdio: 'inherit'});
  if (result.status !== 0) throw new Error(`${path.basename(script)} failed with status ${result.status}`);
}

console.log(`Android staging complete: two-level HARNESS campaign built from Kevin's exact Kate-tested v09 file (${bytes.length} bytes; ${definitionCount} definitions; ${jpegCount + svgCount} graphics; ${wavCount} audio tracks).`);
