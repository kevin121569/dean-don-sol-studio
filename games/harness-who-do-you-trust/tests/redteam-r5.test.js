// r5: identifier length (LOW). MAX_IDENTIFIER_LENGTH bounds every content-chosen identifier and every reference to
// one, checked before any downstream work. Boundaries for every namespace, Astra's long-ID reproducer through the
// real loadEpisode() → reducer save → createStore().load() path, and an at-limit worst-case benchmark.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import * as content from '../js/content.js';
import {reduce, ACTIONS as A} from '../js/engine.js';
import {createInitialState, createStore, restoreState, feasibleHistory} from '../js/state.js';
import {allDomIds} from '../js/dom-ids.js';

const {validateEpisode, loadEpisode} = content;
// Namespace import so this file also RUNS against r4 (no MAX_IDENTIFIER_LENGTH) for the before/after proof.
const MAX = content.MAX_IDENTIFIER_LENGTH ?? 64;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const shipped = JSON.parse(fs.readFileSync(path.join(root, 'data/episode-001.json'), 'utf8'));
const clone = v => structuredClone(v);
const renameId = (v, o, n) => typeof v === 'string' ? (v === o ? n : v) : Array.isArray(v) ? v.map(x => renameId(x, o, n))
  : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k === o ? n : k, renameId(x, o, n)])) : v;
const pad = (prefix, len) => prefix + 'x'.repeat(len - prefix.length);
const lengthError = (field, kind, len) => `${field}: ${kind} is ${len} characters; the limit is ${MAX} (MAX_IDENTIFIER_LENGTH) — shorten it; identifiers are never truncated`;
const memory = () => { const m = new Map(); return {getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), removeItem: k => m.delete(k)}; };

test('r5 the identifier limit is 64, separate from the unchanged r4 CONTENT_LIMITS; shipped ids are far below it', () => {
  assert.equal(content.MAX_IDENTIFIER_LENGTH, 64);
  assert.deepEqual({...content.CONTENT_LIMITS}, {maxAdviceVariantsPerAdviser: 8, maxWhenInspected: 5, maxDecisions: 8});
  const ids = [shipped.id, ...shipped.evidence.map(e => e.id), ...Object.values(shipped.advice).flat().map(v => v.id), ...shipped.decisions.map(d => d.id)];
  assert.equal(Math.max(...ids.map(s => s.length)), 16);
  assert.deepEqual(validateEpisode(shipped), []);
});

// ---- Boundaries: every free-form identifier namespace (references renamed consistently) ------------------------
const IDENTIFIERS = [
  ['episode id', 'id', ep => ep.id, (ep, v) => ({...ep, id: v})],
  ['evidence id', 'evidence[1].id', ep => ep.evidence[1].id, (ep, v) => renameId(ep, 'e_controller', v)],
  ['advice variant id', 'advice.tooth[0].id', ep => ep.advice.tooth[0].id, (ep, v) => renameId(ep, 'tooth_reconciled', v)],
  ['decision id', 'decisions[0].id', ep => ep.decisions[0].id, (ep, v) => renameId(ep, 'd_shutdown', v)],
];

for (const [name, field, read, write] of IDENTIFIERS) {
  test(`r5 boundary — ${name}: ${MAX - 1} and ${MAX} accepted, ${MAX + 1} rejected (exact field + limit); empty and non-string rejected`, () => {
    for (const len of [MAX - 1, MAX]) {
      const ep = write(clone(shipped), pad('z', len));
      assert.equal(read(ep).length, len);
      assert.deepEqual(validateEpisode(ep), [], `${name} @ ${len}`);
    }
    const over = validateEpisode(write(clone(shipped), pad('z', MAX + 1)));
    assert(over.includes(lengthError(field, 'identifier', MAX + 1)), over.join('\n'));
    // References renamed with it are reported too; ONLY length errors means validation stopped before downstream work.
    assert(over.every(p => p.includes(`is ${MAX + 1} characters; the limit is ${MAX} (MAX_IDENTIFIER_LENGTH)`)), over.join('\n'));
    for (const bad of ['', 42, null]) {
      const problems = validateEpisode(write(clone(shipped), bad));
      assert(problems.length > 0 && problems.some(p => /safe identifier|unique|exactly one entry|unknown|not an object/.test(p)), `${name} = ${JSON.stringify(bad)}: ${problems.join(' | ')}`);
    }
  });
}

