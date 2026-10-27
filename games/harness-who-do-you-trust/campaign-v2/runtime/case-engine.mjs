const SCENES = Object.freeze(["briefing", "investigate", "trust", "decide", "outcome", "review"]);
const ADVISOR_WEIGHTS = Object.freeze(["low", "medium", "high"]);

const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const copy = (value) => JSON.parse(JSON.stringify(value));

function uniqueKnown(values, allowed) {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.filter((value) => allowed.has(value)))];
}

function trustCount(caseData) {
  if (caseData.trustJudgment.mode === "select_two") return 2;
  if (caseData.trustJudgment.mode === "select_one") return 1;
  return caseData.trustJudgment.options.length;
}

function validateCaseData(caseData) {
  if (!isObject(caseData) || typeof caseData.id !== "string") {
    throw new TypeError("A valid case definition is required.");
  }
  if (!Array.isArray(caseData.evidence) || !Array.isArray(caseData.advisorOrder) || !Array.isArray(caseData.decisions)) {
    throw new TypeError("The case definition is missing evidence, advisers, or decisions.");
  }
  return caseData;
}

function matchesCondition(condition, state) {
  if (!isObject(condition)) return true;
  const inspected = new Set(state.inspectedSources);
  const consulted = new Set(state.consultedAdvisors);
  const trusted = new Set(state.trustedAdvisors);
  return (condition.inspected ?? []).every((id) => inspected.has(id))
    && (condition.consulted ?? []).every((id) => consulted.has(id))
    && (condition.trusted ?? []).every((id) => trusted.has(id));
}

export function createCaseSession(caseInput) {
  const caseData = validateCaseData(caseInput);
  return {
    episodeId: caseData.id,
    completed: false,
    outcomeId: null,
    sceneId: "briefing",
    inspectedSources: [],
    revealedSources: [],
    consultedAdvisors: [],
    trustedAdvisors: [],
    advisorWeights: {},
    decisionId: null,
    selectedEvidenceId: null
  };
}

export function normalizeCaseSession(caseInput, raw) {
  const caseData = validateCaseData(caseInput);
  if (!isObject(raw) || raw.episodeId !== caseData.id) return createCaseSession(caseData);

  const evidenceIds = new Set(caseData.evidence.map((item) => item.id));
  const hiddenIds = new Set(caseData.evidence.filter((item) => item.hidden).map((item) => item.id));
  const initiallyVisible = new Set(caseData.evidence.filter((item) => !item.hidden).map((item) => item.id));
  const advisorIds = new Set(caseData.advisorOrder);
  const decisionIds = new Set(caseData.decisions.map((item) => item.id));
  const revealedSources = uniqueKnown(raw.revealedSources, hiddenIds);
  const inspectable = new Set([...initiallyVisible, ...revealedSources]);
  const inspectedSources = uniqueKnown(raw.inspectedSources, inspectable);
  const consultedAdvisors = uniqueKnown(raw.consultedAdvisors, advisorIds);
  const advisorWeights = {};
  if (caseData.trustJudgment.mode === "weigh_each" && isObject(raw.advisorWeights)) {
    for (const advisorId of caseData.advisorOrder) {
      if (ADVISOR_WEIGHTS.includes(raw.advisorWeights[advisorId])) advisorWeights[advisorId] = raw.advisorWeights[advisorId];
    }
  }
  const trustedAdvisors = caseData.trustJudgment.mode === "weigh_each"
    ? caseData.advisorOrder.filter((advisorId) => advisorWeights[advisorId] === "high")
    : uniqueKnown(raw.trustedAdvisors, advisorIds).slice(0, trustCount(caseData));
  const decisionId = decisionIds.has(raw.decisionId) ? raw.decisionId : null;
  const selectedEvidenceId = evidenceIds.has(raw.selectedEvidenceId) && inspectable.has(raw.selectedEvidenceId)
    ? raw.selectedEvidenceId
    : null;
  let sceneId = SCENES.includes(raw.sceneId) ? raw.sceneId : "briefing";
  if (!decisionId && ["outcome", "review"].includes(sceneId)) sceneId = "decide";
  const completed = Boolean(raw.completed && decisionId);

  return {
    episodeId: caseData.id,
    completed,
    outcomeId: decisionId,
    sceneId,
    inspectedSources,
    revealedSources,
    consultedAdvisors,
    trustedAdvisors,
    advisorWeights,
    decisionId,
    selectedEvidenceId
  };
}

