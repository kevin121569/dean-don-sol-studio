// Game state model for WHO DO YOU TRUST?
// Pure module: no DOM, no storage, no platform calls. Runs identically in the browser,
// in Capacitor's WebView, and under `node --test`.
import {calibrationScore} from './scoring.js';

export const SCHEMA_VERSION = 1;
export const AGENTS = ['boy', 'tooth', 'darth', 'don'];
export const TIERS = ['saw', 'think', 'unknown'];
export const CONFIDENCE = ['low', 'medium', 'high'];

/**
 * @typedef {'briefing'|'investigate'|'decide'|'ending'} Phase
 * @typedef {'saw'|'think'|'unknown'} Tier          what the player says they know about a claim
 * @typedef {{turn:number, agent:string, claimId:string|null, line:string, revealed:string[]}} LogEntry
 * @typedef {{
 *   schema:number, episodeId:string, episodeVersion:number,
 *   phase:Phase, turn:number, pastesLeft:number, boyFinds:number,
 *   revealed:string[], tags:Record<string,Tier>, log:LogEntry[],
 *   decision:null|{optionId:string, confidence:'low'|'medium'|'high'},
 *   endingId:null|string, score:null|{outcome:number, calibration:number, total:number}
 * }} GameState
 */

/** @returns {GameState} */
export function initialState(episode) {
  return {
    schema: SCHEMA_VERSION,
    episodeId: episode.id,
    episodeVersion: episode.version,
    phase: 'briefing',
    turn: 0,
    pastesLeft: episode.budget.pastes,
    boyFinds: 0,
    revealed: [...episode.brief.startingClaims],
    tags: {},
    log: [],
    decision: null,
    endingId: null,
    score: null,
  };
}

// Every player intent is one of these. The UI only ever dispatches; it never mutates state.
export const A = {
  BEGIN: 'BEGIN',
  PASTE: 'PASTE',             // {agent, claimId|null} — Kevin carries a claim (or nothing) to an agent
  TAG: 'TAG',                 // {claimId, tier}
  OPEN_DECISION: 'OPEN_DECISION',
  BACK_TO_BOARD: 'BACK_TO_BOARD',
  DECIDE: 'DECIDE',           // {optionId, confidence}
};

/** Pure reducer. Invalid actions return the same state object so callers can detect no-ops. */
export function reduce(state, action, episode) {
  switch (action.type) {
    case A.BEGIN:
      return state.phase === 'briefing' ? {...state, phase: 'investigate'} : state;

    case A.PASTE: {
      if (state.phase !== 'investigate' || state.pastesLeft <= 0) return state;
      if (!AGENTS.includes(action.agent)) return state;
      if (action.claimId && !state.revealed.includes(action.claimId)) return state;
      const {line, reveals, boyFinds} = respond(state, episode, action.agent, action.claimId ?? null);
      const fresh = reveals.filter(id => !state.revealed.includes(id));
      const pastesLeft = state.pastesLeft - 1;
      return {
        ...state,
        turn: state.turn + 1,
        pastesLeft,
        boyFinds,
        revealed: [...state.revealed, ...fresh],
        log: [...state.log, {turn: state.turn + 1, agent: action.agent, claimId: action.claimId ?? null, line, revealed: fresh}],
        phase: pastesLeft === 0 ? 'decide' : state.phase,
      };
    }

    case A.TAG:
      if (state.phase === 'ending' || !state.revealed.includes(action.claimId) || !TIERS.includes(action.tier)) return state;
      return {...state, tags: {...state.tags, [action.claimId]: action.tier}};

    case A.OPEN_DECISION:
      return state.phase === 'investigate' ? {...state, phase: 'decide'} : state;

    case A.BACK_TO_BOARD:
      return state.phase === 'decide' && state.pastesLeft > 0 ? {...state, phase: 'investigate'} : state;

    case A.DECIDE: {
      if (state.phase !== 'decide' || !CONFIDENCE.includes(action.confidence)) return state;
      const option = episode.decisions.find(d => d.id === action.optionId);
      if (!option) return state;
      const decision = {optionId: option.id, confidence: action.confidence};
      const calibration = calibrationScore(state, episode, decision);
      const outcome = option.outcome;
      return {
        ...state, phase: 'ending', decision, endingId: option.ending,
        score: {outcome, calibration, total: Math.round(outcome * 0.6 + calibration * 0.4)},
      };
    }

    default:
      return state;
  }
}

// Agent behaviour is authored in episode data; this only looks it up.
function respond(state, episode, agent, claimId) {
  const voice = episode.agents[agent];
  if (agent === 'boy' && claimId === null) {
    const find = voice.finds[state.boyFinds];
    if (!find) return {line: voice.exhausted, reveals: [], boyFinds: state.boyFinds};
    return {line: find.line, reveals: find.reveals, boyFinds: state.boyFinds + 1};
  }
  if (agent === 'don' && claimId === null) {
    const hint = voice.hints.find(h => !state.revealed.includes(h.until)) ?? voice.hints.at(-1);
    return {line: hint.line, reveals: [], boyFinds: state.boyFinds};
  }
  const r = voice.responses?.[claimId ?? '_'];
  return r ? {line: r.line, reveals: r.reveals ?? [], boyFinds: state.boyFinds}
           : {line: voice.fallback, reveals: [], boyFinds: state.boyFinds};
}

// Derived values the UI needs. Keep these pure so they are unit-testable.
export const select = {
  canPaste: s => s.phase === 'investigate' && s.pastesLeft > 0,
  untagged: s => s.revealed.filter(id => !s.tags[id]),
  transcriptFor: (s, agent) => s.log.filter(e => e.agent === agent),
};

/** Upgrade path for saves written by older builds. Unknown/newer saves are discarded, not guessed at. */
export function migrate(saved, episode) {
  if (!saved || saved.episodeId !== episode.id) return null;
  if (saved.schema === SCHEMA_VERSION && saved.episodeVersion === episode.version) return saved;
  return null;
}
