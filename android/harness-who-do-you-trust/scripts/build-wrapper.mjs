import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const sourceDir = path.join(root, 'www');
const distDir = path.join(root, 'dist');
const sourceFile = path.join(sourceDir, 'index.html');
const expectedSha = 'f89af3d17e4d099ae51dda4c0526aecdcebde947';

function gitBlobSha(buffer) {
  const header = Buffer.from(`blob ${buffer.length}\0`);
  return createHash('sha1').update(header).update(buffer).digest('hex');
}

const files = (await readdir(sourceDir, { withFileTypes: true })).filter(entry => entry.isFile()).map(entry => entry.name).sort();
const directories = (await readdir(sourceDir, { withFileTypes: true })).filter(entry => entry.isDirectory()).map(entry => entry.name).sort();
if (JSON.stringify(files) !== JSON.stringify(['index.html']) || directories.length) {
  throw new Error(`Android payload must contain only the self-contained index.html; found files=${files.join(',')} directories=${directories.join(',')}`);
}
const bytes = await readFile(sourceFile);
const actualSha = gitBlobSha(bytes);
if (actualSha !== expectedSha) throw new Error(`Locked graphics/audio payload drift: expected ${expectedSha} but got ${actualSha}`);
const html = bytes.toString('utf8');
for (const marker of ['android-graphics-audio-v2', 'START WITH SOUND', '<audio id="soundtrack"', 'data:image/svg+xml;base64', 'id="sceneDebrief"']) {
  if (!html.includes(marker)) throw new Error(`Required graphics/audio marker missing: ${marker}`);
}
if (bytes.length < 1_200_000) throw new Error(`Payload is unexpectedly small (${bytes.length} bytes)`);

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });
await cp(sourceFile, path.join(distDir, 'index.html'));
console.log(`Android staging complete: locked cinematic payload verified (${bytes.length} bytes, embedded graphics + audio).`);