// ---- Boundaries: every reference namespace (the reference alone over-long) ---------------------------------------
const REFERENCES = [
  ['when.inspected reference', 'advice.tooth[0].when.inspected[0]', (ep, v) => { ep.advice.tooth[0].when.inspected[0] = v; }],
  ['reveals reference', 'advice.boy[0].reveals[0]', (ep, v) => { ep.advice.boy[0].reveals[0] = v; }],
  ['hybridUnlock reference', 'hybridUnlock.inspected[0]', (ep, v) => { ep.hybridUnlock.inspected[0] = v; }],
];
for (const [name, field, write] of REFERENCES) {
  test(`r5 boundary — ${name}: ${MAX + 1} rejected with the length error first; at-limit and empty are judged by the reference rules`, () => {
    const over = clone(shipped); write(over, pad('e', MAX + 1));
    assert.deepEqual(validateEpisode(over), [lengthError(field, 'reference', MAX + 1)]);
    const atLimit = clone(shipped); write(atLimit, pad('e', MAX));
    assert(validateEpisode(atLimit).some(p => /unknown evidence/.test(p)), 'an at-limit dangling reference is still checked, as unknown');
    for (const bad of ['', 42]) { const ep = clone(shipped); write(ep, bad); assert(validateEpisode(ep).length > 0, `${name} = ${JSON.stringify(bad)}`); }
  });
}

test('r5 boundary — postmortem key: a stray over-long key is rejected with the length error', () => {
  const ep = clone(shipped);
  ep.postmortem[pad('p', MAX + 1)] = clone(ep.postmortem.d_verify);
  const problems = validateEpisode(ep);
  assert.equal(problems.length, 1);
  assert(problems[0].startsWith('postmortem key "pxxxxxxxxxxxxxxx…": reference is 65 characters; the limit is 64 (MAX_IDENTIFIER_LENGTH)'), problems[0]);
});

test('r5 very long repeated-prefix identifiers (1,000,000 chars) in every namespace fail fast with only length errors', t => {
  const huge = n => pad('e', n);
  const ep = clone(shipped);
  ep.id = huge(1e6);
  ep.evidence[0].id = huge(1e6);
  ep.advice.darth[0].id = huge(1e6);
  ep.advice.tooth[1].when.inspected[0] = huge(1e6);
  ep.decisions[3].id = huge(1e6);
  const t0 = performance.now(); const problems = validateEpisode(ep); const ms = performance.now() - t0;
  assert.equal(problems.length, 5);
  assert(problems.every(p => p.includes('characters; the limit is 64 (MAX_IDENTIFIER_LENGTH)')));
  t.diagnostic(`1,000,000-char ids in 5 namespaces rejected in ${ms.toFixed(2)}ms`);
  assert(ms < 50, `${ms}ms`);
});

test('r5 distinct ids that differ only in their last character, at the full 64, stay distinct everywhere (no equivalence)', () => {
  let ep = clone(shipped);
  const base = pad('k', MAX - 1);
  ep.evidence.forEach((e, i) => { ep = renameId(ep, e.id, base + 'abcde'[i]); });
  ep = renameId(renameId(ep, 'd_open', pad('d', MAX - 1) + 'a'), 'd_verify', pad('d', MAX - 1) + 'b');
  assert.deepEqual(validateEpisode(ep), []);
  const evidenceIds = ep.evidence.map(e => e.id);
  assert(evidenceIds.every(id => id.length === MAX) && new Set(evidenceIds).size === 5);
  const dom = allDomIds(ep);
  assert.equal(new Set(dom).size, dom.length, 'generated DOM ids stay unique');
  // Play and restore: the engine and restore keep every one distinct; nothing truncated or normalized.
  let s = reduce(createInitialState(ep), {type: A.START}, ep);
  for (const id of ['boy', 'tooth']) s = reduce(s, {type: A.CONSULT, advisorId: id}, ep);
  for (const id of evidenceIds) s = reduce(s, {type: A.OPEN_EVIDENCE, evidenceId: id}, ep);
  assert.deepEqual(s.inspectedSources, evidenceIds);
  const store = createStore(ep, memory()); store.save(s);
  assert.deepEqual(store.load(), s);
  // Swapping two near-identical ids in a save is a different save, and it is judged as one (rejected here).
  const swapped = {...s, inspectedSources: [...evidenceIds.slice(0, 3), evidenceIds[4], evidenceIds[3]]};
  assert.notDeepEqual(restoreState(clone(swapped), ep), s);
});

