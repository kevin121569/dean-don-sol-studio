/** A deliberate replay clears only this case's save, never finished-case/unlock history. */
export const legacyReplaySaveKeys = Object.freeze({
  "episode-001": "harness-campaign:episode-001:illustrated-master-control:v1",
  "episode-002": "harness-v34:episode-002:illustrated-master-control:v12-motorola-audio-scroll-fix"
});

export function restartCompletedCase(store, caseId, backend) {
  if (!store || store.caseStatus(caseId) !== "completed") return false;
  const legacyKey = legacyReplaySaveKeys[caseId];
  // Never touch other episodes, the unlocked-cases record, or old protected builds.
  if (legacyKey) {
    try {
      if (!backend || typeof backend.removeItem !== "function") return false;
      backend.removeItem(legacyKey);
    } catch {
      return false;
    }
  }
  return store.resetCase(caseId);
}
