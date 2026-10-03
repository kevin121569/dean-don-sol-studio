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

  // TODO(human): combine the inputs above into a 0–100 calibration score.
  return 0;
}
