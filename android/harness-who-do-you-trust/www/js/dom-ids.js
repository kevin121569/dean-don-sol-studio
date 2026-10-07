// Single source of truth for every DOM id the game generates from content ids.
// app.js renders with these functions; content.js validates with the same functions, so an episode
// whose ids would collide in the DOM is rejected before anything renders (Issue #4 gap 2).

/** Each namespace: who owns the id, and the fixed text around it. make(id) === prefix + id + suffix. */
const ns = (name, owner, prefix, suffix = '') => Object.freeze({name, owner, prefix, suffix, make: id => `${prefix}${id}${suffix}`});

export const ID_NAMESPACES = Object.freeze([
  ns('evidenceToggle', 'evidence', 'ev-'),
  ns('evidenceBody', 'evidence', 'ev-body-'),
  ns('evidenceTitle', 'evidence', 'ev-t-'),
  ns('evidenceSource', 'evidence', 'ev-src-'),
  ns('evidenceState', 'evidence', 'ev-s-'),
  ns('adviserName', 'adviser', 'adv-', '-name'),
  ns('consult', 'adviser', 'consult-'),
  ns('decision', 'decision', 'dec-'),
  ns('decisionLock', 'decision', 'lock-'),
]);
const byName = Object.fromEntries(ID_NAMESPACES.map(n => [n.name, n.make]));
export const TRUST_VALUES_FOR_IDS = Object.freeze([-1, 0, 1]);

export const domId = Object.freeze({
  ...byName,
  trust: (advisorId, value) => `trust-${advisorId}-${value}`,
});

/** Every literal id in index.html and app.js templates. A test fails if this list falls behind either file. */
export const STATIC_IDS = Object.freeze([
  // index.html
  'main', 'scene', 'live', 'motionToggle', 'helpDialog', 'helpTitle', 'resetDialog', 'resetTitle',
  // app.js
  'scene-title', 'roles-title', 'btn-start', 'progress', 'evidence-title', 'advisors-title', 'btn-consult-all', 'btn-decide',
  'choices-title', 'ack', 'btn-submit', 'btn-back', 'submit-hint', 'btn-postmortem',
  'pm-known', 'pm-unknown', 'pm-advisors', 'pm-alts', 'btn-again',
]);

/** Every id the renderer can emit for this episode's content (not including STATIC_IDS). */
export function generatedIds(episode) {
  const evidence = (episode.evidence ?? []).map(e => e.id);
  const advisers = episode.advisorOrder ?? [];
  const decisions = (episode.decisions ?? []).map(d => d.id);
  const owned = {evidence, adviser: advisers, decision: decisions};
  return [
    ...ID_NAMESPACES.flatMap(n => owned[n.owner].map(n.make)),
    ...advisers.flatMap(a => TRUST_VALUES_FOR_IDS.map(v => domId.trust(a, v))),
  ];
}

export const allDomIds = episode => [...STATIC_IDS, ...generatedIds(episode)];

/** Ids that would appear more than once in the document. Empty means collision-free. */
export function duplicateDomIds(episode) {
  const seen = new Set(), dup = new Set();
  for (const id of allDomIds(episode)) (seen.has(id) ? dup : seen).add(id);
  return [...dup];
}
