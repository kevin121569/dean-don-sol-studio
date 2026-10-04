// Issue #5: close the four Issue #4 conditional-pass gaps. Every gap has its exact Astra reproducer,
// a control, and broader property coverage. Run against base c1dedcc first: the reproducers fail there.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateEpisode} from '../js/content.js';
import {reduce, ACTIONS as A} from '../js/engine.js';
import {createInitialState, restoreState, explainRestore} from '../js/state.js';
import {selectAdvice} from '../js/advice.js';
import {makeUI, openingTags} from './ui-harness.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const episode = JSON.parse(fs.readFileSync(path.join(root, 'data/episode-001.json'), 'utf8'));
const clone = value => structuredClone(value);
const consult = advisorId => ({type: A.CONSULT, advisorId});
const open = evidenceId => ({type: A.OPEN_EVIDENCE, evidenceId});
const play = (actions, ep = episode) => actions.reduce((s, a) => reduce(s, a, ep), createInitialState(ep));
// Same reference-preserving rename the Issue #2/#4 audits used.
const renameId = (value, oldId, newId) => typeof value === 'string' ? (value === oldId ? newId : value)
  : Array.isArray(value) ? value.map(v => renameId(v, oldId, newId))
    : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).map(([k, v]) => [k === oldId ? newId : k, renameId(v, oldId, newId)])) : value;
const loadDomIds = () => import('../js/dom-ids.js'); // new in r2; absent at base, so dependent tests fail there

// =============================================================================================
// GAP 1 — CONSULT_ALL telemetry truncated by an ordinary nested state change
// =============================================================================================
const consultAllEvents = ui => ui.app.events().filter(e => e.type === 'advisor_consult' && e.mode === 'all');

test('R2-1 Astra reproducer: ordinary nested GO_TO_DECISION during BOY event keeps all four consult-all events', async () => {
  const ui = makeUI(episode); await ui.app.boot();
  ui.app.dispatch({type: A.START});
  let nested = 0;
  ui.window.handlers.push(event => {
    if (event.detail.type === 'advisor_consult' && event.detail.advisorId === 'boy' && !nested++) ui.app.dispatch({type: A.GO_TO_DECISION});
  });
  ui.app.dispatch({type: A.CONSULT_ALL});
  const s = ui.app.getState();
  assert.equal(nested, 1);
  assert.equal(s.sceneId, 'decide', 'the nested ordinary transition still happened');
  assert.equal(s.consultations.length, 4, 'outer CONSULT_ALL committed four results');
  const events = consultAllEvents(ui);
  assert.deepEqual(events.map(e => e.advisorId), ['boy', 'tooth', 'darth', 'donsol'], 'each committed adviser logged exactly once, in order');
  assert.deepEqual(events.map(e => e.adviceId), s.consultations.map(c => c.adviceId), 'telemetry matches committed state');
  assert(events.every(e => e.updated === true));
});

test('R2-1 control: reset during CONSULT_ALL still cancels the old run (no reset-overwrite race)', async () => {
  const ui = makeUI(episode); await ui.app.boot();
  ui.app.dispatch({type: A.START});
  let resets = 0;
  ui.window.handlers.push(event => { if (event.detail.type === 'advisor_consult' && !resets++) ui.app.resetGame(); });
  ui.app.dispatch({type: A.CONSULT_ALL}); ui.flush();
  assert.equal(resets, 1);
  assert.deepEqual(ui.app.getState(), createInitialState(episode), 'reset state wins');
  assert.equal(consultAllEvents(ui).length, 1, 'no old-run events after the reset');
  assert.equal(ui.live(), '', 'no old-run announcement');
  // The new run behaves normally.
  ui.window.handlers.length = 0;
  ui.app.dispatch({type: A.START}); ui.app.dispatch({type: A.CONSULT_ALL});
  assert.equal(consultAllEvents(ui).length, 5);
});

test('R2-1 control: reset followed by a new-run START inside the listener is still a cancellation', async () => {
  const ui = makeUI(episode); await ui.app.boot();
  ui.app.dispatch({type: A.START});
  let fired = 0;
  ui.window.handlers.push(event => {
    if (event.detail.type === 'advisor_consult' && !fired++) { ui.app.resetGame(); ui.app.dispatch({type: A.START}); }
  });
  ui.app.dispatch({type: A.CONSULT_ALL});
  assert.equal(ui.app.getState().sceneId, 'investigate');
  assert.equal(ui.app.getState().consultations.length, 0, 'new run, nothing consulted');
  assert.equal(consultAllEvents(ui).length, 1, 'old run stopped at the reset');
});

