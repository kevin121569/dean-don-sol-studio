// Issue #7 (r3): restore must require ONE feasible engine history. Astra's six impossible-history shapes,
// legitimate controls from real engine play, and an exact differential against a reference explorer that
// drives the real engine. Run against r2 1babcff first: the forgeries are accepted there.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateEpisode} from '../js/content.js';
import {reduce, ACTIONS as A} from '../js/engine.js';
import {createInitialState, restoreState, explainRestore} from '../js/state.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const shipped = JSON.parse(fs.readFileSync(path.join(root, 'data/episode-001.json'), 'utf8'));
const clone = v => structuredClone(v);
const open = evidenceId => ({type: A.OPEN_EVIDENCE, evidenceId});
const consult = advisorId => ({type: A.CONSULT, advisorId});
const play = (ep, actions) => actions.reduce((s, a) => reduce(s, a, ep), reduce(createInitialState(ep), {type: A.START}, ep));
const restores = (s, ep) => restoreState(clone(s), ep) !== null;
const withHidden = (ep, ids) => { for (const e of ep.evidence) if (ids.includes(e.id)) e.hidden = true; return ep; };
const swapSuffix = (s, n) => ({...s, discoveredEvidence: [...s.discoveredEvidence.slice(0, n), ...s.discoveredEvidence.slice(n).reverse()]});
const VISIBLE_AFTER_HIDING_PROTOCOL = 3; // e_monitor, e_controller, e_technician

// ---- Episode shapes (each validated) -------------------------------------------------------------
/** Astra's validated fixture: conditional first-match variant reveals one order, fallback the opposite. */
function astraFixture() {
  const ep = withHidden(clone(shipped), ['e_protocol']);
  ep.advice.boy = [
    {id: 'boy_conditional', when: {inspected: ['e_monitor']}, text: 'Found it.', reveals: ['e_clocksync', 'e_protocol']},
    {id: 'boy_find', text: 'Found more.', reveals: ['e_protocol', 'e_clocksync']},
  ];
  return ep;
}
function hybridFixture() {
  const ep = withHidden(clone(shipped), ['e_protocol']);
  ep.advice.boy = [
    {id: 'boy_hybrid', when: {hybridUnlocked: true}, text: 'Unlocked.', reveals: ['e_clocksync', 'e_protocol']},
    {id: 'boy_find', text: 'Found more.', reveals: ['e_protocol', 'e_clocksync']},
  ];
  return ep;
}
function firstFixture() {
  const ep = withHidden(clone(shipped), ['e_protocol']);
  ep.advice.boy = [
    {id: 'boy_first', when: {consultedFewerThan: 1}, text: 'First in.', reveals: ['e_clocksync', 'e_protocol']},
    {id: 'boy_find', text: 'Found more.', reveals: ['e_protocol', 'e_clocksync']},
  ];
  return ep;
}
function phantomFixture() {
  const ep = withHidden(clone(shipped), ['e_protocol']);
  ep.advice.boy = [
    {id: 'boy_conditional', when: {inspected: ['e_monitor']}, text: 'Policy too.', reveals: ['e_protocol']},
    {id: 'boy_find', text: 'Clock report.', reveals: ['e_clocksync']},
  ];
  return ep;
}

test('r3 fixtures are valid episodes (the defect is in restore, not content validation)', () => {
  for (const make of [astraFixture, hybridFixture, firstFixture, phantomFixture]) assert.deepEqual(validateEpisode(make()), [], make.name);
});

// ---- Astra's six impossible-history cases, each with its legitimate engine-produced control --------
test('r3 case 1 — Astra exact: unsatisfied when.inspected variant\'s reveal order is forged', () => {
  const ep = astraFixture();
  const control = play(ep, [consult('boy')]); // zero inspections → boy_find → [e_protocol, e_clocksync]
  assert.deepEqual(control.discoveredEvidence.slice(VISIBLE_AFTER_HIDING_PROTOCOL), ['e_protocol', 'e_clocksync']);
  assert(restores(control, ep), 'legitimate control restores');
  const forged = swapSuffix(control, VISIBLE_AFTER_HIDING_PROTOCOL);
  assert.equal(restores(forged, ep), false);
  assert(explainRestore(forged, ep).some(p => /no feasible engine history/.test(p)));
});

