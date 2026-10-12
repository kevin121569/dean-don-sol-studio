// Don Sol producer gate — isolated tests of EXISTING R1 code. No engine or UX edits.
// Draft review branch only. Source: actual Episode 001 content, engine, save validator.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createInitialState, restoreState} from '../js/state.js';
import {ACTIONS, reduce, isDecisionAvailable} from '../js/engine.js';
import {buildMissionReport} from '../creative/mission-report.js';

const episode = JSON.parse(fs.readFileSync(new URL('../data/episode-001.json', import.meta.url), 'utf8'));
const step = (state, type, extra = {}) => reduce(state, {type, ...extra}, episode);
const play = actions => actions.reduce((state, [type, extra]) => step(state, type, extra), createInitialState(episode));
const finish = id => play([
  [ACTIONS.START],
  [ACTIONS.GO_TO_DECISION],
  [ACTIONS.SUBMIT_DECISION, {decisionId: id}],
  [ACTIONS.VIEW_POSTMORTEM],
]);
const fullInvestigation = () => {
  let state = step(createInitialState(episode), ACTIONS.START);
  for (const e of episode.evidence.filter(x => !x.hidden)) {
    state = step(state, ACTIONS.OPEN_EVIDENCE, {evidenceId: e.id});
  }
  state = step(state, ACTIONS.CONSULT, {advisorId: 'boy'}); // reveals e_clocksync
  state = step(state, ACTIONS.OPEN_EVIDENCE, {evidenceId: 'e_clocksync'});
  for (const id of episode.advisorOrder.filter(id => id !== 'boy')) {
    state = step(state, ACTIONS.CONSULT, {advisorId: id});
  }
  return state;
};

test('P01: actual reducer never reports mission complete before a decision', () => {
  const initial = createInitialState(episode);
  assert.equal(buildMissionReport(initial, episode), null);
  const investigation = step(initial, ACTIONS.START);
  assert.equal(buildMissionReport(investigation, episode), null);
  assert.equal(buildMissionReport(step(investigation, ACTIONS.GO_TO_DECISION), episode), null);
});

test('P02: every ordinary outcome is reachable; result names exact source risk, not a victory score', () => {
  for (const d of episode.decisions.filter(x => !x.requiresHybrid)) {
    const state = finish(d.id);
    assert.equal(restoreState(state, episode)?.outcomeId, d.id);
    const report = buildMissionReport(state, episode);
    assert.equal(report.label, 'MISSION COMPLETE');
    assert.deepEqual(report.decision, {label: d.label, risk: d.risk});
    assert.equal(report.honours.length, 0);
    assert.equal(Object.hasOwn(report, 'score'), false);
    assert.equal(Object.hasOwn(report, 'won'), false);
    assert.match(report.note, /not the same as being right/);
  }
});

test('P03: hidden decision cannot be submitted early and never grants an award', () => {
  let state = step(createInitialState(episode), ACTIONS.START);
  assert.equal(isDecisionAvailable(state, episode, 'd_hybrid'), false);
  state = step(state, ACTIONS.GO_TO_DECISION);
  const blocked = step(state, ACTIONS.SUBMIT_DECISION, {decisionId: 'd_hybrid'});
  assert.deepEqual(blocked, state);
  assert.equal(buildMissionReport(blocked, episode), null);
  assert.notEqual(blocked.sceneId, 'outcome');
});

test('P04: minimum real evidence path unlocks hybrid, without manufacturing all-evidence awards', () => {
  let state = step(createInitialState(episode), ACTIONS.START);
  state = step(state, ACTIONS.OPEN_EVIDENCE, {evidenceId: 'e_monitor'});
  state = step(state, ACTIONS.OPEN_EVIDENCE, {evidenceId: 'e_controller'});
  state = step(state, ACTIONS.CONSULT, {advisorId: 'boy'});
  assert(state.discoveredEvidence.includes('e_clocksync'));
  state = step(state, ACTIONS.OPEN_EVIDENCE, {evidenceId: 'e_clocksync'});
  assert.equal(isDecisionAvailable(state, episode, 'd_hybrid'), true);
  state = step(state, ACTIONS.GO_TO_DECISION);
  state = step(state, ACTIONS.SUBMIT_DECISION, {decisionId: 'd_hybrid'});
  assert.equal(restoreState(state, episode)?.outcomeId, 'd_hybrid');
  const report = buildMissionReport(state, episode);
  assert.deepEqual(report.honours.map(h => h.id), ['strategy']);
  assert.deepEqual(report.evidence, {done: 3, total: episode.evidence.length});
  assert.deepEqual(report.advisers, {done: 1, total: episode.advisorOrder.length});
});

