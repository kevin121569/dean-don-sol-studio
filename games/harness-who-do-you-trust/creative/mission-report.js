// The Harness — post-play recognition derived from already-committed game state.
// Presentation ONLY. No score, save fields, decisions, trust changes, or reducer calls.
// Badges are earned by observable investigation actions, not by an arbitrary claim
// that a specific moral/operational decision was uniquely "right".
export function buildMissionReport(state, episode) {
  if (!state?.completed || !state.outcomeId) return null;
  const decision = episode.decisions.find(d => d.id === state.outcomeId);
  if (!decision) return null;

  const evidenceIds = new Set(episode.evidence.map(e => e.id));
  const adviserIds = new Set(episode.advisorOrder);
  const inspected = new Set((state.inspectedSources ?? []).filter(id => evidenceIds.has(id)));
  const consulted = new Set((state.consultations ?? []).map(c => c.advisorId).filter(id => adviserIds.has(id)));
  const evidenceTotal = evidenceIds.size;
  const advisersTotal = adviserIds.size;

  // This is earned ONLY when the actual hidden decision is unlocked and used.
  // State restoration already verifies those prerequisites against game rules.
  const hiddenChoiceUsed = Boolean(decision.requiresHybrid && episode.hybridUnlock?.inspected?.every(id => inspected.has(id)));
  const honours = [];
  if (evidenceTotal > 0 && inspected.size === evidenceTotal) {
    honours.push({id: 'evidence', title: 'Evidence Detective', detail: 'You examined every record before your decision.'});
  }
  if (advisersTotal > 0 && consulted.size === advisersTotal) {
    honours.push({id: 'perspectives', title: 'Four Perspectives', detail: 'You heard every adviser instead of following one voice.'});
  }
  if (hiddenChoiceUsed) {
    honours.push({id: 'strategy', title: 'Hidden Strategy', detail: 'You discovered and chose an additional evidence-based option.'});
  }

  return {
    label: 'MISSION COMPLETE',
    heading: 'Your decision. Your consequences.',
    mission: 'You finished the case. The challenge was to investigate the clues, weigh competing advice, and make a defensible decision.',
    evidence: {done: inspected.size, total: evidenceTotal},
    advisers: {done: consulted.size, total: advisersTotal},
    decision: {label: decision.label, risk: decision.risk},
    honours,
    note: 'Completing a case is not the same as being right. Even a lucky outcome can come from a risky decision. Review what you knew and what you may have missed.',
    replay: 'Try another approach to see what changes.',
  };
}