test('r3 case 2 — when.hybridUnlocked: an order only the never-satisfiable hybrid variant produces', () => {
  const ep = hybridFixture();
  const control = play(ep, [consult('boy')]);
  assert(restores(control, ep));
  assert.equal(restores(swapSuffix(control, VISIBLE_AFTER_HIDING_PROTOCOL), ep), false);
  // Legitimate STALE/re-consult control: unlock hybrid, re-consult → boy_hybrid fires but reveals nothing new.
  const stale = play(ep, [consult('boy'), open('e_monitor'), open('e_controller'), open('e_clocksync'), consult('boy')]);
  assert.equal(stale.consultations[0].adviceId, 'boy_hybrid');
  assert(restores(stale, ep), 're-consulted hybrid advice with the fallback\'s reveal order restores');
  assert.equal(restores(swapSuffix(stale, VISIBLE_AFTER_HIDING_PROTOCOL), ep), false, 'same advice, forged order still rejected');
});

test('r3 case 3 — when.consultedFewerThan: first-in variant forged for an adviser consulted second', () => {
  const ep = firstFixture();
  const control = play(ep, [consult('tooth'), consult('boy')]); // boy has 1 other → boy_find
  assert.deepEqual(control.discoveredEvidence.slice(VISIBLE_AFTER_HIDING_PROTOCOL), ['e_protocol', 'e_clocksync']);
  assert(restores(control, ep));
  assert.equal(restores(swapSuffix(control, VISIBLE_AFTER_HIDING_PROTOCOL), ep), false);
  assert.equal(restores({...swapSuffix(control, VISIBLE_AFTER_HIDING_PROTOCOL),
    consultations: [control.consultations[0], {advisorId: 'boy', adviceId: 'boy_first'}]}, ep), false, 'even claiming boy_first');
});

test('r3 case 4 — first-consultation order: re-consulted legit save with its consultation order swapped', () => {
  const ep = firstFixture();
  // BOY first → boy_first → [e_clocksync, e_protocol]; after TOOTH, re-consulting BOY gives the stale
  // fallback boy_find (1 other consulted), which reveals nothing new. A legitimate engine save:
  const control = play(ep, [consult('boy'), consult('tooth'), consult('boy')]);
  assert.deepEqual(control.discoveredEvidence.slice(VISIBLE_AFTER_HIDING_PROTOCOL), ['e_clocksync', 'e_protocol']);
  assert.deepEqual(control.consultations.map(c => c.adviceId), ['boy_find', 'tooth_unread']);
  assert(restores(control, ep), 'legitimate re-consulted save restores');
  // Claim TOOTH was consulted first: then BOY's first consult saw 1 other → boy_find → the opposite order.
  assert.equal(restores({...control, consultations: [...control.consultations].reverse()}, ep), false);
});

test('r3 case 5 — prerequisite inspection order: revealed item opened before the prerequisite', () => {
  const ep = astraFixture();
  const control = play(ep, [open('e_monitor'), consult('boy'), open('e_protocol')]); // boy_conditional
  assert.equal(control.consultations[0].adviceId, 'boy_conditional');
  assert(restores(control, ep));
  // e_protocol only exists after BOY; boy_conditional only fires after e_monitor. So e_monitor must come first.
  assert.equal(restores({...control, inspectedSources: ['e_protocol', 'e_monitor']}, ep), false);
});

