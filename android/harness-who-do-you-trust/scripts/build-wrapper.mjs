import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const sourceDir = path.join(root, 'www');
const distDir = path.join(root, 'dist');
const sourceFile = path.join(sourceDir, 'index.html');
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

// Preserve Kate's tested v09 as the only game in the Android package. The
// original locked source above is never edited. This narrow Android-only CSS
// patch prevents grid children (especially TOOTH) from forcing the adviser
// column beyond the WebView viewport at phone sizes or high display zoom.
const androidFitPatch = `
<!-- HARNESS_ANDROID_STANDALONE_V09 -->
<style id="harness-android-fit-fix">
html,body{max-width:100%;overflow-x:hidden}
.mc-shell,.mc-board,.mc-right,.mc-card,.mc-adviser-grid,.mc-adviser-card,
.mc-adviser-card>span:not(.arrow){min-width:0}
.mc-adviser-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
.mc-adviser-card{width:100%;max-width:100%;overflow:hidden}
.mc-adviser-card strong,.mc-adviser-card small,.mc-adviser-card em{
  max-width:100%;overflow-wrap:anywhere;word-break:normal
}
@media(max-width:760px){
  .mc-board,.mc-right{grid-template-columns:minmax(0,1fr)!important}
  .mc-right{grid-column:auto!important}
}
@media(max-width:430px){
  .mc-adviser-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}
  .mc-adviser-card{grid-template-columns:minmax(0,1fr)!important;padding:7px 5px}
  .mc-adviser-card img{width:100%;max-width:112px;height:102px}
}
</style>`;

if (!html.includes('</head>')) throw new Error('Kate-tested v09 is missing </head>');
const androidHtml = html.replace('</head>', `${androidFitPatch}\n</head>`);
await writeFile(path.join(distDir, 'index.html'), androidHtml);

if (!androidHtml.includes('HARNESS_ANDROID_STANDALONE_V09')) throw new Error('Android fit marker missing');
if (androidHtml.includes('TWO CASES') || androidHtml.includes('COMPLETE LEVEL 1 TO UNLOCK')) {
  throw new Error('Campaign wrapper contamination detected');
}

console.log(`Android staging complete: standalone Kate-tested HARNESS v09 (${bytes.length} locked source bytes; ${definitionCount} definitions; ${jpegCount + svgCount} graphics; ${wavCount} audio tracks).`);
