// r4: content-size restore performance (LOW). Content complexity limits bound the per-selectAdvice cost that
// r3's state bound did not cover. Boundary tests below/at/above every limit, Astra's two reproducers, and an
// adversarial worst-case-within-limits restore benchmark. Engine/selection semantics are unchanged.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import * as content from '../js/content.js';
import {reduce, ACTIONS as A} from '../js/engine.js';
import {createInitialState, restoreState, feasibleHistory} from '../js/state.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const shipped = JSON.parse(fs.readFileSync(path.join(root, 'data/episode-001.json'), 'utf8'));
const clone = v => structuredClone(v);
const ALL_EVIDENCE = shipped.evidence.map(e => e.id);
const {validateEpisode} = content;
// Namespace import so this file also RUNS against r3 (which has no CONTENT_LIMITS) for the before/after proof.
const DOCUMENTED = {maxAdviceVariantsPerAdviser: 8, maxWhenInspected: 5, maxDecisions: 8};
const CONTENT_LIMITS = content.CONTENT_LIMITS;
const { maxAdviceVariantsPerAdviser: MAX_V, maxWhenInspected: MAX_W, maxDecisions: MAX_D } = CONTENT_LIMITS ?? DOCUMENTED;

test('r4 limits are the documented values and the shipped episode is within them and valid', () => {
  assert.deepEqual({...CONTENT_LIMITS}, DOCUMENTED);
  assert(Object.isFrozen(CONTENT_LIMITS));
  assert.deepEqual(validateEpisode(shipped), []);
  for (const a of shipped.advisorOrder) assert(shipped.advice[a].length <= MAX_V, a);
  for (const v of Object.values(shipped.advice).flat()) assert((v.when?.inspected?.length ?? 0) <= MAX_W, v.id);
  assert(shipped.decisions.length <= MAX_D);
});

// ---- Boundary: advice variants per adviser ---------------------------------------------------------
/** n variants for `adviser`: n-1 extra never-first conditional lines inserted before the existing ones. */
function withVariants(adviser, n) {
  const ep = clone(shipped);
  const existing = ep.advice[adviser];
  const extra = Array.from({length: n - existing.length}, (_, i) => ({id: `${adviser}_pad${i}`, when: {inspected: ['e_technician', 'e_protocol']}, text: 'Padding line.'}));
  ep.advice[adviser] = [...extra, ...existing];
  assert.equal(ep.advice[adviser].length, n);
  return ep;
}

test('r4 boundary: advice variants per adviser — 7 and 8 accepted, 9 rejected with an actionable error (every adviser)', () => {
  for (const adviser of shipped.advisorOrder) {
    assert.deepEqual(validateEpisode(withVariants(adviser, MAX_V - 1)), [], `${adviser} @ ${MAX_V - 1}`);
    assert.deepEqual(validateEpisode(withVariants(adviser, MAX_V)), [], `${adviser} @ ${MAX_V}`);
    const problems = validateEpisode(withVariants(adviser, MAX_V + 1));
    assert(problems.some(p => p === `advice.${adviser}: ${MAX_V + 1} variants exceeds the limit of ${MAX_V} (CONTENT_LIMITS.maxAdviceVariantsPerAdviser) — merge or remove variants; content is not truncated`), problems.join('\n'));
    assert(!problems.some(p => /never revealed/.test(p)), 'no spurious reachability error from the unscanned block');
  }
});

// ---- Boundary: when.inspected length and uniqueness -----------------------------------------------------
const withWhen = inspected => { const ep = clone(shipped); ep.advice.tooth[0].when = {inspected}; return ep; };

test('r4 boundary: when.inspected — 4 and 5 unique ids accepted, 6 rejected; any repeat rejected', () => {
  assert.deepEqual(validateEpisode(withWhen(ALL_EVIDENCE.slice(0, MAX_W - 1))), [], `${MAX_W - 1} unique`);
  assert.deepEqual(validateEpisode(withWhen(ALL_EVIDENCE.slice(0, MAX_W))), [], `${MAX_W} unique (every evidence id)`);
  const six = validateEpisode(withWhen([...ALL_EVIDENCE, 'e_monitor']));
  assert(six.some(p => p === `advice.tooth[0] (tooth_reconciled): when.inspected has ${MAX_W + 1} entries; the limit is ${MAX_W} (CONTENT_LIMITS.maxWhenInspected) — list each required evidence id once`), six.join('\n'));
  const repeat = validateEpisode(withWhen(['e_monitor', 'e_monitor']));
  assert(repeat.some(p => /when\.inspected must not repeat ids — list each required evidence id once/.test(p)), repeat.join('\n'));
});

