// Episode 001 content + every acceptance gate from packet §11 that can be proven headlessly.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {reduce, ACTIONS as A, isHybridUnlocked, isDecisionAvailable, buildPostmortem} from '../js/engine.js';
import {createInitialState, restoreState} from '../js/state.js';
import {validateEpisode} from '../js/content.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const episode = JSON.parse(fs.readFileSync(path.join(root, 'data/episode-001.json'), 'utf8'));
const run = (actions, s = createInitialState(episode)) => actions.reduce((st, a) => reduce(st, a, episode), s);
const open = evidenceId => ({type: A.OPEN_EVIDENCE, evidenceId});
const consult = advisorId => ({type: A.CONSULT, advisorId});
const permutations = xs => xs.length <= 1 ? [xs] : xs.flatMap((x, i) => permutations([...xs.slice(0, i), ...xs.slice(i + 1)]).map(p => [x, ...p]));
const ALL_EVIDENCE = episode.evidence.map(e => e.id);
const VISIBLE = episode.evidence.filter(e => !e.hidden).map(e => e.id);

test('content validates', () => {
  assert.deepEqual(validateEpisode(episode), []);
  assert.ok(ALL_EVIDENCE.length >= 3 && ALL_EVIDENCE.length <= 5, 'packet: 3–5 evidence items');
});

test('every evidence order works (120 orders × every valid point to consult BOY = 360 runs)', () => {
  // BOY must be consulted before the hidden item can be opened; try BOY at every position.
  let orders = 0;
  for (const order of permutations(ALL_EVIDENCE)) {
    const hiddenAt = order.indexOf('e_clocksync');
    for (let boyAt = 0; boyAt <= hiddenAt; boyAt++) {
      const steps = order.map(open);
      steps.splice(boyAt, 0, consult('boy'));
      const s = run([{type: A.START}, ...steps]);
      assert.deepEqual(s.inspectedSources, order, `order ${order.join(',')} boy@${boyAt}`);
      assert.equal(new Set(s.inspectedSources).size, 5);
      assert.equal(isHybridUnlocked(s, episode), true);
      assert.ok(restoreState(JSON.parse(JSON.stringify(s)), episode), 'state stays valid');
      orders++;
    }
  }
  assert.equal(orders, 360); // 120 orders × avg 3 BOY positions
});

test('every subset of visible evidence (any order) leaves a valid, decidable state', () => {
  for (let mask = 0; mask < 1 << VISIBLE.length; mask++) {
    const subset = VISIBLE.filter((_, i) => mask & (1 << i));
    for (const order of permutations(subset)) {
      const s = run([{type: A.START}, ...order.map(open), {type: A.GO_TO_DECISION}]);
      assert.equal(s.sceneId, 'decide');
      assert.equal(isHybridUnlocked(s, episode), false, 'hybrid needs the hidden clock-sync report');
      assert.ok(restoreState(s, episode));
    }
  }
});

test('each adviser can be consulted independently', () => {
  for (const id of episode.advisorOrder) {
    const s = run([{type: A.START}, consult(id)]);
    assert.equal(s.consultations.length, 1, id);
    assert.equal(s.consultations[0].advisorId, id);
    assert.ok(restoreState(s, episode), id);
  }
});

test('consulting all advisers: no duplicates, no contradictions, idempotent, order-independent result set', () => {
  const together = run([{type: A.START}, {type: A.CONSULT_ALL}]);
  assert.deepEqual(together.consultations.map(c => c.advisorId), episode.advisorOrder);
  assert.equal(run([{type: A.CONSULT_ALL}], together), together, 'second consult-all is a no-op');
  for (const order of permutations(episode.advisorOrder)) {
    const s = run([{type: A.START}, ...order.map(consult), ...order.map(consult), {type: A.CONSULT_ALL}]);
    const ids = s.consultations.map(c => c.advisorId);
    assert.equal(new Set(ids).size, ids.length, `duplicates for ${order}`);
    assert.equal(ids.length, 4);
    assert.ok(restoreState(s, episode));
  }
});