test('R2-1 same root cause: ordinary nested VIEW_POSTMORTEM during decision_submit keeps episode_complete', async () => {
  const ui = makeUI(episode); await ui.app.boot();
  ui.app.dispatch({type: A.START}); ui.app.dispatch({type: A.GO_TO_DECISION});
  ui.window.handlers.push(event => { if (event.detail.type === 'decision_submit') ui.app.dispatch({type: A.VIEW_POSTMORTEM}); });
  ui.app.dispatch({type: A.SUBMIT_DECISION, decisionId: 'd_verify'});
  assert.equal(ui.app.getState().sceneId, 'postmortem');
  const complete = ui.app.events().filter(e => e.type === 'episode_complete');
  assert.equal(complete.length, 1);
  assert.equal(complete[0].outcomeId, 'd_verify');
});

test('R2-1 exactly once: a nested repeat CONSULT_ALL logs its own four no-op events, outer still logs four', async () => {
  const ui = makeUI(episode); await ui.app.boot();
  ui.app.dispatch({type: A.START});
  let nested = 0;
  ui.window.handlers.push(event => {
    if (event.detail.type === 'advisor_consult' && event.detail.advisorId === 'tooth' && !nested++) ui.app.dispatch({type: A.CONSULT_ALL});
  });
  ui.app.dispatch({type: A.CONSULT_ALL});
  const events = consultAllEvents(ui);
  assert.equal(events.length, 8);
  assert.equal(events.filter(e => e.updated).length, 4, 'outer action: four updates, each once');
  assert.equal(events.filter(e => !e.updated).length, 4, 'nested repeat: four intentional no-op events');
  for (const id of episode.advisorOrder) assert.equal(events.filter(e => e.updated && e.advisorId === id).length, 1, id);
});

// =============================================================================================
// GAP 2 — generated DOM ID collisions
// =============================================================================================
const idsIn = html => openingTags(html).flatMap(t => t.attributes.filter(([k]) => k === 'id').map(([, v]) => v));
const refsIn = html => openingTags(html).flatMap(t => t.attributes
  .filter(([k]) => ['aria-controls', 'aria-labelledby', 'aria-describedby', 'for'].includes(k))
  .flatMap(([, v]) => v.split(/\s+/).filter(Boolean)));
const INDEX_IDS = idsIn(fs.readFileSync(path.join(root, 'index.html'), 'utf8'));

/** Render every scene shape (all evidence open, hybrid locked and unlocked) and collect each document's ids. */
async function renderAllScenes(ep) {
  const docs = [];
  const snap = ui => docs.push(ui.html());
  for (const unlock of [false, true]) {
    const ui = makeUI(ep, {validate: false}); await ui.app.boot();
    snap(ui);
    ui.app.dispatch({type: A.START});
    for (const id of ep.advisorOrder) ui.app.dispatch(consult(id));
    const s = ui.app.getState();
    for (const e of s.discoveredEvidence) if (unlock || !ep.hybridUnlock.inspected.includes(e)) ui.click('toggleEvidence', e);
    snap(ui);
    ui.app.dispatch({type: A.GO_TO_DECISION}); snap(ui);
  }
  return docs;
}

test('R2-2 Astra reproducer: e_controller renamed to body-e_monitor is rejected before rendering', async () => {
  const poisoned = renameId(clone(episode), 'e_controller', 'body-e_monitor');
  const problems = validateEpisode(poisoned);
  assert(problems.some(p => p.includes('ev-body-e_monitor')), problems.join('\n'));
  const ui = makeUI(poisoned); await ui.app.boot();
  assert.equal(ui.app.getState(), undefined, 'app refuses to start');
  // Demonstrate the hazard the validator prevents: unvalidated rendering really collides.
  const docs = await renderAllScenes(poisoned);
  assert(docs.some(html => { const ids = idsIn(html); return ids.length !== new Set(ids).size; }));
});

