import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const sourceDir = path.join(root, 'www');
const distDir = path.join(root, 'dist');
const sourceFile = path.join(sourceDir, 'index.html');
const expectedGitBlobSha = 'a9baa37b48138e1a5c6cef144474334aa928ab55';
const expectedSha256 = '83089e531ae5a88162f54d68cee96bb0146f2bf2fa0793333595c704a66d8b60';

function gitBlobSha(buffer) {
  const header = Buffer.from(`blob ${buffer.length}\0`);
  return createHash('sha1').update(header).update(buffer).digest('hex');
}

const entries = await readdir(sourceDir, { withFileTypes: true });
const files = entries.filter(entry => entry.isFile()).map(entry => entry.name).sort();
const directories = entries.filter(entry => entry.isDirectory()).map(entry => entry.name).sort();
if (JSON.stringify(files) !== JSON.stringify(['index.html']) || directories.length) {
  throw new Error(`V3.4 payload must contain only the self-contained index.html; found files=${files.join(',')} directories=${directories.join(',')}`);
}

const bytes = await readFile(sourceFile);
const actualGitBlobSha = gitBlobSha(bytes);
const actualSha256 = createHash('sha256').update(bytes).digest('hex');
if (actualGitBlobSha !== expectedGitBlobSha) throw new Error(`Locked V3.4 git blob drift: expected ${expectedGitBlobSha} but got ${actualGitBlobSha}`);
if (actualSha256 !== expectedSha256) throw new Error(`Locked V3.4 SHA-256 drift: expected ${expectedSha256} but got ${actualSha256}`);
if (bytes.length !== 1_916_208) throw new Error(`Locked V3.4 byte count drift: expected 1916208 but got ${bytes.length}`);

const html = bytes.toString('utf8');
const requiredMarkers = [
  'HARNESS V3.4 · Illustrated Master Control v12',
  'YELLOW WORDS ARE TAPPABLE',
  'FOUR CLUES CHECKED',
  'MAKE YOUR CALL →',
  'LOOK BACK',
  'const v35Glossary=',
  'class="mc-adviser-card',
  'v12-motorola-audio-scroll-fix',
  "addEventListener('pagehide'",
  '},1500);'
];
for (const marker of requiredMarkers) {
  if (!html.includes(marker)) throw new Error(`Required child-test/V3.4 marker missing: ${marker}`);
}
const definitionCount = (html.match(/^\s*[a-zA-Z][a-zA-Z0-9_-]*:\s*\{/gm) ?? []).length;
const jpegCount = (html.match(/data:image\/jpeg;base64,/g) ?? []).length;
const svgCount = (html.match(/data:image\/svg\+xml;base64,/g) ?? []).length;
const wavCount = (html.match(/data:audio\/x-wav;base64,/g) ?? []).length;
if (definitionCount < 20 || jpegCount < 14 || svgCount < 14 || wavCount < 3) {
  throw new Error(`V3.4 assets incomplete: definitions=${definitionCount} jpeg=${jpegCount} svg=${svgCount} wav=${wavCount}`);
}

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });
await cp(sourceFile, path.join(distDir, 'index.html'));
console.log(`Android staging complete: exact Harness V3.4 v12 verified (${bytes.length} bytes; ${definitionCount}+ definitions; ${jpegCount + svgCount} graphics; ${wavCount} audio tracks).`);
