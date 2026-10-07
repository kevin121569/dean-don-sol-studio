// r7: two LOW validation regressions in r6. (1) Stage 2 must prove every required advice block present, not just
// four keys, so stage 3 can never dereference a missing block. (2) Shape-stage labels must check length before any
// whole-string operation. Instrumented: exceptions, stage-3 reachability, and string-scanning primitives.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateEpisode, loadEpisode, REQUIRED_ADVISORS} from '../js/content.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const shipped = JSON.parse(fs.readFileSync(path.join(root, 'data/episode-001.json'), 'utf8'));
const clone = v => structuredClone(v);
const MAX = 64;

async function serve(body, fn) {
  const server = http.createServer((req, res) => { res.writeHead(200, {'Content-Type': 'application/json'}); res.end(body); });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  try { return await fn(`http://127.0.0.1:${server.address().port}/episode.json`); } finally { await new Promise(r => server.close(r)); }
}

// =============================================================================================================
// 1. Missing required advice block (replaced by an unexpected key) fails in stage 2, never reaches stage 3
// =============================================================================================================
for (const adviser of REQUIRED_ADVISORS) {
  test(`r7-1 advice.${adviser} replaced by an unexpected key: problems returned, no exception, stage 3 never reached`, async () => {
    const ep = clone(shipped);
    ep.advice.other = ep.advice[adviser];
    delete ep.advice[adviser];
    // Stage-3 sentinel: an over-long episode id that ONLY stage 3 reports. Its absence proves stage 3 did not run.
    ep.id = 'e' + 'x'.repeat(300000);
    let problems;
    assert.doesNotThrow(() => { problems = validateEpisode(ep); });
    assert(problems.includes('advice must have exactly the four required blocks'), problems.join('\n'));
    assert(problems.includes(`advice.${adviser}: required block is missing — the advice blocks must be exactly boy, tooth, darth, donsol`), problems.join('\n'));
    assert(!problems.some(p => /identifier is 300000 characters/.test(p)), 'stage 3 ran on a malformed shape');
    // The real loader rejects normally (an Error with the message), not with a TypeError.
    await serve(JSON.stringify(ep), url => assert.rejects(loadEpisode(url), err => err.constructor === Error && err.message.includes(`advice.${adviser}: required block is missing`)));
  });
}

test('r7-1 stage-2 invariant: 476 malformed shapes plus every required-key replacement return problems and never throw', () => {
  const paths = [[], ['id'], ['version'], ['title'], ['briefing'], ['briefing', 'paragraphs'], ['evidence'], ['evidence', 0], ['evidence', 0, 'id'], ['evidence', 0, 'body'],
    ['advisorOrder'], ['advisorOrder', 0], ['advisors'], ['advisors', 'boy'], ['advisors', 'boy', 'icon'], ['advice'], ['advice', 'boy'], ['advice', 'boy', 0], ['advice', 'boy', 0, 'id'],
    ['advice', 'tooth', 0, 'when'], ['advice', 'tooth', 0, 'when', 'inspected'], ['advice', 'tooth', 0, 'when', 'inspected', 0], ['advice', 'boy', 0, 'reveals'], ['advice', 'boy', 0, 'reveals', 0],
    ['hybridUnlock'], ['hybridUnlock', 'inspected'], ['hybridUnlock', 'inspected', 0], ['decisions'], ['decisions', 0], ['decisions', 0, 'id'], ['decisions', 0, 'outcome'],
    ['postmortem'], ['postmortem', 'd_shutdown'], ['postmortem', 'd_shutdown', 'advisors'], ['postmortem', 'd_shutdown', 'advisors', 'boy'], ['postmortem', 'd_shutdown', 'unknown']];
  const values = [undefined, null, 0, 42, true, '', ' ', 'x', [], [null], {}, {length: 3}, ' '.repeat(100)];
  const set = (o, p, v) => { if (!p.length) return v; let t = o; for (const k of p.slice(0, -1)) t = t[k]; if (v === undefined) delete t[p.at(-1)]; else t[p.at(-1)] = v; return o; };
  let runs = 0;
  for (const p of paths) for (const v of values) {
    const ep = set(clone(shipped), p, v); runs++;
    assert.doesNotThrow(() => validateEpisode(ep), `${p.join('.')} = ${JSON.stringify(v)}`);
  }
  for (const obj of ['advice', 'advisors']) for (const a of REQUIRED_ADVISORS) {
    const ep = clone(shipped); ep[obj].other = ep[obj][a]; delete ep[obj][a]; runs++;
    let problems; assert.doesNotThrow(() => { problems = validateEpisode(ep); }, `${obj}.${a} replaced`);
    assert(problems.length > 0);
  }
  assert.equal(runs, 476);
});

