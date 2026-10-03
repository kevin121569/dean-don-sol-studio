// Static regression check for the studio site. No dependencies; run with `node scripts/check-site.mjs`.
// Exit code 1 on any failure. Warnings never fail the run.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const exists = rel => fs.existsSync(path.join(root, rel));
const failures = [], warnings = [];
const fail = msg => failures.push(msg), warn = msg => warnings.push(msg);

// Release-status contract from GOOGLE_PLAY_WEEKEND_LAUNCH_CONTROL.md.
// Only titles listed here are asserted; change a label only when the control board changes.
const EXPECTED_STATUS = {
  harness: 'Editorial hold',
  memory: 'Source-file hold',
  questions: 'In progress',
};
const FORBIDDEN_FOR_HELD = /ready to publish|preparing for release|google-ready epub complete|final rc1/i;

const context = {window: {}};
vm.runInNewContext(read('data.js'), context);
const books = context.window.IL_BOOKS;

// 1. Every local href/src in every tracked HTML page resolves to a file.
const htmlFiles = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(path.join(root, dir), {withFileTypes: true})) {
    const rel = path.posix.join(dir, entry.name);
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || rel === 'backups') continue;
    if (entry.isDirectory()) walk(rel);
    else if (entry.name.endsWith('.html')) htmlFiles.push(rel);
  }
})('');
for (const file of htmlFiles) {
  const html = read(file);
  for (const [, url] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (/^(https?:|mailto:|tel:|data:|#|javascript:)/.test(url) || url.includes('${')) continue;
    const clean = url.split(/[?#]/)[0];
    if (!clean) continue;
    let target = clean.startsWith('/') ? clean.slice(1) : path.posix.join(path.posix.dirname(file), clean);
    if (target === '' || target.endsWith('/')) target += 'index.html';
    if (!exists(target) && !exists(path.posix.join(target, 'index.html'))) fail(`${file}: broken link ${url}`);
  }
  if (!/name="viewport"/.test(html)) fail(`${file}: missing responsive viewport meta`);
}

// 2. Every catalog book keeps its page, cover, and sample.
for (const b of books) {
  if (!exists(`${b.slug}/index.html`)) fail(`${b.id}: missing book page /${b.slug}/`);
  if (!b.cover || !exists(b.cover)) fail(`${b.id}: missing cover ${b.cover}`);
  if (!b.sample || !exists(b.sample)) fail(`${b.id}: missing web sample ${b.sample}`);
  if (b.samplePdf && !exists(b.samplePdf)) fail(`${b.id}: missing sample PDF ${b.samplePdf}`);
  if (!read('index.html').includes(`href="/${b.slug}/"`)) fail(`${b.id}: homepage card link missing`);
  // "Published" is only truthful once a retailer listing is live; flag until a retailUrl is recorded.
  if (/published/i.test(b.status) && !b.retailUrl) warn(`${b.id}: status "Published" has no retailUrl recorded in data.js`);
}

// 3. Harness teaser video stays wired up.
if (!exists('assets/video/harness-backhoe-tooth.mp4')) fail('Harness teaser video asset missing');
if (!read('the-harness/clips.html').includes('assets/video/harness-backhoe-tooth.mp4')) fail('clips.html no longer references the teaser video');

// 4. Release statuses match the launch control board on every surface that shows them.
const statusIn = html => [...html.matchAll(/<span class="status [^"]*">([^<]*)<\/span>/g)].map(m => m[1]);
const homeCard = id => {
  const slug = books.find(b => b.id === id).slug;
  const m = read('index.html').match(new RegExp(`<article class="book"[^>]*><a [^>]*href="/${slug}/"[\\s\\S]*?</article>`));
  return m ? m[0] : '';
};
const appJs = read('app.js');
for (const [id, label] of Object.entries(EXPECTED_STATUS)) {
  const b = books.find(x => x.id === id);
  if (b.status !== label) fail(`${id}: data.js status "${b.status}" ≠ "${label}"`);
  if (FORBIDDEN_FOR_HELD.test(b.detail || '')) fail(`${id}: data.js detail still claims release readiness: "${b.detail}"`);
  const page = read(`${b.slug}/index.html`);
  if (statusIn(page)[0] !== label) fail(`${id}: book page status "${statusIn(page)[0]}" ≠ "${label}"`);
  if (FORBIDDEN_FOR_HELD.test(page)) fail(`${id}: book page still contains release-ready wording`);
  if (statusIn(homeCard(id))[0] !== label) fail(`${id}: homepage card status "${statusIn(homeCard(id))[0]}" ≠ "${label}"`);
}
// app.js rewrites the Harness card at runtime, so its override must agree too.
if (!appJs.includes(`status.textContent = '${EXPECTED_STATUS.harness}'`)) fail('app.js Harness card override does not set the expected status');
if (/Preparing for release/.test(read('the-harness/media-kit.html'))) fail('media kit still says "Preparing for release"');

// 5. Existing games are frozen: byte-for-byte (line endings normalized) against scripts/locked-files.json.
const lock = JSON.parse(read('scripts/locked-files.json'));
for (const [file, hash] of Object.entries(lock)) {
  if (file.startsWith('_')) continue;
  if (!exists(file)) { fail(`locked file missing: ${file}`); continue; }
  let bytes = fs.readFileSync(path.join(root, file));
  if (/\.(html|js|css|json|md|txt)$/.test(file)) bytes = Buffer.from(bytes.toString('utf8').replace(/\r\n/g, '\n'));
  if (crypto.createHash('sha256').update(bytes).digest('hex') !== hash) fail(`locked game file changed: ${file} — run the game regression plan, then update scripts/locked-files.json`);
}

for (const w of warnings) console.log(`WARN  ${w}`);
for (const f of failures) console.log(`FAIL  ${f}`);
console.log(`${htmlFiles.length} pages, ${books.length} books checked · ${failures.length} failures · ${warnings.length} warnings`);
process.exit(failures.length ? 1 : 0);