test('r4 uniqueness rejects no distinct condition: every non-empty set of evidence ids is expressible within the limit', () => {
  for (let mask = 1; mask < 1 << ALL_EVIDENCE.length; mask++) {
    const set = ALL_EVIDENCE.filter((_, i) => mask & (1 << i));
    assert(set.length <= MAX_W);
    assert.deepEqual(validateEpisode(withWhen(set)), [], set.join(','));
  }
});

// ---- Boundary: decisions ---------------------------------------------------------------------------------
function withDecisions(n) {
  const ep = clone(shipped);
  const template = ep.decisions.find(d => d.id === 'd_verify');
  for (let i = ep.decisions.length; i < n; i++) {
    const id = `d_extra${i}`;
    ep.decisions.push({...clone(template), id, label: `Extra option ${i}`});
    ep.postmortem[id] = clone(ep.postmortem.d_verify);
  }
  assert.equal(ep.decisions.length, n);
  return ep;
}

test('r4 boundary: decisions — 7 and 8 accepted, 9 rejected with an actionable error', () => {
  assert.deepEqual(validateEpisode(withDecisions(MAX_D - 1)), []);
  assert.deepEqual(validateEpisode(withDecisions(MAX_D)), []);
  const problems = validateEpisode(withDecisions(MAX_D + 1));
  assert(problems.includes(`decisions: ${MAX_D + 1} exceeds the limit of ${MAX_D} (CONTENT_LIMITS.maxDecisions) — remove decisions; content is not truncated`), problems.join('\n'));
});

test('r4 at-limit content still plays and restores exactly (no false rejection at the boundary)', () => {
  for (const ep of [withVariants('donsol', MAX_V), withWhen(ALL_EVIDENCE.slice(0, MAX_W)), withDecisions(MAX_D)]) {
    let s = reduce(createInitialState(ep), {type: A.START}, ep);
    for (const a of [{type: A.CONSULT_ALL}, ...ALL_EVIDENCE.map(evidenceId => ({type: A.OPEN_EVIDENCE, evidenceId})), {type: A.CONSULT_ALL}]) {
      s = reduce(s, a, ep);
      assert.deepEqual(restoreState(clone(s), ep), s);
    }
    s = reduce(reduce(s, {type: A.GO_TO_DECISION}, ep), {type: A.SUBMIT_DECISION, decisionId: ep.decisions.at(-1).id}, ep);
    assert.equal(s.completed, true);
    assert.deepEqual(restoreState(clone(s), ep), s);
  }
});

// ---- Astra's two reproducers -------------------------------------------------------------------------------
const N = 100000;
function astraCase1() {
  const ep = clone(shipped);
  ep.advice.tooth[0].when.inspected = Array.from({length: N}, (_, i) => ['e_monitor', 'e_controller', 'e_clocksync'][i % 3]);
  return ep;
}
function astraCase2() {
  const ep = clone(shipped);
  for (const a of ep.advisorOrder) ep.advice[a] = [...Array.from({length: N}, (_, i) => ({id: `${a}_u${i}`, when: {hybridUnlocked: true, consultedFewerThan: 1}, text: '.'})), ...ep.advice[a]];
  return ep;
}

test('r4 Astra case 1: 100,000-entry when.inspected is rejected, fast, with an actionable error', t => {
  const ep = astraCase1();
  const t0 = performance.now(); const problems = validateEpisode(ep); const ms = performance.now() - t0;
  assert(problems.some(p => p.includes(`when.inspected has ${N} entries; the limit is ${MAX_W}`)), problems.join('\n'));
  t.diagnostic(`case1 validate rejected in ${ms.toFixed(1)}ms`);
  assert(ms < 1000, `validation took ${ms}ms`);
});

test('r4 Astra case 2: 100,000 variants per adviser are rejected, fast, with an actionable error per adviser', t => {
  const ep = astraCase2();
  const t0 = performance.now(); const problems = validateEpisode(ep); const ms = performance.now() - t0;
  for (const a of ep.advisorOrder) assert(problems.some(p => p.startsWith(`advice.${a}: ${ep.advice[a].length} variants exceeds the limit of ${MAX_V}`)), a);
  t.diagnostic(`case2 validate rejected in ${ms.toFixed(1)}ms (r3 accepted it after ~16s of validation)`);
  assert(ms < 1000, `validation took ${ms}ms`);
});

// ---- Adversarial worst case WITHIN the limits ---------------------------------------------------------------
/** Every limit at its maximum, every `when` key used, maximal scans: 8 variants per adviser whose
 * when.inspected lists all 5 ids, 8 decisions, 1 visible + 4 hidden evidence, reveals that keep all reachable. */
