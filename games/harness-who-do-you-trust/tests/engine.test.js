// Engine, state, persistence and telemetry. Run: node --test games/harness-who-do-you-trust/tests/
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {reduce, ACTIONS as A, isHybridUnlocked, selectAdvice, buildPostmortem} from '../js/engine.js';
import {createInitialState, restoreState, createStore, STATE_VERSION} from '../js/state.js';
import {createTelemetry, EVENT_TYPES} from '../js/telemetry.js';

const episode = JSON.parse(fs.readFileSync(new URL('../data/episode-001.json', import.meta.url)));
const run = (actions, s = createInitialState(episode)) => actions.reduce((st, a) => reduce(st, a, episode), s);
const started = () => run([{type: A.START}]);

test('initial state matches the packet §5 shape and is JSON-serializable', () => {
  const s = createInitialState(episode);
  assert.deepEqual(Object.keys(s).sort(), ['completed', 'consultations', 'discoveredEvidence', 'episodeId', 'inspectedSources',
    'outcomeId', 'playerDecisions', 'sceneId', 'trustWeights', 'uncertaintyAcknowledged', 'version'].sort());
  assert.deepEqual(s.trustWeights, {boy: 0, tooth: 0, darth: 0, donsol: 0});
  assert.equal(s.sceneId, 'briefing');
  assert.ok(!s.discoveredEvidence.includes('e_clocksync'), 'hidden evidence starts undiscovered');
  assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
});

test('invalid or out-of-scene actions return the same object', () => {
  const brief = createInitialState(episode);
  assert.equal(reduce(brief, {type: A.OPEN_EVIDENCE, evidenceId: 'e_monitor'}, episode), brief, 'cannot inspect during briefing');
  assert.equal(reduce(brief, {type: A.CONSULT, advisorId: 'boy'}, episode), brief);
  const s = started();
  assert.equal(reduce(s, {type: A.OPEN_EVIDENCE, evidenceId: 'e_clocksync'}, episode), s, 'cannot open undiscovered evidence');
  assert.equal(reduce(s, {type: A.OPEN_EVIDENCE, evidenceId: 'nope'}, episode), s);
  assert.equal(reduce(s, {type: A.CONSULT, advisorId: 'nobody'}, episode), s);
  assert.equal(reduce(s, {type: A.SET_TRUST, advisorId: 'boy', value: 1}, episode), s, 'cannot rate an adviser you have not heard');
  assert.equal(reduce(s, {type: A.SUBMIT_DECISION, decisionId: 'd_shutdown'}, episode), s, 'must be on decide scene');
  assert.equal(reduce(s, {type: 'mystery'}, episode), s);
});

test('opening evidence twice does not duplicate it', () => {
  const s = run([{type: A.OPEN_EVIDENCE, evidenceId: 'e_monitor'}], started());
  assert.equal(reduce(s, {type: A.OPEN_EVIDENCE, evidenceId: 'e_monitor'}, episode), s);
  assert.deepEqual(s.inspectedSources, ['e_monitor']);
});

test('BOY surfaces the hidden clock-sync report exactly once', () => {
  const s = run([{type: A.CONSULT, advisorId: 'boy'}], started());
  assert.ok(s.discoveredEvidence.includes('e_clocksync'));
  assert.ok(!s.inspectedSources.includes('e_clocksync'), 'surfacing is not reading');
  const again = reduce(s, {type: A.CONSULT, advisorId: 'boy'}, episode);
  assert.equal(again, s, 're-consulting with nothing new is a no-op');
});

test('re-consulting after new evidence replaces that adviser\'s entry instead of appending', () => {
  let s = run([{type: A.CONSULT, advisorId: 'tooth'}], started());
  assert.deepEqual(s.consultations, [{advisorId: 'tooth', adviceId: 'tooth_unread'}]);
  s = run([{type: A.OPEN_EVIDENCE, evidenceId: 'e_monitor'}, {type: A.OPEN_EVIDENCE, evidenceId: 'e_controller'}, {type: A.CONSULT, advisorId: 'tooth'}], s);
  assert.deepEqual(s.consultations, [{advisorId: 'tooth', adviceId: 'tooth_conflict'}]);
});

test('trust weights accept only -1/0/1 for consulted advisers', () => {
  let s = run([{type: A.CONSULT, advisorId: 'darth'}, {type: A.SET_TRUST, advisorId: 'darth', value: -1}], started());
  assert.equal(s.trustWeights.darth, -1);
  assert.equal(reduce(s, {type: A.SET_TRUST, advisorId: 'darth', value: 5}, episode), s);
});