test('r3 case 6 — phantom conditional revelation: hidden item only an unsatisfied variant reveals', () => {
  const ep = phantomFixture();
  const control = play(ep, [consult('boy')]); // no inspection → boy_find reveals only e_clocksync
  assert(restores(control, ep));
  assert.equal(restores({...control, discoveredEvidence: [...control.discoveredEvidence, 'e_protocol']}, ep), false);
  // Legitimate: inspect e_monitor, re-consult → boy_conditional appends e_protocol.
  const legit = play(ep, [consult('boy'), open('e_monitor'), consult('boy')]);
  assert.deepEqual(legit.discoveredEvidence.slice(VISIBLE_AFTER_HIDING_PROTOCOL), ['e_clocksync', 'e_protocol']);
  assert(restores(legit, ep));
});

test('r3 stale advice on the shipped episode still restores (unread → conflict → reconciled history)', () => {
  const s1 = play(shipped, [consult('tooth'), open('e_monitor'), open('e_controller')]);
  assert.equal(s1.consultations[0].adviceId, 'tooth_unread');
  assert(restores(s1, shipped), 'stale unread line after later inspections');
  const s2 = play(shipped, [consult('boy'), consult('donsol'), consult('tooth'), consult('darth'), open('e_monitor')]);
  assert.equal(s2.consultations.find(c => c.advisorId === 'donsol').adviceId, 'donsol_thin');
  assert(restores(s2, shipped), 'Don Sol thin advice kept after others were consulted');
});

// ---- Reference explorer: drive the REAL engine over every reachable save --------------------------
const keyOf = s => JSON.stringify([s.discoveredEvidence, s.inspectedSources, s.consultations]);
const explored = new Map(); // explorer results cached per episode shape within this file
function explore(ep) {
  const cacheKey = JSON.stringify([ep.evidence, ep.advice, ep.hybridUnlock]);
  if (explored.has(cacheKey)) return explored.get(cacheKey);
  const start = reduce(createInitialState(ep), {type: A.START}, ep);
  const actions = [...ep.evidence.map(e => open(e.id)), ...ep.advisorOrder.map(consult), {type: A.CONSULT_ALL}];
  const reached = new Map([[keyOf(start), start]]), queue = [start];
  for (let i = 0; i < queue.length; i++) {
    for (const action of actions) {
      const next = reduce(queue[i], action, ep);
      const key = keyOf(next);
      if (!reached.has(key)) { reached.set(key, next); queue.push(next); }
    }
  }
  explored.set(cacheKey, {start, reached});
  return {start, reached};
}

/** Small validated episodes (3 evidence, 2 hidden) where every `when` key gates reveals. */
function tinyEpisode(variant) {
  const ep = clone(shipped);
  const keep = ['e_monitor', 'e_clocksync', 'e_protocol'];
  ep.evidence = ep.evidence.filter(e => keep.includes(e.id)).map(e => ({...e, hidden: e.id !== 'e_monitor'}));
  ep.hybridUnlock.inspected = ['e_monitor', 'e_clocksync'];
  const A1 = {
    boy: [{id: 'b_cond', when: {inspected: ['e_monitor']}, text: '.', reveals: ['e_clocksync', 'e_protocol']}, {id: 'b_any', text: '.', reveals: ['e_protocol', 'e_clocksync']}],
    tooth: [{id: 't_first', when: {consultedFewerThan: 1}, text: '.', reveals: ['e_protocol']}, {id: 't_any', text: '.'}],
    darth: [{id: 'd_hyb', when: {hybridUnlocked: true}, text: '.'}, {id: 'd_clock', when: {inspected: ['e_clocksync']}, text: '.'}, {id: 'd_any', text: '.'}],
    donsol: [{id: 's_hyb', when: {hybridUnlocked: true}, text: '.'}, {id: 's_thin', when: {consultedFewerThan: 2}, text: '.'}, {id: 's_any', text: '.'}],
  };
  const A2 = {
    boy: [{id: 'b_late', when: {consultedFewerThan: 3}, text: '.', reveals: ['e_clocksync']}, {id: 'b_any', text: '.'}],
    tooth: [{id: 't_mon', when: {inspected: ['e_monitor']}, text: '.', reveals: ['e_protocol', 'e_clocksync']}, {id: 't_any', text: '.'}],
    darth: [{id: 'd_hyb', when: {hybridUnlocked: true}, text: '.', reveals: ['e_protocol']}, {id: 'd_any', text: '.'}],
    donsol: [{id: 's_proto', when: {inspected: ['e_protocol']}, text: '.'}, {id: 's_any', text: '.'}],
  };
  ep.advice = variant === 1 ? A1 : A2;
  return ep;
}

