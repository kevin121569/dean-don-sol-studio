// Pure game rules. (state, action, episode) → state. No DOM, storage, time, or randomness,
// so the same core runs in the browser, in a Capacitor WebView, and under `node --test`.
import {TRUST_VALUES, createInitialState} from './state.js';

export const ACTIONS = Object.freeze({
  START: 'start',
  OPEN_EVIDENCE: 'openEvidence',        // {evidenceId}
  CONSULT: 'consult',                   // {advisorId}
  CONSULT_ALL: 'consultAll',
  SET_TRUST: 'setTrust',                // {advisorId, value: -1|0|1}
  ACKNOWLEDGE_UNCERTAINTY: 'acknowledgeUncertainty', // {value: boolean}
  GO_TO_DECISION: 'goToDecision',
  BACK_TO_INVESTIGATION: 'backToInvestigation',
  SUBMIT_DECISION: 'submitDecision',    // {decisionId}
  VIEW_POSTMORTEM: 'viewPostmortem',
  RESET: 'reset',
});

const has = (list, ids = []) => ids.every(id => list.includes(id));

export function isHybridUnlocked(state, episode) {
  return has(state.inspectedSources, episode.hybridUnlock.inspected);
}

export function isDecisionAvailable(state, episode, decisionId) {
  const d = episode.decisions.find(x => x.id === decisionId);
  return Boolean(d) && (!d.requiresHybrid || isHybridUnlocked(state, episode));
}

/** First advice variant whose conditions hold. Variants are ordered most-specific first in content. */
export function selectAdvice(state, episode, advisorId) {
  const others = state.consultations.filter(c => c.advisorId !== advisorId).length;
  return episode.advice[advisorId].find(({when = {}}) =>
    has(state.inspectedSources, when.inspected) &&
    (when.hybridUnlocked === undefined || when.hybridUnlocked === isHybridUnlocked(state, episode)) &&
    (when.consultedFewerThan === undefined || others < when.consultedFewerThan));
}

const investigating = state => state.sceneId === 'investigate' && !state.completed;

function consult(state, episode, advisorId) {
  if (!investigating(state) || !episode.advice[advisorId]) return state;
  const advice = selectAdvice(state, episode, advisorId);
  const discovered = [...state.discoveredEvidence, ...(advice.reveals ?? []).filter(id => !state.discoveredEvidence.includes(id))];
  const prior = state.consultations.find(c => c.advisorId === advisorId);
  if (prior?.adviceId === advice.id && discovered.length === state.discoveredEvidence.length) return state;
  // One entry per adviser, holding their latest advice, kept in first-consulted order.
  const consultations = prior
    ? state.consultations.map(c => c.advisorId === advisorId ? {advisorId, adviceId: advice.id} : c)
    : [...state.consultations, {advisorId, adviceId: advice.id}];
  return {...state, consultations, discoveredEvidence: discovered};
}

export function reduce(state, action, episode) {
  switch (action.type) {
    case ACTIONS.START:
      return state.sceneId === 'briefing' ? {...state, sceneId: 'investigate'} : state;

    case ACTIONS.OPEN_EVIDENCE: {
      const id = action.evidenceId;
      if (!investigating(state) || !state.discoveredEvidence.includes(id) || state.inspectedSources.includes(id)) return state;
      return {...state, inspectedSources: [...state.inspectedSources, id]};
    }

    case ACTIONS.CONSULT:
      return consult(state, episode, action.advisorId);

    case ACTIONS.CONSULT_ALL:
      // Advisers answer in canonical order, each seeing what the previous one surfaced.
      return episode.advisorOrder.reduce((s, id) => consult(s, episode, id), state);

    case ACTIONS.SET_TRUST: {
      const {advisorId, value} = action;
      if (state.completed || !(advisorId in state.trustWeights) || !TRUST_VALUES.includes(value)) return state;
      if (!state.consultations.some(c => c.advisorId === advisorId)) return state; // judge only what you've heard
      if (state.trustWeights[advisorId] === value) return state;
      return {...state, trustWeights: {...state.trustWeights, [advisorId]: value}};
    }

    case ACTIONS.ACKNOWLEDGE_UNCERTAINTY:
      // Only offered on the decide screen; restoreState() relies on briefing never carrying it.
      if (state.sceneId !== 'decide' || typeof action.value !== 'boolean' || state.uncertaintyAcknowledged === action.value) return state;
      return {...state, uncertaintyAcknowledged: action.value};

    case ACTIONS.GO_TO_DECISION:
      return investigating(state) ? {...state, sceneId: 'decide'} : state;

    case ACTIONS.BACK_TO_INVESTIGATION:
      return state.sceneId === 'decide' ? {...state, sceneId: 'investigate'} : state;

    case ACTIONS.SUBMIT_DECISION: {
      if (state.sceneId !== 'decide' || !isDecisionAvailable(state, episode, action.decisionId)) return state;
      return {
        ...state,
        sceneId: 'outcome',
        playerDecisions: [...state.playerDecisions, {decisionId: action.decisionId}],
        outcomeId: action.decisionId,
        completed: true,
      };
    }

    case ACTIONS.VIEW_POSTMORTEM:
      return state.sceneId === 'outcome' ? {...state, sceneId: 'postmortem'} : state;

    case ACTIONS.RESET:
      return createInitialState(episode);

    default:
      return state;
  }
}

/** Everything the postmortem screen shows, derived from state + content (packet §6 step 6). */
export function buildPostmortem(state, episode) {
  if (!state.completed) return null;
  const pm = episode.postmortem[state.outcomeId];
  const byId = Object.fromEntries(episode.evidence.map(e => [e.id, e]));
  const notInspected = episode.evidence.filter(e => !state.inspectedSources.includes(e.id));
  return {
    decision: episode.decisions.find(d => d.id === state.outcomeId),
    known: state.inspectedSources.map(id => byId[id].summary),
    unknown: [
      ...pm.unknown,
      ...notInspected.map(e => state.discoveredEvidence.includes(e.id)
        ? `You never opened "${e.title}".`
        : 'There was evidence you never surfaced.'),
    ].filter((line, i, all) => all.indexOf(line) === i),
    uncertaintyAcknowledged: state.uncertaintyAcknowledged,
    advisors: episode.advisorOrder.map(id => ({
      id, name: episode.advisors[id].name,
      consulted: state.consultations.some(c => c.advisorId === id),
      trust: state.trustWeights[id],
      ...pm.advisors[id],
    })),
    alternatives: episode.decisions
      .filter(d => d.id !== state.outcomeId)
      .map(d => ({label: d.label, risk: d.risk, wasAvailable: isDecisionAvailable(state, episode, d.id)})),
  };
}
