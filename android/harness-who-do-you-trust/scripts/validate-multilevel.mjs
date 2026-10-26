import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';

const dir = process.argv[2] ? path.resolve(process.argv[2]) : path.join(process.cwd(), 'campaign');
const files = ['index.html', 'level-1.html', 'level-2.html'];
const html = Object.fromEntries(files.map(name => [name, fs.readFileSync(path.join(dir, name), 'utf8')]));
const failures = [];
const ok = (condition, message) => condition ? null : failures.push(message);

function scripts(document, name) {
  const found = [...document.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
  found.forEach((body, index) => {
    try { new vm.Script(body, {filename: `${name}:inline-${index + 1}.js`}); }
    catch (error) { failures.push(`${name} script ${index + 1}: ${error.message}`); }
  });
  return found;
}

function episode(document, name) {
  const startMarker = 'window.HarnessEpisode = ';
  const start = document.indexOf(startMarker);
  const end = document.indexOf('\n\n</script>', start);
  ok(start >= 0 && end > start, `${name}: episode payload missing`);
  if (start < 0 || end < 0) return null;
  const raw = document.slice(start + startMarker.length, end).replace(/;\s*$/, '');
  try { return JSON.parse(raw); }
  catch (error) { failures.push(`${name}: episode JSON ${error.message}`); return null; }
}

for (const name of files) scripts(html[name], name);
const ep1 = episode(html['level-1.html'], 'level-1.html');
const ep2 = episode(html['level-2.html'], 'level-2.html');

ok(ep1?.id === 'episode-001', 'Level 1 does not carry Episode 001');
ok(ep1?.title === 'Server 4', 'Level 1 title is not Server 4');
ok(ep1?.evidence?.length === 5, 'Level 1 must have five canonical evidence records');
ok(ep1?.advisors?.darth?.name === 'LUKE', 'Level 1 adviser identity must match current LUKE presentation');
ok(ep2?.id === 'episode-002', 'Level 2 does not carry Episode 002');
ok(ep2?.evidence?.length === 6, 'Level 2 must retain its six evidence records');
ok(ep2?.evidence?.some(x => x.id === 'e_harbor'), 'Level 2 harbor record missing');

ok(html['index.html'].includes('COMPLETE LEVEL 1 TO UNLOCK'), 'Level 2 is not visibly locked at campaign start');
ok(html['index.html'].includes("a.href='level-2.html'"), 'Campaign hub does not unlock Level 2');
ok(html['level-1.html'].includes('NEXT="level-2.html"'), 'Level 1 has no Level 2 continuation target');
ok(html['level-1.html'].includes('CONTINUE TO LEVEL 2'), 'Level 1 completion CTA missing');
ok(html['level-1.html'].includes('YELLOW WORDS ARE TAPPABLE'), 'Level 1 definitions guidance missing');
ok((html['level-1.html'].match(/plain:/g) || []).length >= 20, 'Level 1 definition set is unexpectedly small');
ok((html['level-1.html'].match(/mc-adviser-card/g) || []).length >= 2, 'Level 1 illustrated adviser-card system missing');
ok(html['level-1.html'].includes("adviserFile=id=>'v34/'"), 'Level 1 current adviser portrait mapping missing');
ok(html['level-2.html'].includes('TRY ANOTHER ENDING'), 'Level 2 alternate-ending replay missing');
ok(html['level-2.html'].includes('CAMPAIGN COMPLETE'), 'Level 2 campaign completion state missing');
ok(html['level-2.html'].includes('harness-v34:episode-002:illustrated-master-control:v12-motorola-audio-scroll-fix'), 'Level 2 tested save identity missing');

for (const [name, document] of Object.entries(html)) {
  for (const link of [...document.matchAll(/href="([^"]+\.html)"/g)].map(m => m[1])) {
    ok(fs.existsSync(path.join(dir, link)), `${name}: broken local link ${link}`);
  }
}

const hashes = Object.fromEntries(files.map(name => [name, crypto.createHash('sha256').update(html[name]).digest('hex')]));
if (failures.length) {
  console.error(JSON.stringify({ok:false, failures, hashes}, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ok:true, checks:21, hashes, episodes:{level1:ep1.title,level2:ep2.title}}, null, 2));
