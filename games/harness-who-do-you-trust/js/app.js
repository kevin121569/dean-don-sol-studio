// Presentation + wiring. The only module that touches the DOM, storage, or telemetry.
// Game rules live in engine.js; this file renders state and turns input into engine actions.
import {loadEpisode} from './content.js';
import {reduce, ACTIONS as A, isHybridUnlocked, isDecisionAvailable, selectAdvice, buildPostmortem} from './engine.js';
import {createInitialState, createStore} from './state.js';
import {createTelemetry, domEventSink} from './telemetry.js';
import {isAdvisor} from './advice.js';
import {domId} from './dom-ids.js';
import {createCreativeLayer} from '../creative/creative.js';

const $ = (sel, root = document) => root.querySelector(sel);
const esc = v => String(v).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const TRUST_LABELS = {'-1': 'Doubt', '0': 'Neutral', '1': 'Trust'};
const SETTINGS_KEY = 'harness-wdyt:settings';

let episode, store, telemetry, state;
// Creative C1 presentation layer (opening, audio). Observes actions only; never changes game state.
let creative = null;
let liveTimer = null, liveGeneration = 0;
// Bumped only by RESET. Telemetry for an action belongs to the run it was dispatched in: an ordinary
// nested dispatch (same run) must not truncate it; a reset (new run) must cancel it.
let runGeneration = 0;
// UI-only state: never persisted, never part of game state.
const ui = {openEvidence: new Set(), selectedDecision: null};

// ---------------------------------------------------------------- boot
boot();

async function boot() {
  applyMotionSetting(readSettings().reduceMotion === true);
  try {
    episode = await loadEpisode('data/episode-001.json');
  } catch (err) {
    $('#scene').innerHTML = `<section class="panel error" aria-labelledby="scene-title"><h1 id="scene-title" tabindex="-1">Episode could not load</h1>
      <p>${esc(err.message)}</p><p class="muted">If you opened this file directly from disk, serve the folder over HTTP instead. Nothing in the game needs the internet.</p></section>`;
    return;
  }
  store = createStore(episode);
  telemetry = createTelemetry({episodeId: episode.id, sinks: [domEventSink(window)]});
  state = store.load() ?? createInitialState(episode);
  // Debug/QA handle. Exposes ids and counts only; there is no personal data in state.
  window.HarnessWDYT = Object.freeze({getState: () => structuredClone(state), events: () => telemetry.events()});
  document.addEventListener('click', onClick);
  document.addEventListener('change', onChange);
  render({sceneChanged: false});
  creative = createCreativeLayer({
    document, window, storage: settingsStorage(), episode, ACTIONS: A, isHybridUnlocked,
    getState: () => state, reducedMotion: motionReduced, say,
    settings: {read: readSettings, write: writeSettings},
  });
  creative.boot().catch(() => { /* the opening is optional */ });
}

// ---------------------------------------------------------------- dispatch
function dispatch(action) {
  const prev = state;
  const next = reduce(prev, action, episode);
  if (action.type === A.RESET) { invalidateAnnouncements(); runGeneration++; }
  const run = runGeneration;
  // Commit before notifying synchronous external sinks. A sink can reset play;
  // that newer state must win over this dispatch and its pending presentation.
  if (next !== prev) {
    state = next;
    store.save(state);
  }
  track(action, prev, next, run);
  // A nested dispatch already rendered/announced newer state; never draw this older one over it.
  if (state !== next) return next !== prev;
  announce(action, prev, next);
  creative?.onAction(action, prev, next);
  if (next === prev) return false;
  render({sceneChanged: prev.sceneId !== next.sceneId});
  return true;
}