test('R2-2 pairwise: every namespace pair that can collide is rejected (evidence and decision ids)', async t => {
  const {ID_NAMESPACES} = await loadDomIds();
  const owners = {evidence: episode.evidence.map(e => e.id), decision: episode.decisions.map(d => d.id)};
  let checked = 0, collidingPairs = 0;
  for (const a of ID_NAMESPACES) for (const b of ID_NAMESPACES) {
    if (a === b || a.owner === 'adviser' || b.owner === 'adviser') continue;
    // Make b('x_seed') == a(y) by solving for y from a's fixed prefix/suffix.
    const target = b.make('x_seed');
    if (!target.startsWith(a.prefix) || !target.endsWith(a.suffix)) continue;
    const y = target.slice(a.prefix.length, target.length - a.suffix.length);
    if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(y)) continue;
    collidingPairs++;
    const [ownerA, ownerB] = [owners[a.owner], owners[b.owner]];
    const ep = renameId(renameId(clone(episode), ownerB[0], 'x_seed'), a.owner === b.owner ? ownerA[1] : ownerA[0], y);
    const problems = validateEpisode(ep);
    assert(problems.some(p => p.includes(`"${target}"`)), `${a.name} vs ${b.name} (${y} / x_seed): ${problems.join(' | ')}`);
    checked++;
  }
  assert(collidingPairs >= 4, 'the prefix family ev-/ev-body-/ev-t-/ev-s-/ev-src- must be exercised');
  assert.equal(checked, collidingPairs);
  t.diagnostic(`namespace pairs examined=${ID_NAMESPACES.length ** 2 - ID_NAMESPACES.length} collidable=${collidingPairs} rejected=${checked}`);
});

test('R2-2 property: 600 seeded adversarial id sets — accepted ⇒ every rendered DOM id and ARIA ref is unique; rejected ⇒ a real collision', async t => {
  const {allDomIds} = await loadDomIds();
  let a = 0x5eed2; const rand = () => (a = (a * 1103515245 + 12345) % 2147483648) / 2147483648;
  const frags = ['ev', 'body', 't', 's', 'src', 'dec', 'lock', 'e', 'x', 'monitor', 'adv', 'trust', 'consult', 'name'];
  const word = () => { const n = 1 + Math.floor(rand() * 3); let w = frags[Math.floor(rand() * frags.length)]; for (let i = 1; i < n; i++) w += (rand() < .5 ? '-' : '_') + frags[Math.floor(rand() * frags.length)]; return /^[A-Za-z]/.test(w) ? w : 'x' + w; };
  let accepted = 0, rejected = 0;
  for (let i = 0; i < 600; i++) {
    let ep = clone(episode);
    for (const id of [...episode.evidence.map(e => e.id), ...episode.decisions.map(d => d.id)]) {
      if (rand() >= .6) continue;
      const isEvidence = ep.evidence.some(e => e.id === id);
      // A third of evidence renames aim at another item's id behind a colliding prefix (the Astra shape).
      const aimed = isEvidence && rand() < .35;
      const others = ep.evidence.map(e => e.id).filter(x => x !== id);
      ep = renameId(ep, id, aimed ? `${['body', 't', 's', 'src'][Math.floor(rand() * 4)]}-${others[Math.floor(rand() * others.length)]}` : word());
    }
    const structural = new Set([...ep.evidence.map(e => e.id), ...ep.decisions.map(d => d.id)]).size === 9;
    if (!structural) continue;
    const problems = validateEpisode(ep);
    const all = allDomIds(ep);
    const realCollision = all.length !== new Set(all).size;
    const collisionReported = problems.some(p => /DOM id collision/.test(p));
    assert.equal(collisionReported, realCollision, `seed ${i}: ${problems.join(' | ')}`);
    if (problems.length) { rejected++; continue; }
    accepted++;
    for (const html of await renderAllScenes(ep)) {
      const ids = [...idsIn(html), ...INDEX_IDS];
      assert.equal(ids.length, new Set(ids).size, `seed ${i}: duplicate rendered id`);
      for (const ref of refsIn(html)) assert.equal(ids.filter(x => x === ref).length, 1, `seed ${i}: ARIA/for ref ${ref}`);
    }
  }
  t.diagnostic(`id sets: accepted=${accepted} (all scenes rendered, ids+refs unique) rejected=${rejected} (each a real collision)`);
  assert(accepted > 100 && rejected > 20, `both branches exercised (accepted ${accepted}, rejected ${rejected})`);
});

test('R2-2 completeness: every id the renderer emits is enumerated by generatedIds(), and STATIC_IDS covers every literal id', async () => {
  const {allDomIds, STATIC_IDS} = await loadDomIds();
  const enumerated = new Set(allDomIds(episode));
  for (const html of await renderAllScenes(episode)) for (const id of idsIn(html)) assert(enumerated.has(id), `renderer emitted unenumerated id "${id}"`);
  const appSource = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');
  const literals = [...appSource.matchAll(/\bid="([A-Za-z][\w-]*)"/g)].map(m => m[1]);
  for (const id of [...literals, ...INDEX_IDS]) assert(STATIC_IDS.includes(id), `literal id "${id}" missing from STATIC_IDS`);
  assert.equal(new Set(allDomIds(episode)).size, allDomIds(episode).length, 'shipped episode has no collisions');
});

