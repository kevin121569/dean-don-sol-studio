// Run: node --test games/who-do-you-trust/tests/
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {initialState, reduce, A, AGENTS, TIERS, migrate} from '../src/engine/state.js';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../content/episodes');
const episodes = fs.readdirSync(dir).filter(f => f.endsWith('.json')).map(f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
const play = (ep, actions) => actions.reduce((s, a) => reduce(s, a, ep), initialState(ep));

for (const ep of episodes) {
  test(`${ep.id}: content references resolve`, () => {
    const ids = new Set(Object.keys(ep.claims));
    const refs = [...ep.brief.startingClaims];
    for (const agent of AGENTS) {
      const v = ep.agents[agent];
      assert.ok(v?.fallback, `${agent} needs a fallback line`);
      for (const f of v.finds ?? []) refs.push(...f.reveals);
      for (const [key, r] of Object.entries(v.responses ?? {})) { if (key !== '_') refs.push(key); refs.push(...(r.reveals ?? [])); }
    }
    for (const id of refs) assert.ok(ids.has(id), `unknown claim ${id}`);
    for (const c of Object.values(ep.claims)) assert.ok(TIERS.includes(c.tier));
    for (const d of ep.decisions) assert.ok(ep.endings[d.ending], `decision ${d.id} → missing ending`);
  });

  test(`${ep.id}: every claim is revealable within budget`, () => {
    // Greedy explorer: always take a paste that reveals something new.
    let s = reduce(initialState(ep), {type: A.BEGIN}, ep);
    while (s.pastesLeft > 0) {
      const candidates = [{agent: 'boy', claimId: null}, ...s.revealed.flatMap(c => AGENTS.map(agent => ({agent, claimId: c})))];
      const next = candidates.map(c => reduce(s, {type: A.PASTE, ...c}, ep)).find(n => n.revealed.length > s.revealed.length);
      if (!next) break;
      s = next;
    }
    assert.deepEqual([...s.revealed].sort(), Object.keys(ep.claims).sort());
  });

  test(`${ep.id}: every ending is reachable and terminal`, () => {
    for (const d of ep.decisions) {
      const s = play(ep, [{type: A.BEGIN}, {type: A.OPEN_DECISION}, {type: A.DECIDE, optionId: d.id, confidence: 'medium'}]);
      assert.equal(s.phase, 'ending');
      assert.equal(s.endingId, d.ending);
      assert.equal(reduce(s, {type: A.PASTE, agent: 'boy', claimId: null}, ep), s, 'no actions after ending');
    }
  });
}

test('budget: pastes are spent, then the game forces a decision', () => {
  const ep = episodes[0];
  const s = play(ep, [{type: A.BEGIN}, ...Array(ep.budget.pastes).fill({type: A.PASTE, agent: 'boy', claimId: null})]);
  assert.equal(s.pastesLeft, 0);
  assert.equal(s.phase, 'decide');
  assert.equal(reduce(s, {type: A.BACK_TO_BOARD}, ep), s);
});

test('invalid actions are no-ops (same object)', () => {
  const ep = episodes[0];
  const s = reduce(initialState(ep), {type: A.BEGIN}, ep);
  assert.equal(reduce(s, {type: A.PASTE, agent: 'tooth', claimId: 'c_reset'}, ep), s, 'cannot paste an unrevealed claim');
  assert.equal(reduce(s, {type: A.PASTE, agent: 'nobody', claimId: null}, ep), s);
  assert.equal(reduce(s, {type: A.TAG, claimId: 'c_sig', tier: 'maybe'}, ep), s);
});

test('golden path: the intended investigation reaches the best ending', () => {
  const ep = episodes.find(e => e.id === 'ep01');
  const s = play(ep, [
    {type: A.BEGIN},
    {type: A.PASTE, agent: 'boy', claimId: null},
    {type: A.PASTE, agent: 'boy', claimId: null},
    {type: A.PASTE, agent: 'tooth', claimId: 'c_reset'},
    {type: A.PASTE, agent: 'darth', claimId: 'c_sig'},
    {type: A.TAG, claimId: 'c_pre_reset_don', tier: 'think'},
    {type: A.TAG, claimId: 'c_darth_did', tier: 'think'},
    {type: A.OPEN_DECISION},
    {type: A.DECIDE, optionId: 'd_open', confidence: 'medium'},
  ]);
  assert.equal(s.endingId, 'e_open');
  assert.equal(s.pastesLeft, ep.budget.pastes - 4);
  assert.ok(s.score.total >= s.score.outcome * 0.6);
});

test('saves from another episode or schema are rejected, not guessed at', () => {
  const ep = episodes[0];
  const s = initialState(ep);
  assert.equal(migrate(s, ep), s);
  assert.equal(migrate({...s, schema: 999}, ep), null);
  assert.equal(migrate({...s, episodeId: 'other'}, ep), null);
});

// Calibration policy (scoring.js). Expected values are hand-computed from the policy so a
// formula change has to be deliberate.
import {calibrationScore} from '../src/engine/scoring.js';
const ep01 = episodes.find(e => e.id === 'ep01');
const calib = (revealed, tags, confidence) =>
  calibrationScore({...initialState(ep01), revealed, tags}, ep01, {optionId: 'd_open', confidence});
const fourSaw = ['c_sig', 'c_no_memory', 'c_created', 'c_reset'];
const allSaw = ids => Object.fromEntries(ids.map(id => [id, 'saw']));

test('calibration: untagged claims earn no credit but are not counted as wrong', () => {
  assert.equal(calib(fourSaw, allSaw(fourSaw), 'medium'), 100);
  assert.equal(calib([...fourSaw, 'c_style', 'c_safe'], allSaw(fourSaw), 'medium'), 100, 'extra untagged claims do not lower accuracy');
  assert.equal(calib(['c_sig', 'c_no_memory'], allSaw(['c_sig', 'c_no_memory']), 'low'), 65, 'fewer tags = less tag credit, not a penalty');
});

test('calibration: wrong tags reduce accuracy', () => {
  assert.equal(calib(fourSaw, {...allSaw(fourSaw), c_reset: 'think'}, 'medium'), 83); // 70*.75 + 30 = 82.5
});

test('calibration: THINK labelled SAW costs an extra 20 points', () => {
  const revealed = ['c_sig', 'c_no_memory', 'c_created', 'c_darth_did'];
  const base = allSaw(['c_sig', 'c_no_memory', 'c_created']);
  const wrongOther = calib(revealed, {...base, c_darth_did: 'unknown'}, 'medium');
  const thinkAsSaw = calib(revealed, {...base, c_darth_did: 'saw'}, 'medium');
  assert.equal(wrongOther, 83);
  assert.equal(thinkAsSaw, 63);
  assert.equal(wrongOther - thinkAsSaw, 20, 'same accuracy, extra epistemic penalty');
});

test('calibration: HIGH confidence is penalised when direct SAW evidence is thin', () => {
  const thin = ['c_sig', 'c_no_memory'];                       // sawCount 2 → supports LOW only
  assert.equal(calib(thin, allSaw(thin), 'low'), 65);
  assert.equal(calib(thin, allSaw(thin), 'medium'), 50);
  assert.equal(calib(thin, allSaw(thin), 'high'), 35);
  const strong = [...fourSaw, 'c_style'];                      // sawCount 5 → supports HIGH
  assert.equal(calib(strong, allSaw(fourSaw), 'high'), 100, 'no penalty when evidence supports it');
});

test('calibration: calibrated uncertainty is rewarded', () => {
  const revealed = ['c_sig', 'c_safe'];
  const honest = calib(revealed, {c_sig: 'saw', c_safe: 'unknown'}, 'low');
  const overclaimed = calib(revealed, {c_sig: 'saw', c_safe: 'saw'}, 'high');
  assert.equal(honest, 65);
  assert.equal(overclaimed, 18); // 70*.5*.5 + (30 - 30) = 17.5
  assert.ok(honest > overclaimed);
  for (const c of ['low', 'medium', 'high']) {
    const s = calib(revealed, {}, c);
    assert.ok(s >= 0 && s <= 100);
  }
});