function track(action, prev, next, run) {
  const sameRun = () => runGeneration === run;
  const changed = next !== prev;
  const consultable = prev.sceneId === 'investigate' && !prev.completed;
  const adviceOf = (s, id) => s.consultations.find(c => c.advisorId === id)?.adviceId ?? null;
  switch (action.type) {
    case A.START:
      if (changed) telemetry.track('episode_start', {resumed: false});
      break;
    case A.OPEN_EVIDENCE:
      if (changed) telemetry.track('evidence_open', {evidenceId: action.evidenceId, inspectedCount: next.inspectedSources.length});
      break;
    case A.CONSULT:
      if (consultable && isAdvisor(episode, action.advisorId)) telemetry.track('advisor_consult', {advisorId: action.advisorId, adviceId: adviceOf(next, action.advisorId), mode: 'single', updated: adviceOf(prev, action.advisorId) !== adviceOf(next, action.advisorId)});
      break;
    case A.CONSULT_ALL:
      if (consultable) for (const id of episode.advisorOrder) {
        telemetry.track('advisor_consult', {advisorId: id, adviceId: adviceOf(next, id), mode: 'all', updated: adviceOf(prev, id) !== adviceOf(next, id)});
        if (!sameRun()) break; // reset/new run only; ordinary nested transitions keep logging
      }
      break;
    case A.SUBMIT_DECISION:
      if (changed) {
        telemetry.track('decision_submit', {
          decisionId: action.decisionId, hybridUnlocked: isHybridUnlocked(prev, episode),
          uncertaintyAcknowledged: prev.uncertaintyAcknowledged,
          inspectedCount: prev.inspectedSources.length, consultedCount: prev.consultations.length,
        });
        if (sameRun()) telemetry.track('episode_complete', {outcomeId: next.outcomeId, trustWeights: {...next.trustWeights}});
      }
      break;
  }
}

function announce(action, prev, next) {
  const lines = [];
  if (action.type === A.OPEN_EVIDENCE && next !== prev) lines.push(`Opened ${evidenceById(action.evidenceId).title}.`);
  if (action.type === A.CONSULT || action.type === A.CONSULT_ALL) {
    const ids = action.type === A.CONSULT ? [action.advisorId] : episode.advisorOrder;
    for (const id of ids) {
      const before = prev.consultations.find(c => c.advisorId === id)?.adviceId;
      const after = next.consultations.find(c => c.advisorId === id)?.adviceId;
      if (after && after !== before) lines.push(`${episode.advisors[id].name}: ${adviceText(id, after)}`);
      else if (action.type === A.CONSULT && after) lines.push(`${episode.advisors[id].name} has nothing new to add.`);
    }
    for (const id of next.discoveredEvidence.filter(e => !prev.discoveredEvidence.includes(e))) {
      lines.push(`New evidence surfaced: ${evidenceById(id).title}.`);
    }
  }
  if (!isHybridUnlocked(prev, episode) && isHybridUnlocked(next, episode)) {
    lines.push(`A new option is available when you decide: ${episode.decisions.find(d => d.requiresHybrid).label}.`);
  }
  if (lines.length) say(lines.join(' '));
}

function invalidateAnnouncements() {
  liveGeneration++;
  if (liveTimer !== null) clearTimeout(liveTimer);
  liveTimer = null;
  $('#live').textContent = '';
}

function say(text) {
  invalidateAnnouncements();
  const live = $('#live');
  const generation = liveGeneration;
  // Clear, then set on a later task so screen readers re-announce identical messages. setTimeout rather
  // than requestAnimationFrame: rAF never fires while the page isn't being drawn (backgrounded WebView).
  liveTimer = setTimeout(() => {
    if (generation !== liveGeneration) return;
    liveTimer = null;
    live.textContent = text;
  }, 30);
}

