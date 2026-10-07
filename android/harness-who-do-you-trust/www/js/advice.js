// Shared, pure advice selection for play, content reachability, and save validation.
const has = (list, ids = []) => ids.every(id => list.includes(id));

export function isHybridUnlocked(state, episode) {
  return has(state.inspectedSources, episode.hybridUnlock.inspected);
}

export function isAdvisor(episode, id) {
  return episode.advisorOrder.includes(id) && Object.hasOwn(episode.advice, id) && Array.isArray(episode.advice[id]);
}

/** First matching variant; inherited object properties are never advisers. */
export function selectAdvice(state, episode, advisorId) {
  if (!isAdvisor(episode, advisorId)) return undefined;
  const others = state.consultations.filter(c => c.advisorId !== advisorId).length;
  return episode.advice[advisorId].find(({when = {}}) =>
    has(state.inspectedSources, when.inspected) &&
    (when.hybridUnlocked === undefined || when.hybridUnlocked === isHybridUnlocked(state, episode)) &&
    (when.consultedFewerThan === undefined || others < when.consultedFewerThan));
}