test('hybrid unlock is deterministic: exactly when monitor + controller + clock-sync are all inspected', () => {
  const needed = episode.hybridUnlock.inspected;
  assert.deepEqual([...needed].sort(), ['e_clocksync', 'e_controller', 'e_monitor']);
  for (let mask = 0; mask < 1 << ALL_EVIDENCE.length; mask++) {
    const subset = ALL_EVIDENCE.filter((_, i) => mask & (1 << i));
    const s = run([{type: A.START}, consult('boy'), ...subset.map(open), {type: A.GO_TO_DECISION}]);
    const expected = needed.every(id => subset.includes(id));
    assert.equal(isHybridUnlocked(s, episode), expected, subset.join(','));
    assert.equal(isDecisionAvailable(s, episode, 'd_hybrid'), expected);
    const tried = reduce(s, {type: A.SUBMIT_DECISION, decisionId: 'd_hybrid'}, episode);
    assert.equal(tried.completed, expected, 'locked hybrid cannot be submitted');
  }
  // Discovering without reading is not enough.
  const surfacedOnly = run([{type: A.START}, consult('boy'), open('e_monitor'), open('e_controller')]);
  assert.equal(isHybridUnlocked(surfacedOnly, episode), false);
});

test('every decision route reaches a complete, valid postmortem', () => {
  const full = [{type: A.START}, {type: A.CONSULT_ALL}, ...ALL_EVIDENCE.map(open), {type: A.SET_TRUST, advisorId: 'darth', value: -1}, {type: A.ACKNOWLEDGE_UNCERTAINTY, value: true}, {type: A.GO_TO_DECISION}];
  const minimal = [{type: A.START}, {type: A.GO_TO_DECISION}];
  for (const d of episode.decisions) {
    for (const [label, prefix] of [['full', full], ['minimal', minimal]]) {
      if (d.requiresHybrid && label === 'minimal') continue;
      const s = run([...prefix, {type: A.SUBMIT_DECISION, decisionId: d.id}, {type: A.VIEW_POSTMORTEM}]);
      assert.equal(s.sceneId, 'postmortem', `${d.id}/${label}`);
      assert.equal(s.completed, true);
      assert.equal(s.outcomeId, d.id);
      assert.deepEqual(s.playerDecisions, [{decisionId: d.id}]);
      const pm = buildPostmortem(s, episode);
      assert.ok(pm.unknown.length > 0, 'unknown is always a legitimate, non-empty section');
      assert.equal(pm.advisors.length, 4);
      assert.ok(pm.advisors.every(a => ['strong', 'weak', 'mixed'].includes(a.rating) && a.text));
      assert.equal(pm.alternatives.length, episode.decisions.length - 1);
      assert.ok(pm.alternatives.every(a => a.risk));
      if (label === 'minimal') assert.equal(pm.known.length, 0);
      assert.ok(restoreState(JSON.parse(JSON.stringify(s)), episode));
    }
  }
});

test('no ending text claims a single "right AI" or false certainty', () => {
  const text = JSON.stringify([episode.decisions, episode.postmortem]).toLowerCase();
  for (const phrase of ['right ai', 'correct ai', 'you were right', 'the answer was', 'perfect score']) {
    assert.ok(!text.includes(phrase), phrase);
  }
});

test('no core-play network dependency: no absolute URLs or remote loads in shipped files', () => {
  const shipped = ['index.html', 'css/game.css', ...fs.readdirSync(path.join(root, 'js')).map(f => `js/${f}`)];
  for (const f of shipped) {
    const src = fs.readFileSync(path.join(root, f), 'utf8');
    assert.ok(!/(?:src|href)=["']\s*(?:https?:)?\/\//i.test(src), `${f}: remote src/href`);
    assert.ok(!/(?:src|href)=["']\//i.test(src), `${f}: root-absolute asset path`);
    assert.ok(!/url\(\s*["']?(?:https?:)?\/\//i.test(src), `${f}: remote CSS url()`);
    assert.ok(!/fetch\(\s*["'`]https?:/i.test(src), `${f}: remote fetch`);
    assert.ok(!/@import/i.test(src), `${f}: CSS @import`);
  }
  for (const icon of Object.values(episode.advisors).map(a => a.icon)) {
    assert.ok(fs.existsSync(path.join(root, icon)), `missing ${icon}`);
  }
});
