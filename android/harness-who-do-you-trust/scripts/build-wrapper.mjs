import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
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

const entries = await readdir(sourceDir, {withFileTypes: true});
const files = entries.filter(entry => entry.isFile()).map(entry => entry.name).sort();
const directories = entries.filter(entry => entry.isDirectory()).map(entry => entry.name).sort();
if (JSON.stringify(files) !== JSON.stringify(['index.html']) || directories.length) {
  throw new Error(`Locked approved v12 source must contain only index.html; found files=${files.join(',')} directories=${directories.join(',')}`);
}

const bytes = await readFile(sourceFile);
const actualGitBlobSha = gitBlobSha(bytes);
const actualSha256 = createHash('sha256').update(bytes).digest('hex');
if (actualGitBlobSha !== expectedGitBlobSha) throw new Error(`Approved v12 git blob drift: expected ${expectedGitBlobSha} but got ${actualGitBlobSha}`);
if (actualSha256 !== expectedSha256) throw new Error(`Approved v12 SHA-256 drift: expected ${expectedSha256} but got ${actualSha256}`);
if (bytes.length !== 1_916_208) throw new Error(`Approved v12 byte count drift: expected 1916208 but got ${bytes.length}`);

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
  '},1500);',
  'data:image/jpeg;base64,',
  'data:audio/x-wav;base64,'
];
for (const marker of requiredMarkers) {
  if (!html.includes(marker)) throw new Error(`Required approved v12 marker missing: ${marker}`);
}
const definitionCount = (html.match(/plain:/g) ?? []).length;
const jpegCount = (html.match(/data:image\/jpeg;base64,/g) ?? []).length;
const svgCount = (html.match(/data:image\/svg\+xml;base64,/g) ?? []).length;
const wavCount = (html.match(/data:audio\/x-wav;base64,/g) ?? []).length;
if (definitionCount < 20 || jpegCount < 14 || svgCount < 14 || wavCount < 3) {
  throw new Error(`Approved v12 assets incomplete: definitions=${definitionCount} jpeg=${jpegCount} svg=${svgCount} wav=${wavCount}`);
}

await rm(distDir, {recursive: true, force: true});
await mkdir(distDir, {recursive: true});

// Package approved v12 without changing layout, graphics, audio, interaction
// code, or copy. Correct only the stale internal v09 identity inherited by
// the v12 source so device diagnostics cannot misreport this build.
function replaceIdentityOnce(text, from, to) {
  const count = text.split(from).length - 1;
  if (count !== 1) throw new Error(`Expected one stale identity marker, found ${count}: ${from}`);
  return text.replace(from, to);
}

let androidHtml = html;
androidHtml = replaceIdentityOnce(androidHtml, "version:'3.4-illustrated-master-control-v09'", "version:'3.4-illustrated-master-control-v12'");
androidHtml = replaceIdentityOnce(androidHtml, "sourceBlob:'v34-v09-phone-interaction-visible-audio-from-v34-v08'", "sourceBlob:'v34-v12-motorola-audio-scroll-fix'");
androidHtml = androidHtml.replace('</head>', '<!-- HARNESS_ANDROID_CURRENT_V12 -->\n</head>');
await writeFile(path.join(distDir, 'index.html'), androidHtml);

if (!androidHtml.includes("version:'3.4-illustrated-master-control-v12'") ||
    !androidHtml.includes('HARNESS_ANDROID_CURRENT_V12')) {
  throw new Error('Current v12 identity markers missing');
}
if (androidHtml.includes('TWO CASES') || androidHtml.includes('COMPLETE LEVEL 1 TO UNLOCK')) {
  throw new Error('Campaign wrapper contamination detected');
}

console.log(`Android staging complete: standalone HARNESS CURRENT v12 (${bytes.length} locked source bytes; identity metadata corrected; ${definitionCount} definitions; ${jpegCount + svgCount} graphics; ${wavCount} audio tracks).`);