// ---------------------------------------------------------------- input
function onClick(e) {
  const el = e.target.closest('[data-action]');
  if (!el || el.disabled) return;
  const id = el.dataset.id;
  switch (el.dataset.action) {
    case 'start': dispatch({type: A.START}); break;
    case 'toggleEvidence': {
      const wasOpen = ui.openEvidence.has(id);
      wasOpen ? ui.openEvidence.delete(id) : ui.openEvidence.add(id);
      if (wasOpen || !dispatch({type: A.OPEN_EVIDENCE, evidenceId: id})) render({sceneChanged: false});
      break;
    }
    case 'consult': dispatch({type: A.CONSULT, advisorId: id}); break;
    case 'consultAll': dispatch({type: A.CONSULT_ALL}); break;
    case 'goToDecision': dispatch({type: A.GO_TO_DECISION}); break;
    case 'back': dispatch({type: A.BACK_TO_INVESTIGATION}); break;
    case 'submit': if (ui.selectedDecision) dispatch({type: A.SUBMIT_DECISION, decisionId: ui.selectedDecision}); break;
    case 'viewPostmortem': dispatch({type: A.VIEW_POSTMORTEM}); break;
    case 'playAgain': resetGame(); break;
    case 'help':
      telemetry?.track('help_open', {sceneId: state?.sceneId ?? null});
      $('#helpDialog').showModal();
      break;
    case 'toggleMotion': {
      const reduce = !document.documentElement.hasAttribute('data-motion');
      applyMotionSetting(reduce);
      writeSettings({...readSettings(), reduceMotion: reduce});
      say(reduce ? 'Reduced motion on.' : 'Reduced motion off.');
      break;
    }
    case 'askReset': $('#resetDialog').showModal(); break;
    case 'replayIntro': creative?.openIntro(); break;
    // Reset on the confirm click itself (the form still closes the dialog). Relying on the dialog's
    // async 'close' event proved unreliable when the page is not being drawn.
    case 'confirmReset': resetGame(); say('Progress reset. Episode 001 is back at the briefing.'); break;
  }
}

function onChange(e) {
  const el = e.target;
  if (el.name?.startsWith('trust-')) dispatch({type: A.SET_TRUST, advisorId: el.name.slice(6), value: Number(el.value)});
  else if (el.id === 'ack') dispatch({type: A.ACKNOWLEDGE_UNCERTAINTY, value: el.checked});
  else if (el.name === 'decision') { ui.selectedDecision = el.value; render({sceneChanged: false}); }
}

function resetGame() {
  ui.openEvidence.clear();
  ui.selectedDecision = null;
  store.clear();
  dispatch({type: A.RESET});
}

// ---------------------------------------------------------------- settings
function settingsStorage() {
  try { return localStorage; } catch { return null; } // the property getter itself can throw (denied storage)
}
function readSettings() {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') ?? {}; } catch { return {}; }
}
function writeSettings(s) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch { /* storage unavailable */ }
}
function applyMotionSetting(reduce) {
  if (reduce) document.documentElement.setAttribute('data-motion', 'reduce');
  else document.documentElement.removeAttribute('data-motion');
  $('#motionToggle')?.setAttribute('aria-pressed', String(reduce));
}
const motionReduced = () => document.documentElement.hasAttribute('data-motion') || matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------------------------------------------------------------- render
const evidenceById = id => episode.evidence.find(e => e.id === id);
const adviceText = (advisorId, adviceId) => episode.advice[advisorId].find(a => a.id === adviceId)?.text ?? '';

function render({sceneChanged}) {
  const activeId = document.activeElement?.id;
  const scene = $('#scene');
  scene.innerHTML = {briefing, investigate, decide, outcome, postmortem}[state.sceneId]();
  document.title = `${sceneTitle()} — The Harness: Who Do You Trust?`;
  if (sceneChanged) {
    window.scrollTo({top: 0, behavior: motionReduced() ? 'auto' : 'smooth'});
    $('#scene-title')?.focus({preventScroll: true});
  } else if (activeId && document.getElementById(activeId)) {
    document.getElementById(activeId).focus({preventScroll: true});
  }
}

function sceneTitle() {
  return {briefing: 'Briefing', investigate: 'Investigate', decide: 'Decide', outcome: 'Outcome', postmortem: 'What you learned'}[state.sceneId];
}

