// Serializable, presentation-independent game state (packet §5) and local persistence.
// No DOM access here except the optional storage backend passed in.
import {isAdvisor, selectAdvice} from './advice.js';

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
  const advice = new Map();
  for (const c of raw.consultations) {
    const a = isAdvisor(episode, c.advisorId) ? episode.advice[c.advisorId].find(v => v.id === c.adviceId) : undefined;
    if (!a) fail(`advice ${c.adviceId} does not belong to adviser ${c.advisorId}`);
    else advice.set(c.advisorId, a);
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
  // Discovery ORDER must be engine-reachable (Issue #4 gap 4), and — Issue #7 — reachable by ONE history that
  // also explains the inspection order, the first-consultation order and every saved advice line at once.
  const visible = episode.evidence.filter(e => !e.hidden).map(e => e.id);
  if (!visible.every((id, i) => raw.discoveredEvidence[i] === id)) {
    fail('discoveredEvidence order: must begin with the visible evidence in episode order');
  } else if (!feasibleHistory(raw, episode).feasible) {
    fail('no feasible engine history: no sequence of opens and consults under first-match advice rules produces this discoveredEvidence order, inspection order and advice');
  }
  for (const [id, a] of advice) {
    // Inspected only grows, so an advice line's evidence condition must still hold.
    if (!(a.when?.inspected ?? []).every(e => inspected.has(e))) fail(`advice ${a.id} requires evidence not inspected`);
    if (a.when?.hybridUnlocked === true && !episode.hybridUnlock.inspected.every(e => inspected.has(e))) fail(`advice ${a.id} requires the hybrid unlock`);
    if (!(a.reveals ?? []).every(e => raw.discoveredEvidence.includes(e))) fail(`advice ${a.id} is missing mandatory revealed evidence`);
    // A saved line may be stale. It must have been the FIRST matching variant
    // at some inspection prefix and possible consultation count in its history.
    const firstConsult = raw.consultations.findIndex(c => c.advisorId === id);
    const others = raw.consultations.filter(c => c.advisorId !== id);
    let selectable = false;
    for (let opened = 0; opened <= raw.inspectedSources.length && !selectable; opened++) {
      for (let count = firstConsult; count <= others.length; count++) {
        const past = {inspectedSources: raw.inspectedSources.slice(0, opened), consultations: others.slice(0, count)};
        if (selectAdvice(past, episode, id)?.id === a.id) { selectable = true; break; }
      }
    }
    if (!selectable) fail(`advice ${a.id} was never selectable in this consultation history`);
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
 * Feasible-history search (Issue #7). Is there ANY interleaving of OPEN_EVIDENCE and CONSULT actions that,
 * replayed with engine.js's exact rules, turns createInitialState() into this save's discoveredEvidence,
 * inspectedSources and consultations? The save fixes almost everything about such a history:
 *   - opens happen in exactly the saved inspectedSources order (the engine only appends), and each item
 *     must already be discovered when opened;
 *   - an adviser's FIRST consult happens in saved consultations order (the engine appends new advisers);
 *     re-consulting an already-consulted adviser may happen any number of times, in any interleaving;
 *   - every consult picks selectAdvice()'s first matching variant for the state at THAT moment — its
 *     when.inspected / when.hybridUnlocked / when.consultedFewerThan are evaluated then, not at save time;
 *   - discovery appends [...new Set([...discovered, ...reveals])] and never shrinks, so every intermediate
 *     list is a prefix of the saved one;
 *   - the history must end with each adviser's LATEST advice equal to the saved line (stale lines included).
 * Exact state abstraction: selectAdvice(adviser) reads only the inspected prefix (when.inspected,
 * when.hybridUnlocked) and HOW MANY other advisers are consulted (when.consultedFewerThan) — never which
 * advice they hold. So an adviser's current advice matters only as "does it equal the saved line yet?",
 * and the search state is (opened count i, discovered length d, consulted count k, match mask m), where bit
 * j of m says adviser j's current advice already equals the saved one.
 * Bound: (I+1)·(H+1)·Σ_{k=0..C} 2^k states (I inspected, H hidden, C consulted), each with ≤ C+1 successors,
 * and ≤ C·(I+1)·(C+1) distinct selectAdvice() calls — independent of how many advice variants exist.
 * For the packet maximum (5 evidence, ≥1 visible, 4 advisers): ≤ 6·5·31 = 930 states, ≤ 120 selections.
 * Exported for tests and diagnostics; restoreState() uses it through explainRestore().
 */
export function feasibleHistory(raw, episode) {
  const target = raw.discoveredEvidence, opened = raw.inspectedSources;
  const order = raw.consultations.map(c => c.advisorId);
  const latest = raw.consultations.map(c => c.adviceId);
  const C = order.length, goalMask = (1 << C) - 1;
  const position = new Map(target.map((id, x) => [id, x]));
  // selectAdvice() depends only on (adviser j, opened i, consulted k): memoize it per triple.
  const picked = new Map();
  const select = (j, i, k) => {
    const key = `${j}|${i}|${k}`;
    if (!picked.has(key)) {
      const view = {inspectedSources: opened.slice(0, i), consultations: order.slice(0, k).map(advisorId => ({advisorId}))};
      picked.set(key, selectAdvice(view, episode, order[j]) ?? null);
    }
    return picked.get(key);
  };
  const start = {i: 0, d: episode.evidence.filter(e => !e.hidden).length, k: 0, m: 0};
  const keyOf = s => `${s.i},${s.d},${s.k},${s.m}`;
  const seen = new Set([keyOf(start)]);
  const queue = [start];
  for (let at = 0; at < queue.length; at++) {
    const s = queue[at];
    if (s.i === opened.length && s.d === target.length && s.k === C && s.m === goalMask) {
      return {feasible: true, explored: at + 1, selections: picked.size};
    }
    const push = n => { const key = keyOf(n); if (!seen.has(key)) { seen.add(key); queue.push(n); } };
    // Open the next saved item, if it has been discovered by now.
    if (s.i < opened.length && (position.get(opened[s.i]) ?? Infinity) < s.d) push({...s, i: s.i + 1});
    // Consult: any adviser already consulted (re-consult), or the next one in first-consultation order.
    for (let j = 0; j <= s.k && j < C; j++) {
      const advice = select(j, s.i, s.k);
      if (!advice) continue;
      // Exactly engine.js: [...new Set([...discovered, ...reveals])]. Discovery only appends, so every
      // intermediate list must be a prefix of the saved one.
      let d = s.d, ok = true;
      for (const id of new Set(advice.reveals ?? [])) {
        const x = position.get(id);
        if (x !== undefined && x < d) continue;           // already discovered: deduped
        if (x !== d) { ok = false; break; }                // would not extend the saved prefix in order
        d++;
      }
      if (!ok) continue;
      const bit = 1 << j;
      const m = advice.id === latest[j] ? s.m | bit : s.m & ~bit;
      push({i: s.i, d, k: Math.max(s.k, j + 1), m});
    }
  }
  return {feasible: false, explored: queue.length, selections: picked.size};
}

/**
 * Storage adapter. Web uses localStorage; a Capacitor build can pass any object with the same
 * getItem/setItem/removeItem shape (e.g. a synchronous cache in front of @capacitor/preferences).
 * Every call is guarded: private mode or blocked storage must never break play.
 */
export function createStore(episode, backend) {
  if (backend === undefined) {
    try { backend = globalThis.localStorage; }
    catch { backend = null; } // Accessing the property itself can throw SecurityError.
  }
  const key = `harness-wdyt:${episode.id}:v${STATE_VERSION}`;
  return {
    key,
    load() {
      try { return restoreState(JSON.parse(backend?.getItem(key) ?? 'null'), episode); }
      catch { return null; }
    },
    save(state) {
      try { if (!backend) return false; backend.setItem(key, JSON.stringify(state)); return true; }
      catch { return false; }
    },
    clear() {
      try { backend?.removeItem(key); } catch { /* storage unavailable */ }
    },
  };
}