export function visibleEvidence(caseInput, stateInput) {
  const caseData = validateCaseData(caseInput);
  const state = normalizeCaseSession(caseData, stateInput);
  const revealed = new Set(state.revealedSources);
  return caseData.evidence.filter((item) => !item.hidden || revealed.has(item.id));
}

export function inspectEvidence(caseInput, stateInput, evidenceId) {
  const caseData = validateCaseData(caseInput);
  const state = normalizeCaseSession(caseData, stateInput);
  if (!visibleEvidence(caseData, state).some((item) => item.id === evidenceId)) return state;
  if (!state.inspectedSources.includes(evidenceId)) state.inspectedSources.push(evidenceId);
  state.selectedEvidenceId = evidenceId;
  if (state.sceneId === "briefing") state.sceneId = "investigate";
  return state;
}

export function adviceForAdvisor(caseInput, stateInput, advisorId) {
  const caseData = validateCaseData(caseInput);
  const state = normalizeCaseSession(caseData, stateInput);
  if (!caseData.advisorOrder.includes(advisorId)) return null;
  return (caseData.advice?.[advisorId] ?? []).find((variant) => matchesCondition(variant.when, state)) ?? null;
}

export function consultAdvisor(caseInput, stateInput, advisorId) {
  const caseData = validateCaseData(caseInput);
  const state = normalizeCaseSession(caseData, stateInput);
  const advice = adviceForAdvisor(caseData, state, advisorId);
  if (!advice) return {state, advice: null, newlyRevealed: []};
  if (!state.consultedAdvisors.includes(advisorId)) state.consultedAdvisors.push(advisorId);
  const knownEvidence = new Set(caseData.evidence.map((item) => item.id));
  const newlyRevealed = (advice.reveals ?? []).filter((id) => knownEvidence.has(id) && !state.revealedSources.includes(id));
  state.revealedSources.push(...newlyRevealed);
  state.sceneId = "investigate";
  return {state, advice: copy(advice), newlyRevealed};
}

export function trustStatus(caseInput, stateInput) {
  const caseData = validateCaseData(caseInput);
  const state = normalizeCaseSession(caseData, stateInput);
  const required = caseData.trustJudgment.availableAfter;
  const weighing = caseData.trustJudgment.mode === "weigh_each";
  const selected = weighing ? Object.keys(state.advisorWeights).length : state.trustedAdvisors.length;
  const mustSelect = trustCount(caseData);
  const requiredHigh = weighing ? caseData.trustJudgment.requiredHigh ?? 2 : null;
  const highCount = weighing ? state.trustedAdvisors.length : null;
  const evidenceReady = state.inspectedSources.length >= required.minimumEvidence;
  const advisersReady = state.consultedAdvisors.length >= required.minimumAdvisers;
  return {
    available: evidenceReady && advisersReady,
    evidenceReady,
    advisersReady,
    inspected: state.inspectedSources.length,
    consulted: state.consultedAdvisors.length,
    minimumEvidence: required.minimumEvidence,
    minimumAdvisers: required.minimumAdvisers,
    selected,
    mustSelect,
    complete: evidenceReady && advisersReady && selected === mustSelect && (!weighing || highCount === requiredHigh)
  };
}

export function setAdvisorWeight(caseInput, stateInput, advisorId, weight) {
  const caseData = validateCaseData(caseInput);
  const state = normalizeCaseSession(caseData, stateInput);
  const status = trustStatus(caseData, state);
  if (caseData.trustJudgment.mode !== "weigh_each" || !status.available) {
    return {state, changed: false, newlyRevealed: []};
  }
  const option = caseData.trustJudgment.options.find((item) => item.advisorId === advisorId);
  if (!option || !ADVISOR_WEIGHTS.includes(weight)) return {state, changed: false, newlyRevealed: []};
  const currentHigh = Object.values(state.advisorWeights).filter((value) => value === "high").length;
  const wasHigh = state.advisorWeights[advisorId] === "high";
  const requiredHigh = caseData.trustJudgment.requiredHigh ?? 2;
  if (weight === "high" && !wasHigh && currentHigh >= requiredHigh) {
    return {state, changed: false, newlyRevealed: []};
  }
  state.advisorWeights[advisorId] = weight;
  state.trustedAdvisors = caseData.advisorOrder.filter((id) => state.advisorWeights[id] === "high");
  const knownEvidence = new Set(caseData.evidence.map((item) => item.id));
  const newlyRevealed = (option.reveals ?? []).filter((id) => knownEvidence.has(id) && !state.revealedSources.includes(id));
  state.revealedSources.push(...newlyRevealed);
  return {state, changed: true, newlyRevealed};
}

