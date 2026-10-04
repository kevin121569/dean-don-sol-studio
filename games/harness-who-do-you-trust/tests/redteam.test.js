// Issue #3: reproduce every Astra failure from the exact Issue #2 base.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateEpisode} from '../js/content.js';
import {reduce, ACTIONS as A, isHybridUnlocked, isDecisionAvailable, buildPostmortem} from '../js/engine.js';
import {createInitialState, createStore, restoreState, explainRestore} from '../js/state.js';
import {makeUI, memoryStorage, openingTags} from './ui-harness.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const episode = JSON.parse(fs.readFileSync(path.join(root, 'data/episode-001.json'), 'utf8'));
const clone = value => structuredClone(value);
const consult = advisorId => ({type: A.CONSULT, advisorId});
const open = evidenceId => ({type: A.OPEN_EVIDENCE, evidenceId});
const run = actions => actions.reduce((s, action) => reduce(s, action, episode), createInitialState(episode));
const start = () => run([{type: A.START}]);
const allEvidence = episode.evidence.map(e => e.id);

const renameId = (value, oldId, newId) => typeof value === 'string' ? (value === oldId ? newId : value)
  : Array.isArray(value) ? value.map(v => renameId(v, oldId, newId))
    : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).map(([k, v]) => [k === oldId ? newId : k, renameId(v, oldId, newId)])) : value;
const assertNoInjectedNodes = html => {
  const tags = openingTags(html);
  assert.equal(tags.filter(t => t.name === 'img' && t.attributes.some(([key, value]) => key === 'src' && value === 'x')).length, 0);
  assert(!tags.some(t => t.name === 'script'));
  assert(!tags.some(t => t.attributes.some(([key]) => /^on/i.test(key))), 'event-handler attribute escaped its quoted boundary');
};

// F1 — both validation and renderer defence, with references kept consistent.
for (const [kind, oldId] of [['evidence', 'e_monitor'], ['decision', 'd_hybrid']]) {
  test(`F1 ${kind} ID injection: reject malicious content and escape attribute boundaries`, async () => {
    const payload = oldId + '"><img src=x onerror="globalThis.__auditXss=1">';
    const poisoned = renameId(clone(episode), oldId, payload);
    assert(validateEpisode(poisoned).some(p => /safe identifier/.test(p)));
    const rejected = makeUI(poisoned);
    await rejected.app.boot();
    assert.equal(rejected.app.getState(), undefined);
    assert(rejected.html().includes('Episode could not load'));
    assertNoInjectedNodes(rejected.html());
    // Bypass the loader only here, proving rendering is independently escaped.
    const defended = makeUI(poisoned, {validate: false});
    await defended.app.boot(); defended.app.dispatch({type: A.START});
    if (kind === 'decision') defended.app.dispatch({type: A.GO_TO_DECISION});
    const html = defended.html();
    assert(html.includes('&quot;&gt;&lt;img src=x onerror=&quot;globalThis.__auditXss=1&quot;&gt;'));
    assertNoInjectedNodes(html);
  });
}

test('F1 reject unsafe IDs at every identifier definition', () => {
  for (const mutation of [
    ep => { ep.id = 'episode 001'; },
    ep => { ep.evidence[0].id = 'e\" onfocus=\"x'; },
    ep => { ep.advice.boy[0].id = 'boy<svg>'; },
    ep => { ep.decisions[0].id = 'd\" autofocus'; },
    ep => { ep.advisorOrder[0] = 'boy\" onfocus=\"x'; },
  ]) {
    const changed = clone(episode); mutation(changed);
    assert(validateEpisode(changed).length);
  }
});

test('F2 denied localStorage property getter: adapter and application boot remain playable', async () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  try {
    Object.defineProperty(globalThis, 'localStorage', {configurable: true, get() { throw new DOMException('Access denied', 'SecurityError'); }});
    const store = createStore(episode);
    assert.equal(store.load(), null);
    assert.equal(store.save(start()), false);
    assert.doesNotThrow(() => store.clear());
    const ui = makeUI(episode, {defaultStorage: true});
    await ui.app.boot(); ui.app.dispatch({type: A.START}); ui.app.dispatch(consult('boy'));
    assert.equal(ui.app.getState().sceneId, 'investigate');
    assert(ui.app.getState().discoveredEvidence.includes('e_clocksync'));
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor);
    else delete globalThis.localStorage;
  }
});