// ---- Astra's long-ID reproducer through the REAL load path -------------------------------------------------------
const ALL = shipped.evidence.map(e => e.id);
function worstShape() { // r4 shape: 5 evidence (1 visible), 4 advisers, 8 variants, 5-entry when.inspected, 8 decisions
  const ep = clone(shipped); const tpl = ep.decisions.find(d => d.id === 'd_verify');
  for (let i = ep.decisions.length; i < 8; i++) { const id = `d_extra${i}`; ep.decisions.push({...clone(tpl), id, label: 'x'}); ep.postmortem[id] = clone(ep.postmortem.d_verify); }
  for (const e of ep.evidence) e.hidden = e.id !== 'e_monitor';
  const hidden = ALL.filter(id => id !== 'e_monitor'); ep.advice = {};
  ep.advisorOrder.forEach((a, k) => {
    const lines = Array.from({length: 7}, (_, i) => ({id: `${a}_v${i}`, when: i % 3 === 0 ? {inspected: [...ALL], consultedFewerThan: 3} : i % 3 === 1 ? {inspected: [...ALL].reverse(), hybridUnlocked: true} : {inspected: ['e_monitor', hidden[(i + k) % 4]]}, text: '.', ...(i % 2 ? {} : {reveals: [hidden[(i + k) % 4], hidden[(i + k + 1) % 4]]})}));
    lines.push({id: `${a}_any`, text: '.', reveals: [hidden[k], hidden[(k + 2) % 4]]}); ep.advice[a] = lines;
  });
  ep.hybridUnlock.inspected = [...ALL];
  return ep;
}
const withEvidenceIdLength = (ep, L) => ALL.reduce((e, id, k) => renameId(e, id, pad(`e${k}_`, L)), ep);
/** Every content identifier at exactly `L` (evidence, advice variants, decisions, episode), references renamed. */
function everyIdAt(L) {
  let ep = withEvidenceIdLength(worstShape(), L);
  for (const v of Object.values(ep.advice).flat()) v.id = pad(v.id + '_', L);
  for (const d of [...ep.decisions]) ep = renameId(ep, d.id, pad(d.id + '_', L));
  ep.id = pad('episode_', L);
  return ep;
}

async function serve(body, fn) {
  const server = http.createServer((req, res) => { res.writeHead(200, {'Content-Type': 'application/json'}); res.end(body); });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  try { return await fn(`http://127.0.0.1:${server.address().port}/episode.json`); } finally { await new Promise(r => server.close(r)); }
}

test('r5 Astra reproducer: ~10k / 100k / 300k-char evidence ids (refs updated) are refused by the real loadEpisode()', async t => {
  for (const L of [10000, 100000, 300000]) {
    const body = JSON.stringify(withEvidenceIdLength(worstShape(), L));
    await serve(body, async url => {
      const t0 = performance.now();
      await assert.rejects(loadEpisode(url), err => err.message.includes(lengthError('evidence[0].id', 'identifier', L)));
      t.diagnostic(`idLen=${L}: loadEpisode rejected in ${(performance.now() - t0).toFixed(1)}ms (fetch + parse + validate)`);
    });
  }
});

test('r5 at-limit worst case through loadEpisode() → reducer saves → createStore().load(): bounded, measured', async t => {
  const content64 = everyIdAt(MAX);
  await serve(JSON.stringify(content64), async url => {
    const ep = await loadEpisode(url);
    const longest = Math.max(ep.id.length, ...ep.evidence.map(e => e.id.length), ...Object.values(ep.advice).flat().map(v => v.id.length), ...ep.decisions.map(d => d.id.length));
    assert.equal(longest, MAX);
    let x = 0x5eed5; const rand = () => (x = (x * 48271) % 2147483647) / 2147483647, any = xs => xs[Math.floor(rand() * xs.length)];
    const acts = [...ep.evidence.map(e => ({type: A.OPEN_EVIDENCE, evidenceId: e.id})), ...ep.advisorOrder.map(advisorId => ({type: A.CONSULT, advisorId})), {type: A.CONSULT_ALL}];
    const saves = [];
    for (let w = 0; w < 300; w++) { let s = reduce(createInitialState(ep), {type: A.START}, ep); for (let k = 0; k < 18; k++) { s = reduce(s, any(acts), ep); saves.push(s); } }
    const forged = saves.map(s => ({...s, discoveredEvidence: [s.discoveredEvidence[0], ...s.discoveredEvidence.slice(1).reverse()]}));
    const store = createStore(ep, memory());
    for (const s of saves.slice(0, 300)) { store.save(s); store.load(); } // JIT warm-up
    const times = []; let maxStates = 0, maxSel = 0, realRejected = 0, maxBytes = 0;
    for (const [i, s] of [...saves, ...forged].entries()) {
      const r = feasibleHistory(s, ep); maxStates = Math.max(maxStates, r.explored); maxSel = Math.max(maxSel, r.selections);
      store.save(s); maxBytes = Math.max(maxBytes, JSON.stringify(s).length);
      const t0 = performance.now(); const loaded = store.load(); times.push(performance.now() - t0);
      if (i < saves.length && !loaded) realRejected++;
    }
    times.sort((a, b) => a - b);
    const pct = p => times[Math.min(times.length - 1, Math.floor(p * times.length))];
    t.diagnostic(`all ids at ${MAX}: loads=${times.length} searchStates max=${maxStates}/930 selectAdvice max=${maxSel}/120 maxSaveBytes=${maxBytes} store.load() p50=${pct(.5).toFixed(4)}ms p99=${pct(.99).toFixed(4)}ms max=${times.at(-1).toFixed(3)}ms`);
    assert.equal(realRejected, 0, 'every genuine save restores');
    assert(maxStates <= 930 && maxSel <= 120);
    assert(pct(.99) < 5, `p99 ${pct(.99)}ms`);
  });
});
