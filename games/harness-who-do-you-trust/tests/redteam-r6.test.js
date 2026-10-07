// r6: validation fail-fast ordering (two LOW findings). Stage 2 (container type + cardinality) runs before
// any identifier/reference traversal, and `postmortem` is not enumerated unless the decision count passed.
// Proxy instrumentation proves over-limit containers are rejected without touching their contents.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateEpisode, CONTENT_LIMITS} from '../js/content.js';
import {reduce, ACTIONS as A} from '../js/engine.js';
import {createInitialState, restoreState} from '../js/state.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const shipped = JSON.parse(fs.readFileSync(path.join(root, 'data/episode-001.json'), 'utf8'));
const clone = v => structuredClone(v);
const R300 = 'r' + 'x'.repeat(299999);
const ALL = shipped.evidence.map(e => e.id);
const MAX_ERROR_TEXT = 2000; // every rejection below must stay actionable and small

/** Wrap an array so element reads (index access, iteration) are counted; `.length` is allowed. */
function watched(list) {
  const seen = {elementReads: 0};
  const proxy = new Proxy(list, {
    get(target, key, receiver) {
      if (typeof key === 'string' && /^\d+$/.test(key)) seen.elementReads++;
      if (key === Symbol.iterator) seen.elementReads++;
      return Reflect.get(target, key, receiver);
    },
  });
  return {proxy, seen};
}
/** Wrap an object so key enumeration (Object.keys / for-in / ownKeys) is counted. */
function watchedObject(obj) {
  const seen = {enumerations: 0};
  return {proxy: new Proxy(obj, {ownKeys(t) { seen.enumerations++; return Reflect.ownKeys(t); }}), seen};
}
const rejectBounded = (ep, pattern) => {
  const problems = validateEpisode(ep);
  assert(problems.length > 0, 'rejected');
  if (pattern) assert(problems.some(p => pattern.test(p)), problems.join('\n'));
  assert(problems.join('\n').length < MAX_ERROR_TEXT, `error text ${problems.join('\n').length} chars`);
  return problems;
};

// ---- A. Over-cardinality containers: rejected before ANY element is read --------------------------------------
const OVER = [
  ['evidence ×6', ep => ep.evidence, (ep, v) => { ep.evidence = v; }, () => Array.from({length: 6}, (_, i) => ({...clone(shipped.evidence[0]), id: R300 + i})), /evidence count 6 outside packet range 3–5/],
  ['advice.boy ×9 variants', ep => ep.advice.boy, (ep, v) => { ep.advice.boy = v; }, () => Array.from({length: 9}, (_, i) => ({id: R300 + i, text: '.'})), /advice\.boy: 9 variants exceeds the limit of 8/],
  ['when.inspected ×6', ep => ep.advice.tooth[0].when.inspected, (ep, v) => { ep.advice.tooth[0].when.inspected = v; }, () => Array.from({length: 6}, (_, i) => R300 + i), /when\.inspected has 6 entries; the limit is 5/],
  ['reveals ×6', ep => ep.advice.boy[0].reveals, (ep, v) => { ep.advice.boy[0].reveals = v; }, () => Array.from({length: 6}, (_, i) => R300 + i), /reveals has 6 entries; the limit is 5/],
  ['hybridUnlock.inspected ×6', ep => ep.hybridUnlock.inspected, (ep, v) => { ep.hybridUnlock.inspected = v; }, () => Array.from({length: 6}, (_, i) => R300 + i), /hybridUnlock\.inspected has 6 entries; the limit is 5/],
  ['decisions ×9', ep => ep.decisions, (ep, v) => { ep.decisions = v; }, () => Array.from({length: 9}, (_, i) => ({...clone(shipped.decisions[1]), id: R300 + i})), /decisions: 9 exceeds the limit of 8/],
];

for (const [name, , write, make, message] of OVER) {
  test(`r6 A: ${name} holding 300k-char ids/refs is rejected with ZERO element reads and a bounded error`, () => {
    const ep = clone(shipped);
    const {proxy, seen} = watched(make());
    write(ep, proxy);
    const t0 = performance.now();
    rejectBounded(ep, message);
    assert.equal(seen.elementReads, 0, `${name}: contents were traversed`);
    assert(performance.now() - t0 < 50);
  });
}