// =============================================================================================
// GAP 3 — relative asset URL validation bypass
// =============================================================================================
const withIcon = icon => { const ep = clone(episode); ep.advisors.boy.icon = icon; return ep; };
const iconRejected = icon => validateEpisode(withIcon(icon)).some(p => /advisors\.boy: icon/.test(p));
const BASE = 'https://studio.invalid/games/harness-who-do-you-trust/';

test('R2-3 Astra reproducers: whitespace/control-obfuscated and protocol-relative icons are rejected', () => {
  const cases = {
    'leading space': ' https://example.invalid/boy.svg',
    'leading tab': '\thttps://example.invalid/boy.svg',
    'leading newline': '\nhttps://example.invalid/boy.svg',
    'leading CR LF': '\r\nhttps://example.invalid/boy.svg',
    'protocol-relative': '//example.invalid/boy.svg',
    'protocol-relative after space': ' //example.invalid/boy.svg',
  };
  for (const [label, icon] of Object.entries(cases)) {
    // Prove each is a real external-resolution hazard in a WHATWG URL parser (what browsers use)…
    assert.notEqual(new URL(icon, BASE).origin, new URL(BASE).origin, `${label} resolves externally`);
    // …and that validation now rejects it.
    assert(iconRejected(icon), label);
  }
});

test('R2-3 broader: absolute, scheme, encoded, backtracking and malformed local paths are rejected', () => {
  const rejected = [
    'https://example.invalid/boy.svg', 'HTTPS://example.invalid/boy.svg', 'http:example.invalid/boy.svg',
    'javascript:alert(1)', 'data:image/svg+xml,<svg/>', 'blob:x', ' \t\n//x.invalid/a.svg', 'assets/characters/boy.svg\u0000',
    '\u0001assets/characters/boy.svg', ' https://example.invalid/boy.svg', '﻿https://example.invalid/boy.svg',
    'h\ttps://example.invalid/boy.svg', '/assets/characters/boy.svg', '\\\\example.invalid\\boy.svg', '\\/example.invalid/boy.svg',
    'assets/../../../etc/x.svg', 'assets/characters/../../x.svg', 'assets/%2e%2e/x.svg', 'assets/%2E%2E/%2E%2E/x.svg',
    'assets%2fcharacters%2fboy.svg', 'assets/./characters/boy.svg', './assets/characters/boy.svg', 'assets//characters/boy.svg',
    'assets\\characters\\boy.svg', 'assets/characters/boy.svg?v=1', 'assets/characters/boy.svg#x', 'assets/characters/boy.svg ',
    ' assets/characters/boy.svg', 'assets/characters/', 'assets/characters/boy', 'assets/characters/boy.exe', 'characters/boy.svg',
    'css/game.css', '', '   ', null, 42, {},
  ];
  for (const icon of rejected) assert(iconRejected(icon), JSON.stringify(icon));
});

test('R2-3 valid relative icons are still accepted and resolve inside the game\'s assets folder', () => {
  for (const icon of ['assets/characters/boy.svg', 'assets/characters/don-sol_2.svg', 'assets/ui/icon.png', 'assets/ui/badge.webp', ...Object.values(episode.advisors).map(a => a.icon)]) {
    assert(!iconRejected(icon), icon);
    const url = new URL(icon, BASE);
    assert.equal(url.origin, new URL(BASE).origin);
    assert(url.pathname.startsWith(new URL('assets/', BASE).pathname), icon);
  }
  assert.deepEqual(validateEpisode(episode), [], 'shipped episode still valid');
});

// =============================================================================================
// GAP 4 — engine-impossible discoveredEvidence order accepted by restore
// =============================================================================================
const VISIBLE = episode.evidence.filter(e => !e.hidden).map(e => e.id);

test('R2-4 Astra reproducer: a valid BOY save with discoveredEvidence reversed is rejected', () => {
  const s = play([{type: A.START}, consult('boy')]);
  assert(restoreState(s, episode), 'control: the real save restores');
  const reversed = {...s, discoveredEvidence: [...s.discoveredEvidence].reverse()};
  assert.equal(restoreState(reversed, episode), null);
  assert(explainRestore(reversed, episode).some(p => /discoveredEvidence order/.test(p)));
});