test('F2 unavailable storage methods and explicit no-op backend cannot break play', () => {
  const denied = createStore(episode, {
    getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); }, removeItem() { throw Error('blocked'); },
  });
  assert.equal(denied.load(), null); assert.equal(denied.save(start()), false); assert.doesNotThrow(() => denied.clear());
  const absent = createStore(episode, null);
  assert.equal(absent.load(), null); assert.equal(absent.save(start()), false); assert.doesNotThrow(() => absent.clear());
});

test('F3 mandatory BOY reveal required in a save (Astra reproducer)', () => {
  const forged = run([{type: A.START}, consult('boy')]);
  forged.discoveredEvidence = forged.discoveredEvidence.filter(id => id !== 'e_clocksync');
  assert.equal(restoreState(forged, episode), null);
  assert(explainRestore(forged, episode).some(p => /mandatory revealed evidence/.test(p)));
});

test('F3 Don Sol frame as first and sole consultation is impossible (Astra reproducer)', () => {
  const forged = start();
  forged.consultations = [{advisorId: 'donsol', adviceId: 'donsol_frame'}];
  assert.equal(restoreState(forged, episode), null);
  assert(explainRestore(forged, episode).some(p => /never selectable/.test(p)));
});

test('F3 legitimate stale advice and Don Sol re-consultation still restore', () => {
  const stale = run([{type: A.START}, consult('donsol'), consult('tooth'), consult('darth'), consult('boy'), ...episode.hybridUnlock.inspected.map(open)]);
  assert.equal(stale.consultations[0].adviceId, 'donsol_thin');
  assert.equal(stale.consultations.find(c => c.advisorId === 'tooth').adviceId, 'tooth_unread');
  assert.deepEqual(restoreState(stale, episode), stale);
  const reframed = run([{type: A.START}, consult('donsol'), consult('tooth'), consult('darth'), consult('donsol')]);
  assert.equal(reframed.consultations[0].adviceId, 'donsol_frame');
  assert.deepEqual(restoreState(reframed, episode), reframed);
  const staged = reduce(stale, consult('donsol'), episode);
  assert.equal(staged.consultations[0].adviceId, 'donsol_staged');
  assert.deepEqual(restoreState(staged, episode), staged);
});

test('F4 null when rejected before runtime (Astra reproducer)', () => {
  const malformed = clone(episode); malformed.advice.boy[0].when = null;
  assert.doesNotThrow(() => validateEpisode(malformed));
  assert(validateEpisode(malformed).some(p => /when must be an object/.test(p)));
});

test('F4 duplicate reveals rejected before producing an invalid save (Astra reproducer)', () => {
  const malformed = clone(episode); malformed.advice.boy[0].reveals.push('e_clocksync');
  assert(validateEpisode(malformed).some(p => /reveals must not repeat/.test(p)));
  // Engine is idempotent even if a caller bypasses content validation.
  const s = reduce(reduce(createInitialState(malformed), {type: A.START}, malformed), consult('boy'), malformed);
  assert.equal(s.discoveredEvidence.filter(id => id === 'e_clocksync').length, 1);
  assert.deepEqual(restoreState(s, malformed), s);
});

test('F4 self-dependent reveal rejected as unreachable (Astra reproducer)', () => {
  const circular = clone(episode);
  circular.advice.boy[0].when = {inspected: ['e_clocksync']};
  circular.advice.boy.push({id: 'boy_fallback', when: {}, text: 'No evidence found.'});
  assert(validateEpisode(circular).some(p => /cannot be reached from the initial state/.test(p)));
});

test('F4 reachability rejects a shadowed reveal and accepts a reachable conditional reveal', () => {
  const shadowed = clone(episode);
  shadowed.advice.boy.unshift({id: 'boy_shadow', when: {}, text: 'No evidence found.'});
  assert(validateEpisode(shadowed).some(p => /cannot be reached/.test(p)));
  const reachable = clone(episode);
  reachable.advice.boy[0].when = {inspected: ['e_monitor']};
  reachable.advice.boy.push({id: 'boy_fallback', when: {}, text: 'Inspect the monitor first.'});
  assert.deepEqual(validateEpisode(reachable), []);
});