// ---- A. Limits: at max accepted, above max rejected (each container) ---------------------------------------------
test('r6 A boundaries: evidence 5 / 6, variants 8 / 9, decisions 8 / 9, reveals 5 / 6, hybridUnlock 5 / 6', () => {
  // evidence: shipped is at the maximum (5)
  assert.equal(shipped.evidence.length, 5); assert.deepEqual(validateEpisode(shipped), []);
  { const ep = clone(shipped); ep.evidence.push({...clone(ep.evidence[2]), id: 'e_six'}); rejectBounded(ep, /evidence count 6/); }
  // variants
  const variants = n => { const ep = clone(shipped); ep.advice.boy = [...Array.from({length: n - 1}, (_, i) => ({id: `boy_pad${i}`, when: {inspected: ['e_protocol']}, text: '.'})), ...ep.advice.boy]; return ep; };
  assert.deepEqual(validateEpisode(variants(8)), []); rejectBounded(variants(9), /9 variants exceeds the limit of 8/);
  // decisions
  const decisions = n => { const ep = clone(shipped); for (let i = ep.decisions.length; i < n; i++) { const id = `d_extra${i}`; ep.decisions.push({...clone(ep.decisions[1]), id}); ep.postmortem[id] = clone(ep.postmortem.d_verify); } return ep; };
  assert.deepEqual(validateEpisode(decisions(8)), []); rejectBounded(decisions(9), /decisions: 9 exceeds the limit of 8/);
  // reveals: 5 is accepted by shape (then judged semantically); 6 rejected by shape
  { const ep = clone(shipped); ep.evidence.forEach(e => { e.hidden = e.id !== 'e_monitor'; }); ep.advice.boy[0].reveals = ALL.filter(id => id !== 'e_monitor');
    const p = validateEpisode(ep); assert(!p.some(x => /reveals has/.test(x)), p.join('\n')); }
  { const ep = clone(shipped); ep.advice.boy[0].reveals = [...ALL, 'e_monitor']; rejectBounded(ep, /reveals has 6 entries; the limit is 5/); }
  // hybridUnlock: all 5 accepted; 6 rejected
  { const ep = clone(shipped); ep.hybridUnlock.inspected = [...ALL]; assert.deepEqual(validateEpisode(ep), []); }
  { const ep = clone(shipped); ep.hybridUnlock.inspected = [...ALL, 'e_monitor']; rejectBounded(ep, /hybridUnlock\.inspected has 6 entries/); }
});

test('r6 A: reveals of 5 entries, each a 300k-char reference, pass the shape stage and stop at the length stage (bounded)', () => {
  const ep = clone(shipped);
  ep.advice.boy[0].reveals = Array.from({length: 5}, (_, i) => R300.slice(1) + i); // exactly 300,000 chars each
  const problems = rejectBounded(ep, /advice\.boy\[0\]\.reveals\[4\]: reference is 300000 characters; the limit is 64/);
  assert.equal(problems.length, 5);
  assert(problems.every(p => /reference is 300000 characters/.test(p)));
});

// ---- A. Malformed scalar / non-array list fields: rejected by shape, value never echoed ---------------------------
test('r6 A: malformed scalar or non-array list fields are rejected by shape without echoing content', () => {
  const cases = [
    ['when.inspected', ep => { ep.advice.tooth[0].when.inspected = R300; }, /advice\.tooth\[0\] \(tooth_reconciled\): when\.inspected must be a non-empty array/],
    ['when.inspected (object)', ep => { ep.advice.tooth[0].when.inspected = {0: R300}; }, /when\.inspected must be a non-empty array/],
    ['when.inspected (number)', ep => { ep.advice.tooth[0].when.inspected = 42; }, /when\.inspected must be a non-empty array/],
    ['reveals', ep => { ep.advice.boy[0].reveals = R300; }, /advice\.boy\[0\] \(boy_find\): reveals must be a non-empty array/],
    ['reveals (object)', ep => { ep.advice.boy[0].reveals = {length: 1, 0: R300}; }, /reveals must be a non-empty array/],
    ['hybridUnlock.inspected', ep => { ep.hybridUnlock.inspected = R300; }, /hybridUnlock\.inspected must be a non-empty array/],
    ['hybridUnlock', ep => { ep.hybridUnlock = R300; }, /hybridUnlock must be an object/],
    ['evidence', ep => { ep.evidence = R300; }, /evidence must be an array/],
    ['decisions', ep => { ep.decisions = R300; }, /at least two decisions required/],
    ['advice.darth', ep => { ep.advice.darth = R300; }, /advice\.darth: must be a non-empty array/],
    ['advice', ep => { ep.advice = R300; }, /advice must have exactly the four required blocks/],
    ['advisorOrder', ep => { ep.advisorOrder = R300; }, /advisorOrder must be exactly/],
    ['when', ep => { ep.advice.tooth[0].when = R300; }, /when must be an object if present/],
  ];
  for (const [name, write, pattern] of cases) {
    const ep = clone(shipped); write(ep);
    const problems = rejectBounded(ep, pattern);
    assert(!problems.join('').includes('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'), `${name}: content echoed`);
  }
});