test('R2-4 broader: every non-canonical order of the 5 discovered items is rejected; only the engine order restores', () => {
  const s = play([{type: A.START}, consult('boy'), open('e_clocksync'), open('e_monitor')]);
  const perms = xs => xs.length < 2 ? [xs] : xs.flatMap((x, i) => perms([...xs.slice(0, i), ...xs.slice(i + 1)]).map(p => [x, ...p]));
  let accepted = 0;
  for (const order of perms(s.discoveredEvidence)) {
    const ok = restoreState({...s, discoveredEvidence: order}, episode) !== null;
    if (ok) { accepted++; assert.deepEqual(order, [...VISIBLE, 'e_clocksync']); }
  }
  assert.equal(accepted, 1, 'exactly one of 120 orders is engine-reachable');
  // Initial (no BOY) saves: every permutation of the visible prefix except the canonical one is rejected.
  const fresh = play([{type: A.START}]);
  assert.equal(perms(VISIBLE).filter(o => restoreState({...fresh, discoveredEvidence: o}, episode)).length, 1);
});

// A second episode shape exercises append semantics the shipped episode cannot: two hidden items,
// revealed by different advisers (either order is legitimate) and a multi-item reveal (fixed order).
function twoHiddenEpisode() {
  const ep = clone(episode);
  ep.evidence = [
    ...episode.evidence.filter(e => ['e_monitor', 'e_controller', 'e_technician'].includes(e.id)),
    {...episode.evidence.find(e => e.id === 'e_clocksync')},
    {...episode.evidence.find(e => e.id === 'e_protocol'), hidden: true},
  ];
  ep.advice.darth = [{id: 'darth_reveal', when: {}, text: 'Policy says…', reveals: ['e_protocol']}];
  ep.advice.donsol = [{id: 'donsol_both', when: {inspected: ['e_technician']}, text: 'Both.', reveals: ['e_protocol', 'e_clocksync']},
    {id: 'donsol_plain', when: {}, text: 'Plain.'}];
  return ep;
}

test('R2-4 append semantics: either reveal order across advisers restores; impossible orders do not', () => {
  const ep = twoHiddenEpisode();
  assert.deepEqual(validateEpisode(ep), []);
  const boyFirst = play([{type: A.START}, consult('boy'), consult('darth')], ep);
  const darthFirst = play([{type: A.START}, consult('darth'), consult('boy')], ep);
  assert.deepEqual(boyFirst.discoveredEvidence.slice(3), ['e_clocksync', 'e_protocol']);
  assert.deepEqual(darthFirst.discoveredEvidence.slice(3), ['e_protocol', 'e_clocksync']);
  assert(restoreState(boyFirst, ep) && restoreState(darthFirst, ep), 'both legitimate orders restore');
  // Multi-reveal by Don Sol appends in its listed order: [e_protocol, e_clocksync].
  const donOnly = play([{type: A.START}, open('e_technician'), consult('donsol')], ep);
  assert.deepEqual(donOnly.discoveredEvidence.slice(3), ['e_protocol', 'e_clocksync']);
  assert(restoreState(donOnly, ep));
  const swapped = {...donOnly, discoveredEvidence: [...donOnly.discoveredEvidence.slice(0, 3), 'e_clocksync', 'e_protocol']};
  assert.equal(restoreState(swapped, ep), null, 'only Don Sol consulted: his reveal order is fixed');
  const hiddenFirst = {...boyFirst, discoveredEvidence: ['e_clocksync', ...boyFirst.discoveredEvidence.filter(e => e !== 'e_clocksync')]};
  assert.equal(restoreState(hiddenFirst, ep), null, 'reveals are appended after the visible prefix');
});

test('R2-4 no false rejections: 3,000 seeded runs × 20 steps on both episode shapes, including stale advice', t => {
  let x = 0x0dd1ce; const rand = () => (x = (x * 48271) % 2147483647) / 2147483647;
  let checked = 0, stale = 0;
  for (const ep of [episode, twoHiddenEpisode()]) {
    const any = xs => xs[Math.floor(rand() * xs.length)];
    for (let r = 0; r < 1500; r++) {
      let s = createInitialState(ep);
      for (let step = 0; step < 20; step++) {
        s = reduce(s, any([
          {type: A.START}, {type: A.CONSULT_ALL}, {type: A.GO_TO_DECISION}, {type: A.BACK_TO_INVESTIGATION},
          open(any(ep.evidence).id), consult(any(ep.advisorOrder)), {type: A.SUBMIT_DECISION, decisionId: any(ep.decisions).id},
        ]), ep);
        const why = explainRestore(JSON.parse(JSON.stringify(s)), ep);
        assert.deepEqual(why, [], `${ep === episode ? 'ep001' : 'twoHidden'} run ${r} step ${step}`);
        checked++;
      }
      if (s.consultations.some(c => selectAdvice(s, ep, c.advisorId).id !== c.adviceId)) stale++;
    }
  }
  t.diagnostic(`reachable states restored=${checked} staleAdviceRuns=${stale}`);
  assert.equal(checked, 60000);
  assert(stale > 0, 'stale-advice saves were among those restored');
});