test('Don Sol is only as good as the inputs: thin → framing → staged', () => {
  const thin = started();
  assert.equal(selectAdvice(thin, episode, 'donsol').id, 'donsol_thin');
  const two = run([{type: A.CONSULT, advisorId: 'tooth'}, {type: A.CONSULT, advisorId: 'darth'}], started());
  assert.equal(selectAdvice(two, episode, 'donsol').id, 'donsol_frame');
  const unlocked = run(['e_monitor', 'e_controller'].map(evidenceId => ({type: A.OPEN_EVIDENCE, evidenceId}))
    .concat({type: A.CONSULT, advisorId: 'boy'}, {type: A.OPEN_EVIDENCE, evidenceId: 'e_clocksync'}), started());
  assert.equal(selectAdvice(unlocked, episode, 'donsol').id, 'donsol_staged');
});

test('reset returns a fresh initial state from any scene', () => {
  const done = run([{type: A.GO_TO_DECISION}, {type: A.SUBMIT_DECISION, decisionId: 'd_verify'}], started());
  assert.deepEqual(reduce(done, {type: A.RESET}, episode), createInitialState(episode));
});

test('completed episodes are frozen except for viewing the postmortem and reset', () => {
  const done = run([{type: A.CONSULT, advisorId: 'boy'}, {type: A.GO_TO_DECISION}, {type: A.SUBMIT_DECISION, decisionId: 'd_preserve'}], started());
  for (const a of [{type: A.CONSULT, advisorId: 'tooth'}, {type: A.SET_TRUST, advisorId: 'boy', value: 1},
    {type: A.ACKNOWLEDGE_UNCERTAINTY, value: true}, {type: A.SUBMIT_DECISION, decisionId: 'd_shutdown'}, {type: A.GO_TO_DECISION}]) {
    assert.equal(reduce(done, a, episode), done, a.type);
  }
  assert.equal(reduce(done, {type: A.VIEW_POSTMORTEM}, episode).sceneId, 'postmortem');
});

// ---- persistence ----
const memoryBackend = () => { const m = new Map(); return {getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), removeItem: k => m.delete(k)}; };

test('refresh restore: save → load round-trips mid-episode state', () => {
  const store = createStore(episode, memoryBackend());
  const s = run([{type: A.OPEN_EVIDENCE, evidenceId: 'e_technician'}, {type: A.CONSULT, advisorId: 'boy'}, {type: A.SET_TRUST, advisorId: 'boy', value: 1}], started());
  assert.ok(store.save(s));
  assert.deepEqual(store.load(), s);
  store.clear();
  assert.equal(store.load(), null);
});

test('corrupt, foreign, or future saves are rejected rather than guessed at', () => {
  const s = started();
  assert.equal(restoreState({...s, version: STATE_VERSION + 1}, episode), null);
  assert.equal(restoreState({...s, episodeId: 'episode-999'}, episode), null);
  assert.equal(restoreState({...s, inspectedSources: ['e_clocksync']}, episode), null, 'inspected must be discovered');
  assert.equal(restoreState({...s, consultations: [{advisorId: 'boy', adviceId: 'x'}, {advisorId: 'boy', adviceId: 'y'}]}, episode), null, 'duplicate adviser entries');
  assert.equal(restoreState({...s, trustWeights: {...s.trustWeights, boy: 7}}, episode), null);
  assert.equal(restoreState('not json', episode), null);
  const broken = {getItem: () => '{bad json', setItem: () => { throw new Error('quota'); }, removeItem: () => { throw new Error('blocked'); }};
  const store = createStore(episode, broken);
  assert.equal(store.load(), null);
  assert.equal(store.save(s), false);
  assert.doesNotThrow(() => store.clear());
});

// ---- telemetry ----
test('telemetry events carry stable type, timestamp, episode and fields; unknown types throw', () => {
  const seen = [];
  const t = createTelemetry({episodeId: 'episode-001', sinks: [e => seen.push(e), () => { throw new Error('bad sink'); }], now: () => 0});
  const e = t.track('evidence_open', {evidenceId: 'e_monitor'});
  assert.deepEqual({...e}, {evidenceId: 'e_monitor', type: 'evidence_open', episode: 'episode-001', timestamp: '1970-01-01T00:00:00.000Z'});
  assert.equal(seen.length, 1, 'a throwing sink does not stop other sinks or play');
  assert.throws(() => t.track('player_email', {}));
  assert.deepEqual(EVENT_TYPES, ['episode_start', 'evidence_open', 'advisor_consult', 'decision_submit', 'episode_complete', 'help_open']);
  assert.equal(t.track('help_open', {type: 'spoofed', episode: 'x'}).type, 'help_open', 'fields cannot override type');
  assert.equal(t.events().at(-1).episode, 'episode-001', 'fields cannot override episode');
});

test('postmortem is null until complete', () => {
  assert.equal(buildPostmortem(started(), episode), null);
  assert.equal(isHybridUnlocked(started(), episode), false);
});
