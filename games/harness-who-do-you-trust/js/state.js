// Serializable, presentation-independent game state (packet §5) and local persistence.
// No DOM access here except the optional storage backend passed in.

export const STATE_VERSION = 1;
export const SCENES = ['briefing', 'investigate', 'decide', 'outcome', 'postmortem'];
export const TRUST_VALUES = [-1, 0, 1]; // discount · neutral · rely

export function createInitialState(episode) {
  return {
    version: STATE_VERSION,
    episodeId: episode.id,
    sceneId: 'briefing',
    discoveredEvidence: episode.evidence.filter(e => !e.hidden).map(e => e.id),
    inspectedSources: [],
    consultations: [],                 // one entry per adviser: {advisorId, adviceId}
    trustWeights: Object.fromEntries(episode.advisorOrder.map(id => [id, 0])),
    playerDecisions: [],               // [{decisionId}]
    uncertaintyAcknowledged: false,
    outcomeId: null,
    completed: false,
  };
}

/**
 * Accept a restored object only if it is structurally valid for this episode.
 * Anything unrecognised returns null — we never guess what an old or corrupted save meant.
 */
export function restoreState(raw, episode) {
  if (!raw || typeof raw !== 'object') return null;
  if (raw.version !== STATE_VERSION || raw.episodeId !== episode.id) return null;
  const evidenceIds = new Set(episode.evidence.map(e => e.id));
  const advisorIds = new Set(episode.advisorOrder);
  const decisionIds = new Set(episode.decisions.map(d => d.id));
  const ok =
    SCENES.includes(raw.sceneId) &&
    Array.isArray(raw.discoveredEvidence) && raw.discoveredEvidence.every(id => evidenceIds.has(id)) &&
    Array.isArray(raw.inspectedSources) && raw.inspectedSources.every(id => raw.discoveredEvidence.includes(id)) &&
    Array.isArray(raw.consultations) && raw.consultations.every(c => advisorIds.has(c?.advisorId) && typeof c.adviceId === 'string') &&
    new Set(raw.consultations.map(c => c.advisorId)).size === raw.consultations.length &&
    raw.trustWeights && [...advisorIds].every(id => TRUST_VALUES.includes(raw.trustWeights[id])) &&
    Array.isArray(raw.playerDecisions) && raw.playerDecisions.every(d => decisionIds.has(d?.decisionId)) &&
    typeof raw.uncertaintyAcknowledged === 'boolean' &&
    (raw.outcomeId === null || decisionIds.has(raw.outcomeId)) &&
    typeof raw.completed === 'boolean';
  return ok ? raw : null;
}

/**
 * Storage adapter. Web uses localStorage; a Capacitor build can pass any object with the same
 * getItem/setItem/removeItem shape (e.g. a synchronous cache in front of @capacitor/preferences).
 * Every call is guarded: private mode or blocked storage must never break play.
 */
export function createStore(episode, backend = globalThis.localStorage) {
  const key = `harness-wdyt:${episode.id}:v${STATE_VERSION}`;
  return {
    key,
    load() {
      try { return restoreState(JSON.parse(backend?.getItem(key) ?? 'null'), episode); }
      catch { return null; }
    },
    save(state) {
      try { backend?.setItem(key, JSON.stringify(state)); return true; }
      catch { return false; }
    },
    clear() {
      try { backend?.removeItem(key); } catch { /* storage unavailable */ }
    },
  };
}
