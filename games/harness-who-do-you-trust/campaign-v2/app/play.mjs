import {createCampaignStore, emitCaseCompleted} from "../runtime/campaign-store.mjs";
import {
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
  previousScene,
  toggleTrustedAdvisor,
  trustStatus,
  visibleEvidence
} from "../runtime/case-engine.mjs";

const app = document.querySelector("#app");
const params = new URLSearchParams(location.search);
const requestedCaseId = params.get("case") ?? "episode-003";
const preview = params.get("preview") === "1";
const stageOrder = ["investigate", "trust", "decide", "outcome", "review"];
const ui = {advice: null, reveal: [], drawerOpen: false, saveOkay: true};
let manifest;
let campaignEntry;
let caseData;
let store;
let state;

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;"
  })[character]);
}

function visualClass(evidenceId) {
  return ({
    e_particle_alert: "visual-particle",
    e_hvac_trace: "visual-hvac",
    e_alarm_panel: "visual-alarm",
    e_witness_note: "visual-witness",
    e_service_bulletin: "visual-bulletin",
    e_handheld_check: "visual-meter"
  })[evidenceId] ?? "visual-bulletin";
}

async function sha256(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function loadJsonText(url) {
  const response = await fetch(url, {cache: "no-store"});
  if (!response.ok) throw new Error(`Could not load ${url}.`);
  return response.text();
}

function persist() {
  if (preview) return true;
  ui.saveOkay = store.saveCase(caseData.id, state, {bestReached: isBestOutcome(caseData, state)});
  return ui.saveOkay;
}

function setState(nextState, {save = true} = {}) {
  state = normalizeCaseSession(caseData, nextState);
  if (save) persist();
  render();
}

function stageRail() {
  const active = state.sceneId === "briefing" ? 0 : Math.max(0, stageOrder.indexOf(state.sceneId));
  return stageOrder.map((stage, index) => {
    const label = ({investigate: "Clues", trust: "Trust", decide: "Decide", outcome: "Result", review: "Review"})[stage];
    const className = index < active ? "stage done" : index === active ? "stage current" : "stage";
    return `<div class="${className}">${label}</div>`;
  }).join("");
}

function statusStrip() {
  return `<div class="status-row" aria-label="Live incident facts">
    <span class="status-pill danger">East sensor <strong>184</strong></span>
    <span class="status-pill">Outside <strong>−14°C</strong></span>
    <span class="status-pill">Smoke alarm <strong>clear</strong></span>
    <span class="status-pill">Families <strong>inside</strong></span>
  </div>`;
}

function shell(screen) {
  document.title = `${caseData.briefing.heading} · HARNESS`;
  app.innerHTML = `<header>
    <div class="topbar">
      <a class="text-link" href="./index.html" aria-label="Return to case list">← Cases</a>
      <span class="save-state">${preview ? "Development preview" : ui.saveOkay ? "Case saved" : "Play continues offline"}</span>
    </div>
    <div class="case-head">
      <div>
        <p class="eyebrow">${escapeHtml(caseData.presentation.caseLabel)}</p>
        <h1>${escapeHtml(caseData.title)}</h1>
        <p>${escapeHtml(caseData.presentation.assignmentTitle)}</p>
      </div>
      <div class="alert-gauge" aria-label="Particle reading 184">184<small>AIR</small></div>
    </div>
    <div class="stage-rail" aria-label="Case progress">${stageRail()}</div>
  </header>
  <main class="screen" id="case-screen">${screen}</main>
  ${drawerMarkup()}
  ${preview ? '<p class="dev-flag">Internal renderer preview. Not part of a release build.</p>' : ""}`;
}

function briefingScreen() {
  const paragraphs = caseData.briefing.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");
  shell(`${statusStrip()}
    <article class="card briefing">
      <p class="eyebrow">Incoming assignment</p>
      <h2>${escapeHtml(caseData.briefing.heading)}</h2>
      ${paragraphs}
      <div class="mission-box"><b>Your mission</b>${escapeHtml(caseData.briefing.mission)}</div>
      <button class="primary" data-action="start">Open the evidence board</button>
    </article>`);
}

function evidenceCards() {
  const inspected = new Set(state.inspectedSources);
  const newRecords = new Set(ui.reveal);
  return visibleEvidence(caseData, state).map((evidence) => `<button class="evidence-card ${inspected.has(evidence.id) ? "inspected" : ""} ${newRecords.has(evidence.id) ? "new-record" : ""}" data-action="inspect" data-id="${escapeHtml(evidence.id)}">
    <span class="evidence-visual ${visualClass(evidence.id)}" aria-hidden="true"></span>
    <span class="evidence-copy">
      <h3>${escapeHtml(evidence.title)}</h3>
      <p>${escapeHtml(evidence.clock)}</p>
      <span class="evidence-state">${inspected.has(evidence.id) ? "Checked ✓" : "Tap to inspect"}</span>
    </span>
  </button>`).join("");
}

function advisorCards() {
  const consulted = new Set(state.consultedAdvisors);
  return caseData.advisorOrder.map((advisorId) => {
    const advisor = caseData.advisors[advisorId];
    const initials = advisorId === "donsol" ? "DS" : advisor.name.slice(0, 1);
    return `<button class="advisor-button advisor-${advisorId} ${consulted.has(advisorId) ? "consulted" : ""}" data-action="consult" data-id="${advisorId}">
      <span class="avatar" aria-hidden="true">${escapeHtml(initials)}</span>
      <span><strong class="advisor-name">${escapeHtml(advisor.name)}</strong><span class="advisor-role">${escapeHtml(advisor.verb)}</span></span>
      <span class="consult-state">${consulted.has(advisorId) ? "Ask again" : "Ask"}</span>
    </button>`;
  }).join("");
}

function investigationScreen() {
  const gate = trustStatus(caseData, state);
  const gateText = gate.available
    ? "Your trust judgment is ready."
    : `Inspect ${Math.max(0, gate.minimumEvidence - gate.inspected)} more clue(s) and ask ${Math.max(0, gate.minimumAdvisers - gate.consulted)} more adviser(s).`;
  shell(`${statusStrip()}
    <div class="screen-head"><div><p class="eyebrow">Fact wall</p><h2>What do we actually know?</h2></div></div>
    <div class="status-row">
      <span class="status-pill"><strong>${state.inspectedSources.length}</strong> inspected</span>
      <span class="status-pill"><strong>${state.consultedAdvisors.length}</strong> advisers</span>
      <span class="status-pill"><strong>${state.revealedSources.length}</strong> found records</span>
    </div>
    ${ui.reveal.length ? `<div class="reveal-box"><b>New record unlocked</b><p>${ui.reveal.map((id) => escapeHtml(caseData.evidence.find((item) => item.id === id)?.title)).join(", ")}</p></div>` : ""}
    <p class="section-label">Evidence</p>
    <div class="evidence-grid">${evidenceCards()}</div>
    <p class="section-label">Adviser bench</p>
    ${ui.advice ? `<div class="advice-box"><b>${escapeHtml(caseData.advisors[ui.advice.advisorId].name)} says:</b><p>${escapeHtml(ui.advice.text)}</p></div>` : ""}
    <div class="advisor-grid">${advisorCards()}</div>
    <div class="action-dock">
      <button class="secondary" data-action="back">Back</button>
      <button class="primary" data-action="begin-trust" ${gate.available ? "" : "disabled"}>Weigh who to trust</button>
    </div>
    <p class="gate-copy">${escapeHtml(gateText)}</p>`);
}

function trustScreen() {
  const gate = trustStatus(caseData, state);
  const selected = new Set(state.trustedAdvisors);
  const cards = caseData.trustJudgment.options.map((option) => {
    const advisor = caseData.advisors[option.advisorId];
    return `<button class="trust-card ${selected.has(option.advisorId) ? "selected" : ""}" data-action="toggle-trust" data-id="${option.advisorId}">
      <span class="pick-state">${selected.has(option.advisorId) ? "SELECTED ✓" : ""}</span>
      <h3>${escapeHtml(option.label)}</h3>
      <p><strong>Useful:</strong> ${escapeHtml(option.strength)}</p>
      <p class="blind"><strong>Blind spot:</strong> ${escapeHtml(option.blindSpot)}</p>
    </button>`;
  }).join("");
  shell(`${statusStrip()}
    <div class="screen-head"><div><p class="eyebrow">Trust judgment</p><h2>${escapeHtml(caseData.trustJudgment.prompt)}</h2><p>Select exactly ${gate.mustSelect}. You can change them before deciding.</p></div></div>
    ${ui.reveal.length ? `<div class="reveal-box"><b>Your choice opened a lead</b><p>Return to the evidence board if you want to inspect it before deciding.</p></div>` : ""}
    <div class="trust-grid">${cards}</div>
    <div class="action-dock">
      <button class="secondary" data-action="evidence">Evidence</button>
      <button class="primary" data-action="commit-trust" ${gate.complete ? "" : "disabled"}>Continue with ${gate.selected}/${gate.mustSelect}</button>
    </div>`);
}

function missingRequirementText(status) {
  const parts = [];
  if (status.missingEvidence.length) {
    const titles = status.missingEvidence.map((id) => caseData.evidence.find((item) => item.id === id)?.title ?? id);
    parts.push(`Inspect: ${titles.join(" + ")}`);
  }
  if (status.missingAdvisors.length) {
    const names = status.missingAdvisors.map((id) => caseData.advisors[id]?.name ?? id);
    parts.push(`Trust: ${names.join(" + ")}`);
  }
  return parts.join(" · ");
}

function decisionScreen() {
  const cards = caseData.decisions.map((decision) => {
    const status = decisionStatus(caseData, state, decision.id);
    return `<article class="decision-card">
      <h3>${escapeHtml(decision.label)}</h3>
      <p>${escapeHtml(decision.description)}</p>
      <p class="risk"><strong>Tradeoff:</strong> ${escapeHtml(decision.risk)}</p>
      ${status.available ? "" : `<p class="lock-note">🔒 ${escapeHtml(missingRequirementText(status))}</p>`}
      <button class="choice-button" data-action="decide" data-id="${decision.id}" ${status.available ? "" : "disabled"}>Issue this order</button>
    </article>`;
  }).join("");
  shell(`<div class="screen-head"><div><p class="eyebrow">Command decision</p><h2>Choose the safest defensible action</h2><p>No option is free of cost. Protect people and preserve what can still be learned.</p></div></div>
    <div class="decision-grid">${cards}</div>
    <div class="action-dock">
      <button class="secondary" data-action="evidence">Evidence</button>
      <button class="secondary" data-action="edit-trust">Change trust</button>
    </div>`);
}

function outcomeScreen() {
  const decision = caseData.decisions.find((item) => item.id === state.decisionId);
  const reflections = state.trustedAdvisors.map((advisorId) => `<div class="reflection"><b>${escapeHtml(caseData.advisors[advisorId].name)} — your trusted voice</b><p>${escapeHtml(decision.outcome.trustVariants[advisorId])}</p></div>`).join("");
  shell(`<article class="card outcome-hero">
      <span class="outcome-mark">ORDER CARRIED OUT</span>
      <h2>${escapeHtml(decision.outcome.heading)}</h2>
      <p>${escapeHtml(decision.outcome.text)}</p>
      ${reflections}
    </article>
    <div class="action-dock">
      <button class="secondary" data-action="back">Reconsider</button>
      <button class="primary" data-action="review">Open case review</button>
    </div>`);
}

function reviewScreen() {
  const postmortem = caseData.postmortem[state.decisionId];
  const known = postmortem.known.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const unknown = postmortem.unknown.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const grades = caseData.advisorOrder.map((advisorId) => {
    const grade = postmortem.advisors[advisorId];
    return `<div class="grade ${grade.rating}"><b>${escapeHtml(caseData.advisors[advisorId].name)}<em>${escapeHtml(grade.rating)}</em></b><p>${escapeHtml(grade.text)}</p></div>`;
  }).join("");
  shell(`<div class="screen-head"><div><p class="eyebrow">Case review</p><h2>Facts, gaps, and judgment</h2></div></div>
    <div class="review-grid">
      <article class="card review-card"><h3>What the team knew</h3><ul>${known}</ul></article>
      <article class="card review-card"><h3>What stayed unknown</h3><ul>${unknown}</ul></article>
      <article class="card review-card"><h3>Adviser scorecard</h3><div class="grade-list">${grades}</div></article>
      <article class="card review-card"><h3>Lesson carried forward</h3><p>${escapeHtml(caseData.progression.continuityBeat)}</p></article>
    </div>
    ${state.completed ? `<div class="completion"><b>Case 3 recorded.</b><p>${isBestOutcome(caseData, state) ? "You protected people, preserved evidence, and kept a human responsible for the final check." : "The next case unlocks because completing the investigation matters—even when the result is imperfect."}</p><a class="primary text-link" href="./index.html">Return to campaign</a></div>` : ""}
    <div class="action-dock">
      <button class="secondary" data-action="back">Result</button>
      <button class="primary" data-action="finish" ${state.completed ? "disabled" : ""}>${state.completed ? "Case complete ✓" : "Finish case"}</button>
    </div>`);
}

function drawerMarkup() {
  if (!ui.drawerOpen || !state.selectedEvidenceId) return '<div class="drawer" hidden></div>';
  const evidence = caseData.evidence.find((item) => item.id === state.selectedEvidenceId);
  if (!evidence) return '<div class="drawer" hidden></div>';
  const body = evidence.body.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");
  return `<aside class="drawer" role="dialog" aria-modal="true" aria-labelledby="evidence-title">
    <div class="drawer-panel">
      <div class="drawer-visual evidence-visual ${visualClass(evidence.id)}" aria-hidden="true"></div>
      <div class="drawer-copy">
        <p class="eyebrow">Evidence record</p>
        <h2 id="evidence-title">${escapeHtml(evidence.title)}</h2>
        <p class="source-line">${escapeHtml(evidence.source)} · ${escapeHtml(evidence.clock)}</p>
        <p><strong>${escapeHtml(evidence.summary)}</strong></p>
        ${body}
        <div class="fact-split">
          <div class="fact-box"><b>What this proves</b>${escapeHtml(evidence.proves)}</div>
          <div class="fact-box limit"><b>What this does not prove</b>${escapeHtml(evidence.doesNotProve)}</div>
        </div>
        <button class="secondary drawer-close" data-action="close-drawer">Back to the board</button>
      </div>
    </div>
  </aside>`;
}

function render() {
  if (state.sceneId === "briefing") briefingScreen();
  else if (state.sceneId === "investigate") investigationScreen();
  else if (state.sceneId === "trust") trustScreen();
  else if (state.sceneId === "decide") decisionScreen();
  else if (state.sceneId === "outcome") outcomeScreen();
  else reviewScreen();
  if (ui.drawerOpen) document.querySelector(".drawer-close")?.focus();
}

function lockedScreen() {
  app.innerHTML = `<main class="locked-card"><p class="eyebrow">Case locked</p><h1>Complete the earlier cases first.</h1><p>The campaign keeps every investigation in order so the final judgment has context.</p><a class="primary text-link" href="./index.html">Return to campaign</a></main>`;
}

function errorScreen(error) {
  app.innerHTML = `<main class="error-card"><p class="eyebrow">Case file unavailable</p><h1>We did not open a broken game.</h1><p>${escapeHtml(error.message)}</p><a class="primary text-link" href="./index.html">Return to campaign</a></main>`;
}

app.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button || button.disabled || !state) return;
  const action = button.dataset.action;
  const id = button.dataset.id;
  ui.reveal = [];

  if (action === "start") setState({...state, sceneId: "investigate"});
  else if (action === "inspect") {
    state = inspectEvidence(caseData, state, id);
    ui.drawerOpen = true;
    persist();
    render();
  } else if (action === "close-drawer") {
    ui.drawerOpen = false;
    render();
  } else if (action === "consult") {
    const result = consultAdvisor(caseData, state, id);
    ui.advice = result.advice ? {advisorId: id, text: result.advice.text} : null;
    ui.reveal = result.newlyRevealed;
    setState(result.state);
  } else if (action === "begin-trust") setState(beginTrust(caseData, state));
  else if (action === "toggle-trust") {
    const result = toggleTrustedAdvisor(caseData, state, id);
    ui.reveal = result.newlyRevealed;
    setState(result.state);
  } else if (action === "commit-trust") setState(commitTrust(caseData, state));
  else if (action === "evidence") setState({...state, sceneId: "investigate"});
  else if (action === "edit-trust") setState({...state, sceneId: "trust"});
  else if (action === "decide") setState(chooseDecision(caseData, state, id));
  else if (action === "review") setState(openReview(caseData, state));
  else if (action === "finish") {
    state = completeCaseSession(caseData, state);
    persist();
    emitCaseCompleted(window, {caseId: caseData.id, outcomeId: state.outcomeId});
    render();
  } else if (action === "back") setState(previousScene(caseData, state));
});

async function boot() {
  try {
    manifest = JSON.parse(await loadJsonText("../campaign.json"));
    campaignEntry = manifest.cases.find((item) => item.id === requestedCaseId);
    if (!campaignEntry || campaignEntry.level < 3 || !/^data\/episode-00[3-5]\.json$/.test(campaignEntry.source)) {
      throw new Error("That case is not available in the shared renderer.");
    }
    const caseText = await loadJsonText(`../${campaignEntry.source}`);
    if (await sha256(caseText) !== campaignEntry.contentHash) throw new Error("The case file fingerprint does not match the approved content.");
    caseData = JSON.parse(caseText);
    store = createCampaignStore(manifest);
    if (!preview && store.caseStatus(caseData.id) === "locked") return lockedScreen();
    const saved = preview ? null : store.loadCase(caseData.id);
    state = saved ? normalizeCaseSession(caseData, saved.session) : createCaseSession(caseData);
    render();
  } catch (error) {
    errorScreen(error instanceof Error ? error : new Error("Unknown case-loading error."));
  }
}

boot();