/** Every structurally plausible save: any inspection sequence, any hidden order, any consultation sequence/advice. */
function* candidateSaves(ep, start) {
  const ids = ep.evidence.map(e => e.id);
  const hidden = ep.evidence.filter(e => e.hidden).map(e => e.id);
  const visible = ids.filter(id => !hidden.includes(id));
  const seqs = xs => { const out = [[]]; for (let i = 0; i < out.length; i++) for (const x of xs) if (!out[i].includes(x)) out.push([...out[i], x]); return out; };
  const consultSeqs = [[]];
  for (let i = 0; i < consultSeqs.length; i++) for (const a of ep.advisorOrder) {
    if (consultSeqs[i].some(c => c.advisorId === a)) continue;
    for (const v of ep.advice[a]) consultSeqs.push([...consultSeqs[i], {advisorId: a, adviceId: v.id}]);
  }
  for (const inspectedSources of seqs(ids)) for (const h of seqs(hidden)) for (const consultations of consultSeqs) {
    yield {...start, inspectedSources, discoveredEvidence: [...visible, ...h], consultations};
  }
}

for (const variant of [1, 2]) {
  test(`r3 differential (tiny episode ${variant}): validator accepts EXACTLY the engine-reachable saves`, t => {
    const ep = tinyEpisode(variant);
    assert.deepEqual(validateEpisode(ep), []);
    const {start, reached} = explore(ep);
    let candidates = 0, accepted = 0, falseAccepts = 0, falseRejects = 0;
    for (const save of candidateSaves(ep, start)) {
      candidates++;
      const ok = restores(save, ep), real = reached.has(keyOf(save));
      if (ok) accepted++;
      if (ok && !real) falseAccepts++;
      if (!ok && real) falseRejects++;
    }
    t.diagnostic(`tiny${variant}: candidates=${candidates} reachable=${reached.size} accepted=${accepted} falseAccepts=${falseAccepts} falseRejects=${falseRejects}`);
    assert.equal(falseRejects, 0, 'no legitimate save rejected');
    assert.equal(falseAccepts, 0, 'no impossible save accepted');
    assert.equal(accepted, reached.size);
  });
}

