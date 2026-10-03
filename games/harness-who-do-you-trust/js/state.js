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

const STATE_KEYS = Object.freeze(['version', 'episodeId', 'sceneId', 'discoveredEvidence', 'inspectedSources', 'consultations',
  'trustWeights', 'playerDecisions', 'uncertaintyAcknowledged', 'outcomeId', 'completed']);
const isObj = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const uniqueStrings = v => Array.isArray(v) && v.every(x => typeof x === 'string') && new Set(v).size === v.length;
const exactKeys = (o, keys) => isObj(o) && Object.keys(o).length === keys.length && keys.every(k => Object.hasOwn(o, k));

/**
 * Accept a restored object only if it is a state that real play could have produced for this episode.
 * Checks shape, then every reference, then cross-field invariants. Anything else returns null and the
 * game starts fresh — a corrupted or tampered save is never rendered.
 * Returns a fresh copy, so later mutation of the stored object cannot leak into game state.
 */
export function restoreState(raw, episode) {
  return explainRestore(raw, episode).length ? null : structuredClone(raw);
}

/** Same checks as restoreState(), returning the reasons. Used by tests and for debugging saves. */
export function explainRestore(raw, episode) {
  const why = [];
  const fail = msg => { why.push(msg); return why; };

  // 1. Shape — exactly the packet §5 keys, nothing extra.
  if (!exactKeys(raw, STATE_KEYS)) return fail('not an object with exactly the state keys');
  if (raw.version !== STATE_VERSION) return fail(`version ${raw.version} ≠ ${STATE_VERSION}`);
  if (raw.episodeId !== episode.id) return fail(`episodeId ${raw.episodeId} ≠ ${episode.id}`);
  if (!SCENES.includes(raw.sceneId)) return fail(`unknown sceneId ${raw.sceneId}`);
  if (!uniqueStrings(raw.discoveredEvidence)) return fail('discoveredEvidence must be unique strings');
  if (!uniqueStrings(raw.inspectedSources)) return fail('inspectedSources must be unique strings');
  if (!Array.isArray(raw.consultations) || !raw.consultations.every(c => exactKeys(c, ['advisorId', 'adviceId']))) return fail('consultations malformed');
  if (!exactKeys(raw.trustWeights, episode.advisorOrder)) return fail('trustWeights must have exactly the episode advisers');
  if (!Array.isArray(raw.playerDecisions) || !raw.playerDecisions.every(d => exactKeys(d, ['decisionId']))) return fail('playerDecisions malformed');
  if (typeof raw.uncertaintyAcknowledged !== 'boolean' || typeof raw.completed !== 'boolean') return fail('flags must be booleans');
  if (raw.outcomeId !== null && typeof raw.outcomeId !== 'string') return fail('outcomeId must be null or a string');

  // 2. References — every id must exist in this episode.
  const evidenceById = new Map(episode.evidence.map(e => [e.id, e]));
  const decisionById = new Map(episode.decisions.map(d => [d.id, d]));
  for (const id of raw.discoveredEvidence) if (!evidenceById.has(id)) fail(`unknown evidence ${id}`);
  for (const id of raw.inspectedSources) if (!raw.discoveredEvidence.includes(id)) fail(`inspected ${id} was never discovered`);
  const advice = {};
  for (const c of raw.consultations) {
    const a = episode.advice[c.advisorId]?.find(v => v.id === c.adviceId);
    if (!a) fail(`advice ${c.adviceId} does not belong to adviser ${c.advisorId}`);
    else advice[c.advisorId] = a;
  }
  if (new Set(raw.consultations.map(c => c.advisorId)).size !== raw.consultations.length) fail('duplicate adviser in consultations');
  for (const id of episode.advisorOrder) if (!TRUST_VALUES.includes(raw.trustWeights[id])) fail(`trust for ${id} must be -1, 0 or 1`);
  for (const d of raw.playerDecisions) if (!decisionById.has(d.decisionId)) fail(`unknown decision ${d.decisionId}`);
  if (raw.outcomeId !== null && !decisionById.has(raw.outcomeId)) fail(`unknown outcome ${raw.outcomeId}`);
  if (why.length) return why;

  // 3. Invariants — combinations the engine can never produce.
  const consulted = new Set(raw.consultations.map(c => c.advisorId));
  const inspected = new Set(raw.inspectedSources);
  for (const e of episode.evidence) {
    if (!e.hidden && !raw.discoveredEvidence.includes(e.id)) fail(`visible evidence ${e.id} missing from discoveredEvidence`);
    // Hidden evidence only appears once an adviser who can reveal it has been consulted.
    if (e.hidden && raw.discoveredEvidence.includes(e.id) &&
        ![...consulted].some(a => episode.advice[a].some(v => v.reveals?.includes(e.id)))) fail(`hidden ${e.id} discovered without a revealing consultation`);
  }
  for (const a of Object.values(advice)) {
    // Inspected only grows, so an advice line's evidence condition must still hold.
    if (!(a.when?.inspected ?? []).every(e => inspected.has(e))) fail(`advice ${a.id} requires evidence not inspected`);
    if (a.when?.hybridUnlocked === true && !episode.hybridUnlock.inspected.every(e => inspected.has(e))) fail(`advice ${a.id} requires the hybrid unlock`);
  }
  for (const id of episode.advisorOrder) if (raw.trustWeights[id] !== 0 && !consulted.has(id)) fail(`trust set for unconsulted adviser ${id}`);

  const done = raw.sceneId === 'outcome' || raw.sceneId === 'postmortem';
  if (raw.completed !== done) fail(`completed=${raw.completed} contradicts scene ${raw.sceneId}`);
  if (done) {
    if (raw.outcomeId === null) fail('completed without an outcome');
    if (raw.playerDecisions.length !== 1 || raw.playerDecisions[0].decisionId !== raw.outcomeId) fail('playerDecisions must hold exactly the outcome decision');
    if (decisionById.get(raw.outcomeId)?.requiresHybrid && !episode.hybridUnlock.inspected.every(e => inspected.has(e))) fail('hybrid outcome without the hybrid unlock');
  } else {
    if (raw.outcomeId !== null || raw.playerDecisions.length) fail('decision recorded before completion');
  }
  if (raw.sceneId === 'briefing' && (inspected.size || consulted.size || raw.uncertaintyAcknowledged)) fail('progress recorded while still in briefing');
  return why;
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