export function toggleTrustedAdvisor(caseInput, stateInput, advisorId) {
  const caseData = validateCaseData(caseInput);
  const state = normalizeCaseSession(caseData, stateInput);
  const status = trustStatus(caseData, state);
  if (!status.available || caseData.trustJudgment.mode === "weigh_each") return {state, changed: false, newlyRevealed: []};
  const option = caseData.trustJudgment.options.find((item) => item.advisorId === advisorId);
  if (!option) return {state, changed: false, newlyRevealed: []};

  if (state.trustedAdvisors.includes(advisorId)) {
    state.trustedAdvisors = state.trustedAdvisors.filter((id) => id !== advisorId);
    return {state, changed: true, newlyRevealed: []};
  }
  if (state.trustedAdvisors.length >= status.mustSelect) return {state, changed: false, newlyRevealed: []};
  state.trustedAdvisors.push(advisorId);
  const knownEvidence = new Set(caseData.evidence.map((item) => item.id));
  const newlyRevealed = (option.reveals ?? []).filter((id) => knownEvidence.has(id) && !state.revealedSources.includes(id));
  state.revealedSources.push(...newlyRevealed);
  return {state, changed: true, newlyRevealed};
}

export function beginTrust(caseInput, stateInput) {
  const caseData = validateCaseData(caseInput);
  const state = normalizeCaseSession(caseData, stateInput);
  if (trustStatus(caseData, state).available) state.sceneId = "trust";
  return state;
}

export function commitTrust(caseInput, stateInput) {
  const caseData = validateCaseData(caseInput);
  const state = normalizeCaseSession(caseData, stateInput);
  if (trustStatus(caseData, state).complete) state.sceneId = "decide";
  return state;
}

export function decisionStatus(caseInput, stateInput, decisionId) {
  const caseData = validateCaseData(caseInput);
  const state = normalizeCaseSession(caseData, stateInput);
  const decision = caseData.decisions.find((item) => item.id === decisionId);
  if (!decision) return {available: false, missingEvidence: [], missingAdvisors: []};
  const inspected = new Set(state.inspectedSources);
  const trusted = new Set(state.trustedAdvisors);
  const missingEvidence = (decision.requires?.evidence ?? []).filter((id) => !inspected.has(id));
  const missingAdvisors = (decision.requires?.trustedAdvisors ?? []).filter((id) => !trusted.has(id));
  return {
    available: trustStatus(caseData, state).complete && missingEvidence.length === 0 && missingAdvisors.length === 0,
    missingEvidence,
    missingAdvisors
  };
}

export function chooseDecision(caseInput, stateInput, decisionId) {
  const caseData = validateCaseData(caseInput);
  const state = normalizeCaseSession(caseData, stateInput);
  if (!decisionStatus(caseData, state, decisionId).available) return state;
  state.decisionId = decisionId;
  state.outcomeId = decisionId;
  state.completed = false;
  state.sceneId = "outcome";
  return state;
}

export function openReview(caseInput, stateInput) {
  const caseData = validateCaseData(caseInput);
  const state = normalizeCaseSession(caseData, stateInput);
  if (state.decisionId) state.sceneId = "review";
  return state;
}

export function completeCaseSession(caseInput, stateInput) {
  const caseData = validateCaseData(caseInput);
  const state = normalizeCaseSession(caseData, stateInput);
  if (!state.decisionId || state.sceneId !== "review") return state;
  state.completed = true;
  state.outcomeId = state.decisionId;
  return state;
}

export function isBestOutcome(caseInput, stateInput) {
  const caseData = validateCaseData(caseInput);
  const state = normalizeCaseSession(caseData, stateInput);
  if (typeof caseData.bestDecisionId === "string") return state.decisionId === caseData.bestDecisionId;
  const grades = caseData.postmortem?.[state.decisionId]?.advisors;
  return Boolean(grades && caseData.advisorOrder.every((id) => grades[id]?.rating === "strong"));
}

export function previousScene(caseInput, stateInput) {
  const caseData = validateCaseData(caseInput);
  const state = normalizeCaseSession(caseData, stateInput);
  const fallback = {
    briefing: "briefing",
    investigate: "briefing",
    trust: "investigate",
    decide: "trust",
    outcome: "decide",
    review: "outcome"
  };
  state.sceneId = fallback[state.sceneId];
  if (state.sceneId === "decide" && !trustStatus(caseData, state).complete) state.sceneId = "investigate";
  return state;
}

export {SCENES};