test('P05: full real play awards each earned action exactly once', () => {
  let state = fullInvestigation();
  assert.equal(state.inspectedSources.length, episode.evidence.length);
  assert.equal(state.consultations.length, episode.advisorOrder.length);
  state = step(step(state, ACTIONS.GO_TO_DECISION), ACTIONS.SUBMIT_DECISION, {decisionId: 'd_hybrid'});
  const restored = restoreState(state, episode);
  assert(restored, 'completed history should pass the save validator');
  const report = buildMissionReport(restored, episode);
  assert.deepEqual(report.honours.map(h => h.id), ['evidence', 'perspectives', 'strategy']);
  assert.deepEqual(report.evidence, {done: 5, total: 5});
  assert.deepEqual(report.advisers, {done: 4, total: 4});
  assert.equal(report.decision.risk, episode.decisions.find(d => d.id === 'd_hybrid').risk);
});

test('P06: earned records and consultations do not automatically award Hidden Strategy', () => {
  let state = fullInvestigation();
  state = step(step(state, ACTIONS.GO_TO_DECISION), ACTIONS.SUBMIT_DECISION, {decisionId: 'd_verify'});
  const report = buildMissionReport(state, episode);
  assert.deepEqual(report.honours.map(h => h.id), ['evidence', 'perspectives']);
  assert.equal(report.decision.label, episode.decisions.find(d => d.id === 'd_verify').label);
});

test('P07: completion prevents later investigation, and replay clears recognition', () => {
  let state = fullInvestigation();
  state = step(step(state, ACTIONS.GO_TO_DECISION), ACTIONS.SUBMIT_DECISION, {decisionId: 'd_shutdown'});
  assert.equal(buildMissionReport(state, episode)?.label, 'MISSION COMPLETE');
  assert.deepEqual(step(state, ACTIONS.CONSULT, {advisorId: 'boy'}), state);
  assert.deepEqual(step(state, ACTIONS.OPEN_EVIDENCE, {evidenceId: 'e_monitor'}), state);
  const reset = step(state, ACTIONS.RESET);
  assert.equal(reset.sceneId, 'briefing');
  assert.equal(buildMissionReport(reset, episode), null);
});

test('P08: validator rejects a forged hidden outcome or fabricated extra evidence', () => {
  const legitimate = finish('d_shutdown');
  const forgedHybrid = structuredClone(legitimate);
  forgedHybrid.outcomeId = 'd_hybrid';
  forgedHybrid.playerDecisions = [{decisionId: 'd_hybrid'}];
  assert.equal(restoreState(forgedHybrid, episode), null);
  const forgedEvidence = structuredClone(legitimate);
  forgedEvidence.inspectedSources = ['e_clocksync'];
  assert.equal(restoreState(forgedEvidence, episode), null);
});

test('P09: raw mission report does not double-count duplicates or invented identifiers', () => {
  const d = episode.decisions.find(x => x.id === 'd_shutdown');
  const state = {completed: true, outcomeId: d.id,
    inspectedSources: ['e_monitor', 'e_monitor', 'not_an_episode_clue'],
    consultations: [
      {advisorId: 'boy', adviceId: 'boy_find'},
      {advisorId: 'boy', adviceId: 'boy_find'},
      {advisorId: 'unknown', adviceId: 'fake'}
    ]};
  const before = structuredClone(state);
  const report = buildMissionReport(state, episode);
  assert.deepEqual(report.evidence, {done: 1, total: 5});
  assert.deepEqual(report.advisers, {done: 1, total: 4});
  assert.deepEqual(state, before);
  // This synthetic state bypasses restoreState intentionally; it tests the pure presenter.
});

test('P10: no source adviser ID is renamed, and the public adviser names match canon', () => {
  assert.deepEqual(episode.advisorOrder.map(id => episode.advisors[id].name),
    ['BOY', 'TOOTH', 'LUKE', 'DON SOL']);
  assert.equal(episode.advisors.darth.name, 'LUKE');
});