function briefing() {
  const b = episode.briefing;
  return `
  <section class="panel alert-card" aria-labelledby="scene-title">
    <p class="eyebrow">Episode 1 · ${esc(episode.title)}</p>
    <h1 id="scene-title" tabindex="-1">${esc(b.heading)}</h1>
    <p class="status-line"><span class="pill warn">${esc(b.clock)}</span><span class="pill">${esc(b.clockNote)}</span></p>
    ${b.paragraphs.map(p => `<p class="lede">${esc(p)}</p>`).join('')}
  </section>
  <section class="panel" aria-labelledby="roles-title">
    <h2 id="roles-title">Meet your AI helpers</h2>
    <ul class="roles">
      ${episode.advisorOrder.map(id => { const a = episode.advisors[id]; return `<li><b>${esc(a.name)}</b> — ${esc(a.verb)}. <span class="muted">${esc(a.strength)}; ${esc(a.weakness.toLowerCase())}.</span></li>`; }).join('')}
      <li><b>YOU, THE DECIDER</b> — <span class="muted">you make the final call.</span></li>
    </ul>
  </section>
  <div class="actions"><button type="button" class="btn primary" id="btn-start" data-action="start">${state.inspectedSources.length ? 'Continue' : 'Begin investigation'}</button>
    <button type="button" class="btn" data-action="replayIntro">Watch the opening</button></div>`;
}

function investigate() {
  const discovered = state.discoveredEvidence.map(evidenceById);
  return `
  <section aria-labelledby="scene-title">
    <p class="eyebrow">Episode 1 · Investigate</p>
    <h1 id="scene-title" tabindex="-1">Did Server 4 really send stolen data?</h1>
    <p class="status-line" id="progress">
      <span class="pill">${state.inspectedSources.length} of ${discovered.length} clues opened</span>
      <span class="pill">${state.consultations.length} of ${episode.advisorOrder.length} helpers asked</span>
      <span class="pill warn">Take your time · no live countdown</span>
    </p>
    <p class="mission"><b>Your mission:</b> work out what really happened, separate facts from guesses, and decide what to do with Server 4 — without destroying the proof unless you must.</p>
  </section>
  <div class="grid-2">
    <section class="panel" aria-labelledby="evidence-title">
      <h2 id="evidence-title">Clues</h2>
      <p class="muted">Tap a clue to open it. Open them in any order. Which reports are facts, and which are guesses?</p>
      <ul class="evidence-list">${discovered.map(evidenceCard).join('')}</ul>
    </section>
    <section class="panel" aria-labelledby="advisors-title">
      <h2 id="advisors-title">Your AI helpers</h2>
      <p class="muted">Each helper notices different things. Ask again after you find a new clue.</p>
      <div class="actions"><button type="button" class="btn" id="btn-consult-all" data-action="consultAll">Ask all four</button></div>
      <div class="advisors" style="margin-top:12px">${episode.advisorOrder.map(advisorCard).join('')}</div>
    </section>
  </div>
  <div class="actions"><button type="button" class="btn primary" id="btn-decide" data-action="goToDecision">Make my decision</button></div>`;
}