// =============================================================================================================
// 2. Shape-stage labels never scan an over-limit identifier
// =============================================================================================================
/** Count whole-string scanning operations on strings longer than the identifier limit during `fn`. */
function countLongScans(fn) {
  const long = s => typeof s === 'string' && s.length > MAX;
  const counts = {calls: 0, chars: 0};
  const note = s => { if (long(s)) { counts.calls++; counts.chars += s.length; } };
  const originals = {};
  for (const m of ['trim', 'trimStart', 'trimEnd', 'normalize']) {
    originals[m] = String.prototype[m];
    String.prototype[m] = function (...args) { note(String(this)); return originals[m].apply(this, args); };
  }
  // RegExp#test, String#match/replace/search/split all route through RegExp.prototype.exec.
  originals.exec = RegExp.prototype.exec;
  RegExp.prototype.exec = function (s) { note(s); return originals.exec.call(this, s); };
  try { fn(); } finally {
    for (const m of ['trim', 'trimStart', 'trimEnd', 'normalize']) String.prototype[m] = originals[m];
    RegExp.prototype.exec = originals.exec;
  }
  return counts;
}
/** 32 = 4 advisers × 8 variants (the r4 maximum), each with id `makeId(i)` and a shape-stage-visible condition. */
const withVariantIds = makeId => {
  const ep = clone(shipped);
  let n = 0;
  for (const a of ep.advisorOrder) ep.advice[a] = Array.from({length: 8}, (_, i) => ({id: makeId(n++), ...(i < 7 ? {when: {inspected: ['e_monitor']}} : {}), text: '.'}));
  return ep;
};

for (const [name, makeId] of [
  ['300k-character whitespace ids', i => ' '.repeat(300000) + i],
  ['1M-character whitespace ids', i => ' '.repeat(1000000) + i],
  ['overlong non-whitespace ids (300k)', i => 'v' + 'x'.repeat(299990) + i],
]) {
  test(`r7-2 ${name} × 32 max-cardinality variants: zero over-limit string scans; rejected by the length stage`, t => {
    const ep = withVariantIds(makeId);
    let problems;
    const t0 = performance.now();
    const scans = countLongScans(() => { problems = validateEpisode(ep); });
    const ms = performance.now() - t0;
    t.diagnostic(`${name}: ${problems.length} problems in ${ms.toFixed(2)}ms; over-limit scans=${scans.calls} (${scans.chars} chars)`);
    assert.equal(scans.calls, 0, `scanned ${scans.chars} characters of over-limit ids`);
    assert.equal(problems.length, 32);
    assert(problems.every(p => /: identifier is \d+ characters; the limit is 64 \(MAX_IDENTIFIER_LENGTH\)/.test(p)));
    assert(problems.join('\n').length < 32 * 200, 'bounded error text');
  });
}

test('r7-2 short ids: whitespace ids get no label suffix (and fail the safe-id rule); valid ids keep their label', () => {
  // Short whitespace id: label omits the suffix; stage 4 rejects it as unsafe.
  { const ep = clone(shipped); ep.advice.boy[0].id = '   '; ep.advice.boy[0].reveals = 'not-a-list';
    const shape = validateEpisode(ep);
    assert(shape.includes('advice.boy[0]: reveals must be a non-empty array'), shape.join('\n'));
    ep.advice.boy[0].reveals = ['e_clocksync'];
    assert(validateEpisode(ep).some(p => p === 'advice.boy[0]: id must be a safe identifier')); }
  // Short valid id: label keeps "(boy_find)".
  { const ep = clone(shipped); ep.advice.boy[0].reveals = 'not-a-list';
    assert(validateEpisode(ep).includes('advice.boy[0] (boy_find): reveals must be a non-empty array')); }
  // Exactly at the limit: still labelled; one over: not labelled (and rejected by length, never scanned).
  { const ep = clone(shipped); ep.advice.boy[0].id = 'b' + 'x'.repeat(63); ep.advice.boy[0].reveals = 'not-a-list';
    assert(validateEpisode(ep).includes(`advice.boy[0] (${'b' + 'x'.repeat(63)}): reveals must be a non-empty array`)); }
  { const ep = clone(shipped); ep.advice.boy[0].id = 'b' + 'x'.repeat(64); ep.advice.boy[0].reveals = 'not-a-list';
    assert(validateEpisode(ep).includes('advice.boy[0]: reveals must be a non-empty array')); }
  assert.deepEqual(validateEpisode(shipped), []);
});
