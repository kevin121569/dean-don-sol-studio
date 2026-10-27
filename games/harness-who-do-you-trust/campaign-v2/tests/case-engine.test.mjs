import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
  adviceForAdvisor,
  beginTrust,
  chooseDecision,
  commitTrust,
  completeCaseSession,
  consultAdvisor,
  createCaseSession,
  decisionStatus,
  inspectEvidence,
  isBestOutcome,
  normalizeCaseSession,
  openReview,
  toggleTrustedAdvisor,
  trustStatus,
  visibleEvidence
} from "../runtime/case-engine.mjs";

const coldMirror = JSON.parse(readFileSync(new URL("../data/episode-003.json", import.meta.url)));

function inspectMany(state, ids) {
  return ids.reduce((current, id) => inspectEvidence(coldMirror, current, id), state);
}

function investigationReady() {
  let state = createCaseSession(coldMirror);
  state = inspectMany(state, ["e_particle_alert", "e_hvac_trace", "e_alarm_panel", "e_witness_note"]);
  for (const advisorId of ["boy", "tooth", "darth"]) {
    state = consultAdvisor(coldMirror, state, advisorId).state;
  }
  return state;
}

test("a new Case 3 session starts with four visible records and no borrowed state", () => {
  const state = createCaseSession(coldMirror);
  assert.equal(state.episodeId, "episode-003");
  assert.equal(state.sceneId, "briefing");
  assert.deepEqual(visibleEvidence(coldMirror, state).map((item) => item.id), [
    "e_particle_alert",
    "e_hvac_trace",
    "e_alarm_panel",
    "e_witness_note"
  ]);
  assert.deepEqual(state.inspectedSources, []);
});

test("the service bulletin and independent meter are reachable through the adviser chain", () => {
  let state = createCaseSession(coldMirror);
  assert.equal(adviceForAdvisor(coldMirror, state, "boy").id, "boy_fast_match");
  state = inspectMany(state, ["e_particle_alert", "e_hvac_trace"]);
  const boy = consultAdvisor(coldMirror, state, "boy");
  assert.equal(boy.advice.id, "boy_bulletin");
  assert.deepEqual(boy.newlyRevealed, ["e_service_bulletin"]);
  state = inspectEvidence(coldMirror, boy.state, "e_service_bulletin");
  const tooth = consultAdvisor(coldMirror, state, "tooth");
  assert.equal(tooth.advice.id, "tooth_independent_check");
  assert.deepEqual(tooth.newlyRevealed, ["e_handheld_check"]);
  assert.equal(visibleEvidence(coldMirror, tooth.state).length, 6);
});

test("trust stays locked until four records and three advisers have been used", () => {
  let state = createCaseSession(coldMirror);
  state = inspectMany(state, ["e_particle_alert", "e_hvac_trace", "e_alarm_panel", "e_witness_note"]);
  state = consultAdvisor(coldMirror, state, "boy").state;
  state = consultAdvisor(coldMirror, state, "tooth").state;
  assert.deepEqual(trustStatus(coldMirror, state), {
    available: false,
    evidenceReady: true,
    advisersReady: false,
    inspected: 4,
    consulted: 2,
    minimumEvidence: 4,
    minimumAdvisers: 3,
    selected: 0,
    mustSelect: 2,
    complete: false
  });
  state = consultAdvisor(coldMirror, state, "darth").state;
  assert.equal(trustStatus(coldMirror, state).available, true);
  assert.equal(beginTrust(coldMirror, state).sceneId, "trust");
});

test("Case 3 requires exactly two trusted advisers and will not silently replace one", () => {
  let state = beginTrust(coldMirror, investigationReady());
  state = toggleTrustedAdvisor(coldMirror, state, "tooth").state;
  state = toggleTrustedAdvisor(coldMirror, state, "donsol").state;
  const blockedThird = toggleTrustedAdvisor(coldMirror, state, "boy");
  assert.equal(blockedThird.changed, false);
  assert.deepEqual(blockedThird.state.trustedAdvisors, ["tooth", "donsol"]);
  assert.equal(trustStatus(coldMirror, state).complete, true);
  assert.equal(commitTrust(coldMirror, state).sceneId, "decide");
});

test("the strongest decision requires both hidden records and the configured trust pair", () => {
  let state = investigationReady();
  state = beginTrust(coldMirror, state);
  state = toggleTrustedAdvisor(coldMirror, state, "tooth").state;
  state = toggleTrustedAdvisor(coldMirror, state, "donsol").state;
  state = commitTrust(coldMirror, state);
  assert.deepEqual(decisionStatus(coldMirror, state, "d_relocate_verify").missingEvidence, [
    "e_service_bulletin",
    "e_handheld_check"
  ]);

  state = inspectEvidence(coldMirror, state, "e_service_bulletin");
  state = consultAdvisor(coldMirror, state, "tooth").state;
  state = inspectEvidence(coldMirror, state, "e_handheld_check");
  assert.equal(decisionStatus(coldMirror, state, "d_relocate_verify").available, true);
});

test("all four endings are reachable and only the fully strong review is the best outcome", () => {
  for (const decision of coldMirror.decisions) {
    let state = createCaseSession(coldMirror);
    state = inspectMany(state, ["e_particle_alert", "e_hvac_trace"]);
    state = consultAdvisor(coldMirror, state, "boy").state;
    state = inspectEvidence(coldMirror, state, "e_service_bulletin");
    state = consultAdvisor(coldMirror, state, "tooth").state;
    state = inspectMany(state, ["e_alarm_panel", "e_witness_note", "e_handheld_check"]);
    state = consultAdvisor(coldMirror, state, "darth").state;
    state = beginTrust(coldMirror, state);
    for (const advisorId of decision.id === "d_relocate_verify" ? ["tooth", "donsol"] : ["boy", "darth"]) {
      state = toggleTrustedAdvisor(coldMirror, state, advisorId).state;
    }
    state = commitTrust(coldMirror, state);
    state = chooseDecision(coldMirror, state, decision.id);
    assert.equal(state.sceneId, "outcome", `${decision.id} did not reach its outcome`);
    state = openReview(coldMirror, state);
    state = completeCaseSession(coldMirror, state);
    assert.equal(state.completed, true);
    assert.equal(isBestOutcome(coldMirror, state), decision.id === "d_relocate_verify");
  }
});

test("restore sanitizes foreign, hidden, duplicate, and invented values", () => {
  const restored = normalizeCaseSession(coldMirror, {
    episodeId: "episode-003",
    completed: true,
    outcomeId: "invented",
    decisionId: "invented",
    sceneId: "review",
    inspectedSources: ["e_particle_alert", "e_particle_alert", "e_handheld_check", "invented"],
    revealedSources: ["e_service_bulletin", "invented"],
    consultedAdvisors: ["boy", "intruder"],
    trustedAdvisors: ["boy", "tooth", "darth"],
    selectedEvidenceId: "invented"
  });
  assert.equal(restored.completed, false);
  assert.equal(restored.sceneId, "decide");
  assert.deepEqual(restored.inspectedSources, ["e_particle_alert"]);
  assert.deepEqual(restored.revealedSources, ["e_service_bulletin"]);
  assert.deepEqual(restored.consultedAdvisors, ["boy"]);
  assert.deepEqual(restored.trustedAdvisors, ["boy", "tooth"]);
  assert.equal(restored.selectedEvidenceId, null);
});