test('F5 prototype adviser IDs are harmless engine no-ops (Astra reproducer)', () => {
  for (const advisorId of ['constructor', '__proto__', 'toString']) {
    const before = start();
    assert.strictEqual(reduce(before, consult(advisorId), episode), before, advisorId);
    assert.strictEqual(reduce(before, {type: A.SET_TRUST, advisorId, value: 1}, episode), before);
    const forged = clone(before); forged.consultations = [{advisorId, adviceId: 'boy_find'}];
    assert.doesNotThrow(() => restoreState(forged, episode));
    assert.equal(restoreState(forged, episode), null);
  }
});

test('F6 synchronous telemetry listener cannot undo a requested reset (Astra reproducer)', async () => {
  const ui = makeUI(episode); await ui.app.boot();
  let resets = 0;
  ui.window.handlers.push(event => { if (event.detail.type === 'episode_start') { resets++; ui.app.resetGame(); } });
  ui.app.dispatch({type: A.START});
  assert.equal(resets, 1);
  assert.deepEqual(ui.app.getState(), createInitialState(episode));
  assert.deepEqual(createStore(episode, ui.storage).load(), createInitialState(episode));
  assert(ui.html().includes('Begin investigation'));
});

test('F6 delayed pre-reset live callback cannot write old-run advice (Astra reproducer)', async () => {
  const ui = makeUI(episode); await ui.app.boot();
  ui.app.dispatch({type: A.START}); ui.app.dispatch(consult('boy'));
  const oldCallback = ui.callbacks[0];
  assert.equal(ui.timers.size, 1);
  ui.click('confirmReset');
  assert.equal(ui.app.getState().sceneId, 'briefing');
  oldCallback(); // Even a callback retained outside clearTimeout is invalidated.
  assert.equal(ui.live(), '');
  assert.equal(ui.timers.size, 1, 'only the new reset announcement remains queued');
  ui.flush();
  assert.equal(ui.live(), 'Progress reset. Episode 001 is back at the briefing.');
  oldCallback(); assert(!ui.live().includes('BOY:'));
});

test('F6 consult-all telemetry reset stops old-run events and announcements', async () => {
  const ui = makeUI(episode); await ui.app.boot(); ui.app.dispatch({type: A.START});
  ui.window.handlers.push(event => { if (event.detail.type === 'advisor_consult') ui.app.resetGame(); });
  ui.app.dispatch({type: A.CONSULT_ALL}); ui.flush();
  assert.equal(ui.app.getState().sceneId, 'briefing');
  assert.equal(ui.app.events().filter(e => e.type === 'advisor_consult').length, 1);
  assert.equal(ui.live(), '');
});

test('F6 decision telemetry reset cannot emit a stale episode_complete', async () => {
  const ui = makeUI(episode); await ui.app.boot();
  ui.app.dispatch({type: A.START}); ui.app.dispatch({type: A.GO_TO_DECISION});
  ui.window.handlers.push(event => { if (event.detail.type === 'decision_submit') ui.app.resetGame(); });
  ui.app.dispatch({type: A.SUBMIT_DECISION, decisionId: 'd_verify'});
  assert.equal(ui.app.getState().sceneId, 'briefing');
  assert.equal(ui.app.events().filter(e => e.type === 'episode_complete').length, 0);
});

test('F7 invalid adviser attempts do not emit advisor_consult (Astra reproducer)', async () => {
  const ui = makeUI(episode); await ui.app.boot(); ui.app.dispatch({type: A.START});
  const before = ui.app.getState();
  for (const id of ['not_an_adviser', 'constructor', '__proto__', 'toString']) {
    ui.app.dispatch(consult(id));
    assert.equal(ui.app.events().filter(e => e.type === 'advisor_consult').length, 0, id);
  }
  assert.strictEqual(ui.app.getState(), before);
  assert.equal(ui.app.events().filter(e => e.type === 'advisor_consult').length, 0);
});