function evidenceCard(e) {
  const open = ui.openEvidence.has(e.id);
  const inspected = state.inspectedSources.includes(e.id);
  const id = esc(e.id);
  const dom = k => esc(domId[k](e.id)); // shared with validateEpisode's collision check
  return `
  <li class="evidence${e.hidden ? ' is-new' : ''}">
    <button type="button" class="evidence-toggle" id="${dom('evidenceToggle')}" data-action="toggleEvidence" data-id="${id}" aria-expanded="${open}" aria-controls="${dom('evidenceBody')}" aria-labelledby="${dom('evidenceTitle')} ${dom('evidenceSource')} ${dom('evidenceState')}">
      <span class="title" id="${dom('evidenceTitle')}">${esc(e.title)}${e.hidden ? ' <span class="muted">· surfaced by BOY</span>' : ''}</span>
      <span class="source" id="${dom('evidenceSource')}">${esc(e.source)}</span>
      <span class="state${inspected ? ' opened' : ''}" id="${dom('evidenceState')}">${inspected ? '✓ Opened' : 'Unopened'}</span>
    </button>
    <div class="evidence-body" id="${dom('evidenceBody')}" ${open ? '' : 'hidden'}>
      ${e.body.map(line => `<p class="log-line">${esc(line)}</p>`).join('')}
      <p class="clock">Time shown by: ${esc(e.clock)}</p>
    </div>
  </li>`;
}