test('r3 differential (Astra fixture + shipped): seeded mutations of reachable saves accepted iff reachable', t => {
  let x = 0x7a11; const rand = () => (x = (x * 48271) % 2147483647) / 2147483647, any = xs => xs[Math.floor(rand() * xs.length)];
  const shuffle = xs => { const a = [...xs]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  let total = 0, impossible = 0;
  for (const [name, ep] of [['astra', astraFixture()], ['shipped', shipped], ['phantom', phantomFixture()], ['first', firstFixture()]]) {
    const {reached} = explore(ep);
    const states = [...reached.values()];
    const visible = ep.evidence.filter(e => !e.hidden).length;
    for (let n = 0; n < 2500; n++) {
      const s = clone(any(states));
      const mutate = any(['hiddenOrder', 'inspectOrder', 'consultOrder', 'advice', 'addHidden', 'none']);
      if (mutate === 'hiddenOrder') s.discoveredEvidence = [...s.discoveredEvidence.slice(0, visible), ...shuffle(s.discoveredEvidence.slice(visible))];
      if (mutate === 'inspectOrder') s.inspectedSources = shuffle(s.inspectedSources);
      if (mutate === 'consultOrder') s.consultations = shuffle(s.consultations);
      if (mutate === 'advice' && s.consultations.length) { const c = any(s.consultations); c.adviceId = any(ep.advice[c.advisorId]).id; }
      if (mutate === 'addHidden') { const missing = ep.evidence.filter(e => e.hidden && !s.discoveredEvidence.includes(e.id)); if (missing.length) s.discoveredEvidence.push(any(missing).id); }
      const real = reached.has(keyOf(s));
      if (!real) impossible++;
      assert.equal(restores(s, ep), real, `${name} #${n} (${mutate})`);
      total++;
    }
  }
  t.diagnostic(`mutated saves checked=${total} of which engine-impossible=${impossible}`);
  assert(impossible > 1500, 'the sample must contain many impossible saves');
});

test('r3 no false rejections: EVERY engine-reachable save of the Astra fixture restores', t => {
  const ep = astraFixture();
  const {reached} = explore(ep);
  let rejected = 0;
  for (const s of reached.values()) if (!restores(s, ep)) rejected++;
  t.diagnostic(`astra reachable saves=${reached.size} rejected=${rejected}`);
  assert.equal(rejected, 0);
});

// ---- Performance bound -------------------------------------------------------------------------------
test('r3 performance: search states and selections stay within the documented packet bound', async t => {
  const {feasibleHistory} = await import('../js/state.js');
  // Worst-case shape for the packet: 5 evidence (1 visible, 4 hidden), 4 advisers, every `when` key used.
  const ep = clone(shipped);
  for (const e of ep.evidence) e.hidden = e.id !== 'e_monitor';
  ep.advice.boy = [{id: 'b1', when: {inspected: ['e_monitor']}, text: '.', reveals: ['e_controller', 'e_technician']}, {id: 'b2', text: '.', reveals: ['e_technician', 'e_controller']}];
  ep.advice.tooth = [{id: 't1', when: {consultedFewerThan: 2}, text: '.', reveals: ['e_protocol']}, {id: 't2', text: '.', reveals: ['e_clocksync']}];
  ep.advice.darth = [{id: 'd1', when: {hybridUnlocked: true}, text: '.', reveals: ['e_clocksync']}, {id: 'd2', when: {inspected: ['e_technician']}, text: '.', reveals: ['e_protocol']}, {id: 'd3', text: '.'}];
  ep.advice.donsol = [{id: 's1', when: {consultedFewerThan: 1}, text: '.', reveals: ['e_clocksync', 'e_protocol']}, {id: 's2', text: '.'}];
  assert.deepEqual(validateEpisode(ep), []);
  const {reached} = explore(ep);
  const BOUND_STATES = 6 * 5 * 31, BOUND_SELECTIONS = 4 * 6 * 5;
  let maxExplored = 0, maxSelections = 0, n = 0;
  const times = [];
  for (const s of [...reached.values()].slice(0, 2000)) feasibleHistory(s, ep); // warm up the JIT before timing
  const shuffle = xs => [...xs].reverse();
  for (const s of reached.values()) {
    for (const save of [s, {...s, discoveredEvidence: [s.discoveredEvidence[0], ...shuffle(s.discoveredEvidence.slice(1))]}]) {
      const t0 = performance.now();
      const r = feasibleHistory(save, ep);
      times.push(performance.now() - t0);
      maxExplored = Math.max(maxExplored, r.explored); maxSelections = Math.max(maxSelections, r.selections); n++;
    }
  }
  times.sort((a, b) => a - b);
  const pct = p => times[Math.min(times.length - 1, Math.floor(p * times.length))].toFixed(4);
  t.diagnostic(`worst-case shape: saves=${n} maxStatesExplored=${maxExplored}/${BOUND_STATES} maxSelectAdviceCalls=${maxSelections}/${BOUND_SELECTIONS} searchMs p50=${pct(.5)} p99=${pct(.99)} p99.9=${pct(.999)} max=${times.at(-1).toFixed(3)}`);
  assert(maxExplored <= BOUND_STATES);
  assert(maxSelections <= BOUND_SELECTIONS);
});