// ---- B. Postmortem is never enumerated while the decision count is over its limit --------------------------------
for (const keys of [100000, 300000]) {
  test(`r6 B: 9 decisions + postmortem with ${keys.toLocaleString('en-US')} keys rejects WITHOUT enumerating postmortem`, t => {
    const ep = clone(shipped);
    while (ep.decisions.length < 9) ep.decisions.push({...clone(ep.decisions[1]), id: 'd_x' + ep.decisions.length});
    for (let i = 0; i < keys; i++) ep.postmortem['k' + i] = 1;
    const {proxy, seen} = watchedObject(ep.postmortem);
    ep.postmortem = proxy;
    const t0 = performance.now(); const problems = rejectBounded(ep, /decisions: 9 exceeds the limit of 8/); const ms = performance.now() - t0;
    assert.equal(seen.enumerations, 0, 'postmortem keys were enumerated');
    assert.equal(problems.length, 1);
    t.diagnostic(`decisions=9, postmortem keys=${keys}: rejected in ${ms.toFixed(2)}ms with 0 postmortem enumerations`);
    assert(ms < 50);
  });
}

test('r6 B: stray postmortem keys with decisions within the limit are still rejected (one bounded enumeration)', () => {
  // A few stray keys: count within 8 → exact-set rule rejects.
  { const ep = clone(shipped); ep.postmortem.stray = clone(ep.postmortem.d_verify);
    const {proxy, seen} = watchedObject(ep.postmortem); ep.postmortem = proxy;
    rejectBounded(ep, /postmortem must have exactly one entry per decision id/);
    assert.equal(seen.enumerations, 1, 'enumerated exactly once'); }
  // Many stray keys (100k), decisions within limit: rejected by the count rule; no key is echoed.
  { const ep = clone(shipped); for (let i = 0; i < 1e5; i++) ep.postmortem[R300.slice(0, 40) + i] = 1;
    const problems = rejectBounded(ep, /postmortem has 100004 entries; the limit is 8/);
    assert.equal(problems.length, 1); }
});

// ---- Ordering: shape errors win over identifier/semantic traversal ------------------------------------------------
test('r6 ordering: an over-limit container with 300k-char ids elsewhere reports only shape errors (no length scan)', () => {
  const ep = clone(shipped);
  ep.evidence[0].id = R300; ep.decisions[0].id = R300; ep.id = R300;
  ep.advice.darth = Array.from({length: 9}, (_, i) => ({id: 'd' + i, text: '.'}));
  const problems = rejectBounded(ep, /advice\.darth: 9 variants/);
  assert.equal(problems.length, 1, problems.join('\n'));
});

// ---- Accepted max-boundary content: every limit at its maximum at once is still accepted and plays -----------------
test('r6 accepted: all limits at their maximum simultaneously (ids at 64) validate, play and restore', () => {
  const pad = (p, n) => p + 'x'.repeat(n - p.length);
  let ep = clone(shipped);
  for (let i = ep.decisions.length; i < CONTENT_LIMITS.maxDecisions; i++) { const id = `d_extra${i}`; ep.decisions.push({...clone(ep.decisions[1]), id}); ep.postmortem[id] = clone(ep.postmortem.d_verify); }
  for (const a of ep.advisorOrder) ep.advice[a] = [...Array.from({length: 8 - ep.advice[a].length}, (_, i) => ({id: `${a}_pad${i}`, when: {inspected: [...ALL]}, text: '.'})), ...ep.advice[a]];
  ep.hybridUnlock.inspected = [...ALL];
  const rename = (v, o, n) => typeof v === 'string' ? (v === o ? n : v) : Array.isArray(v) ? v.map(x => rename(x, o, n)) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k === o ? n : k, rename(x, o, n)])) : v;
  ALL.forEach((id, k) => { ep = rename(ep, id, pad(`e${k}_`, 64)); });
  ep.id = pad('ep_', 64);
  assert.deepEqual(validateEpisode(ep), []);
  let s = reduce(createInitialState(ep), {type: A.START}, ep);
  for (const a of [{type: A.CONSULT_ALL}, ...ep.evidence.map(e => ({type: A.OPEN_EVIDENCE, evidenceId: e.id})), {type: A.CONSULT_ALL}]) {
    s = reduce(s, a, ep);
    assert.deepEqual(restoreState(clone(s), ep), s);
  }
});