function advisorCard(id) {
  const attrId = esc(id);
  const a = episode.advisors[id];
  const c = state.consultations.find(x => x.advisorId === id);
  const stale = c && selectAdvice(state, episode, id).id !== c.adviceId;
  const trust = state.trustWeights[id];
  return `
  <article class="advisor" data-advisor="${attrId}" aria-labelledby="${esc(domId.adviserName(id))}">
    <div class="advisor-head">
      <img src="${esc(a.icon)}" alt="" width="36" height="36">
      <div><h3 id="${esc(domId.adviserName(id))}">${esc(a.name)}</h3><span class="verb">${esc(a.verb)}</span></div>
    </div>
    <dl><dt>Good at</dt><dd>${esc(a.strength)}</dd><dt>Watch out</dt><dd>${esc(a.weakness)}</dd></dl>
    ${c ? `<blockquote class="advice" aria-label="${esc(a.name)} says"><p>${esc(adviceText(id, c.adviceId))}</p></blockquote>` : ''}
    ${stale ? `<p class="muted">You've learned more since you asked. ${esc(a.name)} may see it differently now.</p>` : ''}
    <button type="button" class="btn" id="${esc(domId.consult(id))}" data-action="consult" data-id="${attrId}">${c ? `Ask ${esc(a.name)} again` : `Ask ${esc(a.name)}`}</button>
    <fieldset class="trust" ${c ? '' : 'disabled'}>
      <legend>How much do you trust ${esc(a.name)}?${c ? '' : ' (ask first)'}</legend>
      <div class="segmented">
        ${[-1, 0, 1].map(v => `<label><input type="radio" name="trust-${attrId}" id="${esc(domId.trust(id, v))}" value="${v}" ${trust === v ? 'checked' : ''}><span>${TRUST_LABELS[v]}</span></label>`).join('')}
      </div>
    </fieldset>
  </article>`;
}

function decide() {
  const unlocked = isHybridUnlocked(state, episode);
  if (ui.selectedDecision && !isDecisionAvailable(state, episode, ui.selectedDecision)) ui.selectedDecision = null;
  return `
  <section aria-labelledby="scene-title">
    <p class="eyebrow">Episode 1 · Decide</p>
    <h1 id="scene-title" tabindex="-1">What should happen to Server 4?</h1>
    <p class="lede">You opened ${state.inspectedSources.length} of ${state.discoveredEvidence.length} clues and asked ${state.consultations.length} of ${episode.advisorOrder.length} helpers. You can still go back and check more.</p>
  </section>
  <div class="panel">
    <fieldset style="border:0;padding:0;margin:0">
      <legend id="choices-title"><h2 style="margin:0 0 .6em">Choose what to do</h2></legend>
      <ul class="choices">
        ${episode.decisions.map(d => {
          const available = !d.requiresHybrid || unlocked;
          const id = esc(d.id);
          const decId = esc(domId.decision(d.id)), lockId = esc(domId.decisionLock(d.id));
          return `<li class="choice">
            <input type="radio" name="decision" id="${decId}" value="${id}" ${available ? '' : 'disabled aria-describedby="' + lockId + '"'} ${ui.selectedDecision === d.id ? 'checked' : ''}>
            <label for="${decId}"><span class="label">${esc(d.label)}${available ? '' : ' — locked'}</span>
              <span class="desc">${esc(d.description)}</span>
              ${available ? '' : `<span class="lock" id="${lockId}">🔒 ${esc(episode.hybridUnlock.lockedHint)}</span>`}</label>
          </li>`;
        }).join('')}
      </ul>
    </fieldset>
    <label class="check" for="ack"><input type="checkbox" id="ack" ${state.uncertaintyAcknowledged ? 'checked' : ''}>
      <span>I understand that some things are still unknown.</span></label>
    <div class="actions">
      <button type="button" class="btn primary" id="btn-submit" data-action="submit" ${ui.selectedDecision ? '' : 'disabled aria-describedby="submit-hint"'}>Confirm my decision</button>
      <button type="button" class="btn" id="btn-back" data-action="back">Go back to the clues</button>
      ${ui.selectedDecision ? '' : '<span class="muted" id="submit-hint">Choose an action first.</span>'}
    </div>
  </div>`;
}

function outcome() {
  const d = episode.decisions.find(x => x.id === state.outcomeId);
  return `
  <section class="panel outcome-card" aria-labelledby="scene-title">
    <p class="eyebrow">Episode 1 · You chose: ${esc(d.label)}</p>
    <h1 id="scene-title" tabindex="-1">${esc(d.outcome.heading)}</h1>
    <p class="lede">${esc(d.outcome.text)}</p>
  </section>
  <div class="actions"><button type="button" class="btn primary" id="btn-postmortem" data-action="viewPostmortem">See what you learned</button></div>`;
}

function postmortem() {
  const pm = buildPostmortem(state, episode);
  const trustText = a => !a.consulted ? 'You didn’t ask them.' : `You chose: ${TRUST_LABELS[a.trust]}.`;
  return `
  <section aria-labelledby="scene-title">
    <p class="eyebrow">Episode 1 · What you learned</p>
    <h1 id="scene-title" tabindex="-1">What happened, and what didn't</h1>
    <p class="lede">You chose: <b>${esc(pm.decision.label)}</b>. ${pm.uncertaintyAcknowledged ? 'You said some things were still unknown.' : 'You didn’t say whether anything was still unknown.'}</p>
  </section>
  <div class="grid-2">
    <section class="panel pm-section" aria-labelledby="pm-known"><h2 id="pm-known">What you knew</h2>
      ${pm.known.length ? `<ul class="pm-list">${pm.known.map(k => `<li>${esc(k)}</li>`).join('')}</ul>` : '<p>You decided without opening any clues.</p>'}</section>
    <section class="panel pm-section" aria-labelledby="pm-unknown"><h2 id="pm-unknown">What remained unknown</h2>
      <ul class="pm-list">${pm.unknown.map(u => `<li>${esc(u)}</li>`).join('')}</ul></section>
  </div>
  <section class="panel pm-section" aria-labelledby="pm-advisors"><h2 id="pm-advisors">Adviser assumptions</h2>
    ${pm.advisors.map(a => `<div class="pm-advisor"><header><b>${esc(a.name)}</b><span class="rating ${a.rating}">Their thinking: ${a.rating}</span><span class="muted">${trustText(a)}</span></header><p>${esc(a.text)}</p></div>`).join('')}
  </section>
  <section class="panel pm-section" aria-labelledby="pm-alts"><h2 id="pm-alts">What the alternatives risked</h2>
    <ul class="pm-list">${pm.alternatives.map(x => `<li><b>${esc(x.label)}</b>${x.wasAvailable ? '' : ' <span class="muted">(locked for you this time)</span>'} — ${esc(x.risk)}</li>`).join('')}</ul>
  </section>
  <div class="actions"><button type="button" class="btn primary" id="btn-again" data-action="playAgain">Play Episode 1 again</button></div>`;
}
