import { createHash } from 'node:crypto';
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const sourceDir = path.join(root, 'www');
const distDir = path.join(root, 'dist');
const nativeSource = path.join(root, 'native', 'bootstrap.js');

const expected = new Map([
  ['assets/characters/boy.svg', '968da6e149dba7a6b27a353b86ada558ffcb38f7'],
  ['assets/characters/darth.svg', '9ea1e191b1c663dae85ce482c52b7479f6bd0da0'],
  ['assets/characters/donsol.svg', '7162c160906fe11c4c899b652fb4da7254e5aa0a'],
  ['assets/characters/tooth.svg', '376a2a95f0906d2aa4d9dd381785dbac3ceb14ea'],
  ['creative/audio.js', '739abb5d662e3f1536045801d57453663c709926'],
  ['creative/creative.js', 'c4a8f752dd4b2c0b77f0f79a21cd91ac3b8a5353'],
  ['creative/intro-script.json', '16340b60662cd16a11cbd4199efaa30036f74fac'],
  ['creative/intro.js', '8fb15175234b65c13d477b6a6d3c159a25e43987'],
  ['creative/mission-report.js', '98f01848b83a8b89c66e1b04d4c22fec78c9ee9e'],
  ['css/game.css', '4f1b16d5b1812ea09bde28e7dd628ecdfb2384b2'],
  ['data/episode-001.json', 'c8336a4f6d4965462e2d180312cc8dfcf5d131fd'],
  ['index.html', 'dd7a7abe57130e5103921947512663a80bb09110'],
  ['js/advice.js', 'b7194e413f6d0beacb699dcb4817a4cfc26faf44'],
  ['js/app.js', '580eb6247cfa3b017dd1b7f68dc403588804f6ba'],
  ['js/content.js', '5742da8c04b6cbfcd968e50d86d40745d4a391a7'],
  ['js/dom-ids.js', '341a9512bd2a9ffa4f232d03c7a2d1dbfafcc9fc'],
  ['js/engine.js', 'b2784f5fdf7a8c385d22b3ec44444e4880f77dfc'],
  ['js/state.js', 'fcbc5d911aed22c1bbeefcc294cc6d4671f19522'],
  ['js/telemetry.js', '927b3579e539e8e801c834b6478d5d8b77b78d15'],
]);

function gitBlobSha(buffer) {
  const header = Buffer.from(`blob ${buffer.length}\0`);
  return createHash('sha1').update(header).update(buffer).digest('hex');
}

async function listFiles(directory, prefix = '') {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relative = path.join(prefix, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(path.join(directory, entry.name), relative));
    else if (entry.isFile()) files.push(relative.split(path.sep).join('/'));
  }
  return files.sort();
}

const actualFiles = await listFiles(sourceDir);
const expectedFiles = [...expected.keys()].sort();
if (JSON.stringify(actualFiles) !== JSON.stringify(expectedFiles)) {
  throw new Error(`Locked payload file list drift:\nexpected ${expectedFiles.join(', ')}\nactual ${actualFiles.join(', ')}`);
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
const to = '<script type="module" src="native/bootstrap.bundle.js"></script>';
const matches = html.split(from).length - 1;
if (matches !== 1) {
  throw new Error(`Expected exactly one locked app entry script, found ${matches}`);
}
html = html.replace(from, to);
await writeFile(indexPath, html, 'utf8');

const nativeDir = path.join(distDir, 'native');
await mkdir(nativeDir, { recursive: true });
await cp(nativeSource, path.join(nativeDir, 'bootstrap.js'));

console.log('Android staging complete: 19/19 locked R1 source blobs verified; native bootstrap is ready to bundle.');
