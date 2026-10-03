// Calibration: did the player's confidence match what their evidence could actually support?
// This is the "Book of Better Questions" lesson as a number: "I don't know yet" can be the right answer.

const CONFIDENCE_WEIGHT = {low: 1, medium: 2, high: 3};

/**
 * @param {import('./state.js').GameState} state   tags = the player's label per revealed claim
 * @param {object} episode                         episode.claims[id].tier = the correct label
 * @param {{optionId:string, confidence:'low'|'medium'|'high'}} decision
 * @returns {number} 0–100
 */
export function calibrationScore(state, episode, decision) {
  const revealed = state.revealed;
  const tagged = revealed.filter(id => state.tags[id]);
  const correctTags = tagged.filter(id => state.tags[id] === episode.claims[id].tier).length;
  const sawCount = revealed.filter(id => episode.claims[id].tier === 'saw').length;
  const confidence = CONFIDENCE_WEIGHT[decision.confidence];

  const tagAccuracy = tagged.length ? correctTags / tagged.length : 0;
  const tagCredit = Math.min(tagged.length, 4) / 4;
  const thinkAsSaw = tagged.filter(id =>
    episode.claims[id].tier === 'think' && state.tags[id] === 'saw'
  ).length;
  const supportedConfidence = sawCount >= 5 ? 3 : sawCount >= 3 ? 2 : 1;
  const overconfidence = Math.max(0, confidence - supportedConfidence);
  const tagScore = 70 * tagAccuracy * tagCredit;
  const confidenceScore = 30 - 15 * overconfidence;
  return Math.max(0, Math.min(100,
    Math.round(tagScore + confidenceScore - 20 * thinkAsSaw)
  ));
}