function worstWithinLimits() {
  const ep = withDecisions(MAX_D);
  for (const e of ep.evidence) e.hidden = e.id !== 'e_monitor';
  const hidden = ALL_EVIDENCE.filter(id => id !== 'e_monitor');
  ep.advice = {};
  ep.advisorOrder.forEach((a, k) => {
    const lines = Array.from({length: MAX_V - 1}, (_, i) => ({
      id: `${a}_v${i}`,
      when: i % 3 === 0 ? {inspected: [...ALL_EVIDENCE], consultedFewerThan: 3}
        : i % 3 === 1 ? {inspected: [...ALL_EVIDENCE].reverse(), hybridUnlocked: true} : {inspected: ['e_monitor', hidden[(i + k) % 4]]},
      text: '.',
      ...(i % 2 ? {} : {reveals: [hidden[(i + k) % 4], hidden[(i + k + 1) % 4]]}),
    }));
    lines.push({id: `${a}_any`, text: '.', reveals: [hidden[k], hidden[(k + 2) % 4]]});
    ep.advice[a] = lines;
  });
  ep.hybridUnlock.inspected = [...ALL_EVIDENCE];
  return ep;
}

test('r4 adversarial restore cost within limits: bounded search, bounded per-call work, measured timings', t => {
  const ep = worstWithinLimits();
  assert.deepEqual(validateEpisode(ep), []);
  // Reachable saves by a seeded random walk over the real engine (the full state space is very large here).
  let x = 0x4a4a4a; const rand = () => (x = (x * 48271) % 2147483647) / 2147483647, any = xs => xs[Math.floor(rand() * xs.length)];
  const actions = [...ALL_EVIDENCE.map(evidenceId => ({type: A.OPEN_EVIDENCE, evidenceId})), ...ep.advisorOrder.map(advisorId => ({type: A.CONSULT, advisorId})), {type: A.CONSULT_ALL}];
  const saves = [];
  for (let walk = 0; walk < 400; walk++) {
    let s = reduce(createInitialState(ep), {type: A.START}, ep);
    for (let step = 0; step < 18; step++) { s = reduce(s, any(actions), ep); saves.push(clone(s)); }
  }
  // Each real save, plus a forged order (forces exhaustive search when infeasible).
  const visible = 1;
  const forged = saves.map(s => ({...s, discoveredEvidence: [...s.discoveredEvidence.slice(0, visible), ...s.discoveredEvidence.slice(visible).reverse()]}));
  for (const s of saves.slice(0, 500)) restoreState(clone(s), ep); // JIT warm-up
  const times = []; let maxStates = 0, maxSelections = 0, rejectedReal = 0;
  for (const s of [...saves, ...forged]) {
    const r = feasibleHistory(s, ep);
    maxStates = Math.max(maxStates, r.explored); maxSelections = Math.max(maxSelections, r.selections);
    const t0 = performance.now(); const ok = restoreState(clone(s), ep); times.push(performance.now() - t0);
    if (saves.includes(s) && !ok) rejectedReal++;
  }
  times.sort((a, b) => a - b);
  const pct = p => times[Math.min(times.length - 1, Math.floor(p * times.length))];
  t.diagnostic(`within-limits worst shape: restores=${times.length} searchStates max=${maxStates}/930 selectAdvice max=${maxSelections}/120 restoreMs p50=${pct(.5).toFixed(4)} p99=${pct(.99).toFixed(4)} p99.9=${pct(.999).toFixed(4)} max=${times.at(-1).toFixed(3)}`);
  assert.equal(rejectedReal, 0, 'no real save rejected');
  assert(maxStates <= 930 && maxSelections <= 120);
  assert(pct(.99) < 5, `p99 restore ${pct(.99)}ms`); // generous CI ceiling; measured values are reported above
});

// ---- Runtime path: rejected content never reaches restore -------------------------------------------------
import {makeUI} from './ui-harness.js';

test('r4 app boot: over-limit content is refused before the store is created, so restore never runs on it', async () => {
  for (const ep of [astraCase1(), astraCase2(), withVariants('boy', MAX_V + 1), withDecisions(MAX_D + 1)]) {
    // Boot reads the motion-settings key first; only the SAVE key leads to restoreState.
    let saveReads = 0;
    const storage = {getItem: key => { if (key.startsWith('harness-wdyt:episode-')) saveReads++; return null; }, setItem() {}, removeItem() {}};
    const ui = makeUI(ep, {storage});
    await ui.app.boot();
    assert.equal(ui.app.getState(), undefined, 'app did not start');
    assert.equal(saveReads, 0, 'the save key (and therefore restoreState) was never read');
    assert(ui.html().includes('Episode could not load'));
    assert(ui.html().includes('CONTENT_LIMITS'), 'the actionable limit message is shown');
  }
  // Control: at-limit content boots and restores normally through the same path.
  const ui = makeUI(withVariants('boy', MAX_V)); await ui.app.boot();
  assert.equal(ui.app.getState().sceneId, 'briefing');
});