test('F7 valid repeated consultations and consultAll preserve updated:false telemetry', async () => {
  const ui = makeUI(episode); await ui.app.boot(); ui.app.dispatch({type: A.START});
  ui.app.dispatch(consult('boy')); ui.app.dispatch(consult('boy'));
  ui.app.dispatch({type: A.CONSULT_ALL}); ui.app.dispatch({type: A.CONSULT_ALL});
  const events = ui.app.events().filter(e => e.type === 'advisor_consult');
  assert.equal(events.length, 10); assert.equal(events[1].updated, false);
  assert.deepEqual(events.slice(-4).map(e => e.updated), [false, false, false, false]);
  assert(events.every(e => episode.advisorOrder.includes(e.advisorId) && e.adviceId !== null));
  ui.app.dispatch({type: A.GO_TO_DECISION});
  ui.app.dispatch(consult('boy')); ui.app.dispatch({type: A.CONSULT_ALL});
  assert.equal(ui.app.events().filter(e => e.type === 'advisor_consult').length, 10);
});

test('red-team routes: all four outcomes with minimal applicable and full investigations', async () => {
  let routes = 0;
  for (const decision of episode.decisions) for (const full of [false, true]) {
    const ui = makeUI(episode); await ui.app.boot(); ui.app.dispatch({type: A.START});
    if (full) { ui.app.dispatch({type: A.CONSULT_ALL}); allEvidence.forEach(id => ui.app.dispatch(open(id))); }
    else if (decision.requiresHybrid) { ui.app.dispatch(consult('boy')); episode.hybridUnlock.inspected.forEach(id => ui.app.dispatch(open(id))); }
    ui.app.dispatch({type: A.GO_TO_DECISION}); ui.app.dispatch({type: A.ACKNOWLEDGE_UNCERTAINTY, value: true});
    ui.app.dispatch({type: A.SUBMIT_DECISION, decisionId: decision.id}); ui.app.dispatch({type: A.VIEW_POSTMORTEM});
    const state = ui.app.getState(), pm = buildPostmortem(state, episode);
    assert.equal(state.sceneId, 'postmortem'); assert.equal(state.outcomeId, decision.id);
    assert.deepEqual(restoreState(state, episode), state);
    assert.equal(pm.known.length, full ? 5 : decision.requiresHybrid ? 3 : 0);
    assert.equal(pm.advisors.length, 4); assert.equal(pm.alternatives.length, 3); assert(pm.unknown.length);
    for (const heading of ['What you knew', 'What remained unknown', 'Adviser assumptions', 'What the alternatives risked']) assert(ui.html().includes(heading));
    assert.equal(ui.app.events().filter(e => e.type === 'decision_submit').length, 1);
    assert.equal(ui.app.events().filter(e => e.type === 'episode_complete').length, 1);
    routes++;
  }
  assert.equal(routes, 8);
});

test('red-team subsets: 32 evidence subsets produce exactly 28 locked and four unlocked hybrids', () => {
  let locked = 0, unlocked = 0;
  for (let mask = 0; mask < 32; mask++) {
    const subset = allEvidence.filter((_, i) => mask & (1 << i));
    const s = run([{type: A.START}, consult('boy'), ...subset.map(open), {type: A.GO_TO_DECISION}]);
    const expected = episode.hybridUnlock.inspected.every(id => subset.includes(id));
    assert.equal(isHybridUnlocked(s, episode), expected); assert.equal(isDecisionAvailable(s, episode, 'd_hybrid'), expected);
    const next = reduce(s, {type: A.SUBMIT_DECISION, decisionId: 'd_hybrid'}, episode);
    if (expected) { unlocked++; assert.equal(next.outcomeId, 'd_hybrid'); }
    else { locked++; assert.strictEqual(next, s); }
  }
  assert.equal(locked, 28); assert.equal(unlocked, 4);
});

