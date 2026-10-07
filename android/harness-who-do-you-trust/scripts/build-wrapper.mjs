import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const sourceDir = path.join(root, 'www');
const distDir = path.join(root, 'dist');
const nativeSource = path.join(root, 'native', 'bootstrap.js');

const expected = new Map([
  ['assets/characters/boy.svg', '968da6e149dba7a6b27a353b86ada558ffcb38f7'],
  ['assets/characters/darth.svg', '040200767b7149845752de3c13bfc9c1fdf62c80'],
  ['assets/characters/donsol.svg', '7162c160906fe11c4c899b652fb4da7254e5aa0a'],
  ['assets/characters/tooth.svg', '376a2a95f0906d2aa4d9dd381785dbac3ceb14ea'],
  ['css/game.css', '7bf23acccc5ddd9f5eb341f17e22fedf1f81d3f4'],
  ['data/episode-001.json', '8693b45d1e45e99a10cb7a76be852b649c77f95f'],
  ['index.html', '4af3799c0679da606dd536948577fa676d89f850'],
  ['js/advice.js', 'b7194e413f6d0beacb699dcb4817a4cfc26faf44'],
  ['js/app.js', '924dd07fee154cec706f7f6ea547aa66a1dd99d0'],
  ['js/content.js', '06c62e0de8de01b46eeb37872a230bb2294c641d'],
  ['js/dom-ids.js', 'b46200c37d4e76e45b5483754eb0f40930c246e1'],
  ['js/engine.js', 'b2784f5fdf7a8c385d22b3ec44444e4880f77dfc'],
  ['js/state.js', 'fcbc5d911aed22c1bbeefcc294cc6d4671f19522'],
  ['js/telemetry.js', '927b3579e539e8e801c834b6478d5d8b77b78d15'],
]);

function gitBlobSha(buffer) {
  const header = Buffer.from(`blob ${buffer.length}\0`);
  return createHash('sha1').update(header).update(buffer).digest('hex');
}

for (const [relative, sha] of expected) {
  const file = path.join(sourceDir, relative);
  const bytes = await readFile(file);
  const actual = gitBlobSha(bytes);
  if (actual !== sha) {
    throw new Error(`Locked payload drift: ${relative} expected ${sha} but got ${actual}`);
  }
}

await rm(distDir, { recursive: true, force: true });
await cp(sourceDir, distDir, { recursive: true });

const indexPath = path.join(distDir, 'index.html');
let html = await readFile(indexPath, 'utf8');
const from = '<script type="module" src="js/app.js"></script>';
const to = '<script type="module" src="native/bootstrap.js"></script>';
const matches = html.split(from).length - 1;
if (matches !== 1) {
  throw new Error(`Expected exactly one locked app entry script, found ${matches}`);
}
html = html.replace(from, to);
await writeFile(indexPath, html, 'utf8');

const nativeDir = path.join(distDir, 'native');
await mkdir(nativeDir, { recursive: true });
await cp(nativeSource, path.join(nativeDir, 'bootstrap.js'));

console.log('Android staging build complete: 14/14 locked source blobs verified; native bootstrap injected only in dist/.');