test('red-team refresh, restore, corrupt saves, reset and four reduced-motion combinations', async () => {
  const storage = memoryStorage(), ui = makeUI(episode, {storage}); await ui.app.boot();
  ui.app.dispatch({type: A.START}); ui.app.dispatch(consult('boy')); ui.app.dispatch(open('e_monitor'));
  ui.app.dispatch({type: A.SET_TRUST, advisorId: 'boy', value: 1}); ui.app.dispatch({type: A.GO_TO_DECISION});
  ui.app.dispatch({type: A.ACKNOWLEDGE_UNCERTAINTY, value: true});
  const reloaded = makeUI(episode, {storage}); await reloaded.app.boot(); assert.deepEqual(reloaded.app.getState(), ui.app.getState());
  reloaded.app.resetGame(); assert.deepEqual(createStore(episode, storage).load(), createInitialState(episode));
  const forged = clone(ui.app.getState()); forged.consultations[0].adviceId = 'forged';
  storage.setItem(createStore(episode, storage).key, JSON.stringify(forged));
  const rejected = makeUI(episode, {storage}); await rejected.app.boot(); assert.deepEqual(rejected.app.getState(), createInitialState(episode));
  for (const osReduced of [false, true]) for (const manual of [false, true]) {
    const backend = memoryStorage(); backend.setItem('harness-wdyt:settings', JSON.stringify({reduceMotion: manual}));
    const motion = makeUI(episode, {storage: backend, osReduced}); await motion.app.boot(); motion.app.dispatch({type: A.START});
    assert.equal(motion.window.lastScroll.behavior, osReduced || manual ? 'auto' : 'smooth');
    assert.equal(motion.document.documentElement.hasAttribute('data-motion'), manual);
  }
  const toggle = makeUI(episode); await toggle.app.boot(); toggle.click('toggleMotion');
  const toggledReload = makeUI(episode, {storage: toggle.storage}); await toggledReload.app.boot();
  assert(toggledReload.document.documentElement.hasAttribute('data-motion'));
  const css = fs.readFileSync(path.join(root, 'css/game.css'), 'utf8');
  assert(css.includes('@media (prefers-reduced-motion: no-preference)')); assert(css.includes('html:not([data-motion="reduce"])'));
});

test('red-team seeded reachable states: 30,000 samples restore without false rejections', () => {
  let seed = 0x51d27b93, samples = 0, completed = 0;
  const random = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) / 4294967296; };
  const any = values => values[Math.floor(random() * values.length)];
  for (let trial = 0; trial < 1000; trial++) {
    let state = createInitialState(episode);
    for (let step = 0; step < 30; step++) {
      const actions = [
        {type: A.START}, consult(any(episode.advisorOrder)), open(any(allEvidence)), {type: A.CONSULT_ALL},
        {type: A.SET_TRUST, advisorId: any(episode.advisorOrder), value: any([-1, 0, 1])},
        {type: A.GO_TO_DECISION}, {type: A.BACK_TO_INVESTIGATION}, {type: A.ACKNOWLEDGE_UNCERTAINTY, value: random() < .5},
        {type: A.SUBMIT_DECISION, decisionId: any(episode.decisions).id}, {type: A.VIEW_POSTMORTEM}, {type: A.RESET},
      ];
      state = reduce(state, any(actions), episode);
      assert.deepEqual(restoreState(JSON.parse(JSON.stringify(state)), episode), state);
      samples++; if (state.completed) completed++;
    }
  }
  assert.equal(samples, 30000); assert.equal(completed, 1233);
});

test('red-team static hosting: all 14 core resources are local and HTTP-accessible', async () => {
  const paths = ['index.html', 'css/game.css', ...fs.readdirSync(path.join(root, 'js')).map(f => 'js/' + f), 'data/episode-001.json', ...Object.values(episode.advisors).map(a => a.icon)];
  const server = http.createServer((req, res) => {
    const file = path.join(root, decodeURIComponent(req.url));
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, {'Content-Type': file.endsWith('.js') ? 'text/javascript' : file.endsWith('.json') ? 'application/json' : file.endsWith('.css') ? 'text/css' : file.endsWith('.svg') ? 'image/svg+xml' : 'text/html'});
    res.end(fs.readFileSync(file));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    for (const resource of paths) {
      assert(!/^(?:[a-z]+:|\/)/i.test(resource));
      const response = await fetch('http://127.0.0.1:' + server.address().port + '/' + resource);
      assert.equal(response.status, 200, resource); assert((await response.arrayBuffer()).byteLength > 0);
    }
  } finally { await new Promise(resolve => server.close(resolve)); }
  assert.equal(paths.length, 14); // r2: +js/dom-ids.js
});
