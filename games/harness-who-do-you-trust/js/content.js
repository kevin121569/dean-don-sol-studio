// Loads and validates episode content. Paths are relative so the same files work on GitHub Pages
// and from Capacitor's bundled web assets — no server, no absolute URLs.
import {selectAdvice} from './advice.js';
import {duplicateDomIds} from './dom-ids.js';

export const REQUIRED_ADVISORS = Object.freeze(['boy', 'tooth', 'darth', 'donsol']);
export const RATINGS = Object.freeze(['strong', 'weak', 'mixed']);
// The only `when` keys engine.selectAdvice() knows how to evaluate. Anything else would be silently
// ignored at runtime, turning a typo into an advice line that always fires.
const WHEN_KEYS = Object.freeze(['inspected', 'hybridUnlocked', 'consultedFewerThan']);

/**
 * Content complexity limits (r4). Restore cost = feasible-history search size (≤ 930 states, ≤ 120 memoized
 * selectAdvice calls; js/state.js) × the cost of each call, which scans an adviser's variants and each
 * variant's when.inspected list. These limits bound that per-call factor, and the decision count that
 * restore indexes. They are checked BEFORE any per-item work, so oversized content is rejected without being
 * scanned. Content is never truncated: a violation is a validation error and the episode does not load.
 */
export const CONTENT_LIMITS = Object.freeze({
  maxAdviceVariantsPerAdviser: 8, // shipped maximum: 3
  maxWhenInspected: 5,            // = the packet's evidence maximum; entries must also be unique (shipped maximum: 3)
  maxDecisions: 8,                // shipped: 4
});
/**
 * r5: maximum length of every content-chosen identifier and every reference to one. Restore hashes, compares
 * and serializes them, so its cost scales with their length. Shipped maximum: 16 ("tooth_reconciled").
 * A separate export (not a CONTENT_LIMITS key) so the r4 limits object, and the test that pins it, are unchanged.
 */
export const MAX_IDENTIFIER_LENGTH = 64;
const MAX_EVIDENCE = 5; // packet range 3–5, enforced below; bounds reveals / hybridUnlock lists (unique known ids)

/**
 * r5 identifier pre-pass. Runs FIRST, before any lookup, comparison, DOM-id generation or reachability work,
 * so an over-long identifier costs one .length read. Visits every free-form identifier (episode, evidence,
 * advice variant, decision ids) and every reference to one (when.inspected, reveals, hybridUnlock.inspected,
 * postmortem keys). It iterates only collections whose size is already capped (r4 limits / the evidence
 * range); oversized collections are skipped here and rejected by their own rule. Non-strings and empty
 * strings are left to the existing safe-identifier and reference rules. Nothing is truncated or normalized.
 */
function identifierLengthProblems(ep) {
  const max = MAX_IDENTIFIER_LENGTH;
  const out = [];
  const check = (value, field, kind) => {
    if (typeof value === 'string' && value.length > max) {
      out.push(`${field}: ${kind} is ${value.length} characters; the limit is ${max} (MAX_IDENTIFIER_LENGTH) — shorten it; identifiers are never truncated`);
    }
  };
  const capped = (list, cap) => Array.isArray(list) && list.length <= cap ? list : [];
  check(ep.id, 'id', 'identifier');
  capped(ep.evidence, MAX_EVIDENCE).forEach((e, i) => check(e?.id, `evidence[${i}].id`, 'identifier'));
  if (isObj(ep.advice)) {
    for (const a of REQUIRED_ADVISORS) {
      if (!Object.hasOwn(ep.advice, a)) continue;
      capped(ep.advice[a], CONTENT_LIMITS.maxAdviceVariantsPerAdviser).forEach((v, i) => {
        if (!isObj(v)) return;
        check(v.id, `advice.${a}[${i}].id`, 'identifier');
        capped(v.when?.inspected, CONTENT_LIMITS.maxWhenInspected).forEach((r, j) => check(r, `advice.${a}[${i}].when.inspected[${j}]`, 'reference'));
        capped(v.reveals, MAX_EVIDENCE).forEach((r, j) => check(r, `advice.${a}[${i}].reveals[${j}]`, 'reference'));
      });
    }
  }
  capped(ep.hybridUnlock?.inspected, MAX_EVIDENCE).forEach((r, j) => check(r, `hybridUnlock.inspected[${j}]`, 'reference'));
  capped(ep.decisions, CONTENT_LIMITS.maxDecisions).forEach((d, i) => check(d?.id, `decisions[${i}].id`, 'identifier'));
  if (isObj(ep.postmortem)) {
    const keys = Object.keys(ep.postmortem);
    if (keys.length <= CONTENT_LIMITS.maxDecisions) keys.forEach(k => check(k, `postmortem key "${k.slice(0, 16)}…"`, 'reference'));
  }
  return out;
}

export async function loadEpisode(path = 'data/episode-001.json') {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Could not load ${path} (${response.status})`);
  const episode = await response.json();
  const problems = validateEpisode(episode);
  if (problems.length) throw new Error(`Episode content is invalid:\n${problems.join('\n')}`);
  return episode;
}

const isObj = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const isStr = v => typeof v === 'string' && v.trim().length > 0;
// IDs are used in HTML attributes, ARIA references, and delegated controls.
// The length bound is part of the definition, so every isId() use (including the DOM-id gate) implies it.
const isId = v => typeof v === 'string' && v.length <= MAX_IDENTIFIER_LENGTH && /^[A-Za-z][A-Za-z0-9_-]*$/.test(v);
const isStrList = v => Array.isArray(v) && v.length > 0 && v.every(isStr);
// Icons must be plain local asset paths: assets/<segment>/.../<name>.(svg|png|webp). An allowlist, not a
// denylist: it excludes every whitespace/control character (which WHATWG URL parsing strips, turning
// ' https://x' or '\thttps://x' external), schemes, '//', backslashes, %-encoding, '.', '..', query and fragment.
const ASSET_PATH = /^assets(?:\/[A-Za-z0-9_-]+)+\.(?:svg|png|webp)$/;
const ASSET_BASE = 'https://game.invalid/g/';
const isLocalAssetPath = v => {
  if (typeof v !== 'string' || !ASSET_PATH.test(v)) return false;
  // Defence in depth: however a browser normalizes it, it must still resolve to exactly this local path.
  try {
    const u = new URL(v, ASSET_BASE);
    return u.origin === 'https://game.invalid' && u.pathname === '/g/' + v && !u.search && !u.hash;
  } catch { return false; }
};
const sameSet = (a, b) => a.length === b.length && new Set(a).size === a.length && a.every(x => b.includes(x));

/**
 * Validates everything engine.js and app.js assume about an episode. Returns a list of problems
 * (empty = valid). Never throws, even on garbage input, so the loader can report every problem at once.
 */
export function validateEpisode(ep) {
  const problems = [];
  const need = (cond, msg) => { if (!cond) problems.push(msg); };
  if (!isObj(ep)) return ['episode is not an object'];

  // -- r5: identifier/reference length first; fail fast before any downstream work
  const tooLong = identifierLengthProblems(ep);
  if (tooLong.length) return tooLong;

  // -- identity + briefing
  need(isId(ep.id), 'id must be a safe identifier (letter followed by letters, digits, _ or -)');
  need(Number.isInteger(ep.version) && ep.version > 0, 'version must be a positive integer');
  need(isStr(ep.title), 'title must be a non-empty string');
  const b = ep.briefing;
  need(isObj(b) && isStr(b.heading) && isStrList(b.paragraphs) && isStr(b.clock) && isStr(b.clockNote),
    'briefing needs heading, paragraphs[], clock, clockNote');

  // -- evidence
  const evidence = Array.isArray(ep.evidence) ? ep.evidence : [];
  need(Array.isArray(ep.evidence), 'evidence must be an array');
  need(evidence.length >= 3 && evidence.length <= 5, `evidence count ${evidence.length} outside packet range 3–5`);
  const evidenceIds = evidence.map(e => e?.id);
  need(new Set(evidenceIds).size === evidenceIds.length, 'evidence ids must be unique');
  const hiddenIds = new Set();
  evidence.forEach((e, i) => {
    const at = `evidence[${i}]${isStr(e?.id) ? ` (${e.id})` : ''}`;
    need(isObj(e) && isId(e.id), `${at}: id must be a safe identifier`);
    if (!isObj(e)) return;
    for (const k of ['title', 'source', 'clock', 'summary']) need(isStr(e[k]), `${at}: ${k} must be a non-empty string`);
    need(isStrList(e.body), `${at}: body must be a non-empty string array`);
    need(e.hidden === undefined || typeof e.hidden === 'boolean', `${at}: hidden must be boolean if present`);
    if (e.hidden) hiddenIds.add(e.id);
  });
  need(evidence.some(e => isObj(e) && !e.hidden), 'at least one evidence item must be visible at start');
  const knownEvidence = id => evidenceIds.includes(id);

  // -- advisers: exactly the four Harness collaborators
  const order = Array.isArray(ep.advisorOrder) ? ep.advisorOrder : [];
  need(sameSet(order, REQUIRED_ADVISORS), `advisorOrder must be exactly ${REQUIRED_ADVISORS.join(', ')}`);
  need(isObj(ep.advisors) && sameSet(Object.keys(ep.advisors), REQUIRED_ADVISORS), 'advisors must have exactly the four required profiles');
  for (const id of REQUIRED_ADVISORS) {
    const a = ep.advisors?.[id];
    need(isObj(a) && ['name', 'verb', 'strength', 'weakness'].every(k => isStr(a[k])), `advisors.${id}: name, verb, strength, weakness required`);
    need(isLocalAssetPath(a?.icon), `advisors.${id}: icon must be a relative path to a local asset (assets/<folder>/<name>.svg|png|webp)`);
  }

  // -- advice: four blocks, unique ids, only known conditions, only known evidence
  need(isObj(ep.advice) && sameSet(Object.keys(ep.advice), REQUIRED_ADVISORS), 'advice must have exactly the four required blocks');
  const adviceIds = [];
  const revealable = new Set();
  let adviceOversized = false;
  for (const id of REQUIRED_ADVISORS) {
    const variants = ep.advice?.[id];
    if (!Array.isArray(variants) || !variants.length) { problems.push(`advice.${id}: must be a non-empty array`); continue; }
    if (variants.length > CONTENT_LIMITS.maxAdviceVariantsPerAdviser) {
      adviceOversized = true;
      problems.push(`advice.${id}: ${variants.length} variants exceeds the limit of ${CONTENT_LIMITS.maxAdviceVariantsPerAdviser} (CONTENT_LIMITS.maxAdviceVariantsPerAdviser) — merge or remove variants; content is not truncated`);
      continue; // fail fast: do not scan an oversized list
    }
    variants.forEach((v, i) => {
      const at = `advice.${id}[${i}]${isStr(v?.id) ? ` (${v.id})` : ''}`;
      if (!isObj(v)) { problems.push(`${at}: must be an object`); return; }
      need(isId(v.id), `${at}: id must be a safe identifier`);
      adviceIds.push(v.id);
      need(isStr(v.text), `${at}: text required`);
      need(v.when === undefined || isObj(v.when), `${at}: when must be an object if present`);
      const when = isObj(v.when) ? v.when : {};
      for (const k of Object.keys(when)) need(WHEN_KEYS.includes(k), `${at}: unknown condition "${k}" (engine would ignore it)`);
      if (when.inspected !== undefined) {
        need(Array.isArray(when.inspected) && when.inspected.length > 0, `${at}: when.inspected must be a non-empty array`);
        if (Array.isArray(when.inspected) && when.inspected.length > CONTENT_LIMITS.maxWhenInspected) {
          problems.push(`${at}: when.inspected has ${when.inspected.length} entries; the limit is ${CONTENT_LIMITS.maxWhenInspected} (CONTENT_LIMITS.maxWhenInspected) — list each required evidence id once`);
        } else {
          // Repeats never change meaning (every(includes)), so requiring uniqueness rejects no distinct condition.
          need(!Array.isArray(when.inspected) || new Set(when.inspected).size === when.inspected.length, `${at}: when.inspected must not repeat ids — list each required evidence id once`);
          for (const e of [].concat(when.inspected)) need(knownEvidence(e), `${at}: when.inspected references unknown evidence "${e}"`);
        }
      }
      need(when.hybridUnlocked === undefined || typeof when.hybridUnlocked === 'boolean', `${at}: when.hybridUnlocked must be boolean`);
      need(when.consultedFewerThan === undefined || (Number.isInteger(when.consultedFewerThan) && when.consultedFewerThan > 0 && when.consultedFewerThan < REQUIRED_ADVISORS.length),
        `${at}: when.consultedFewerThan must be an integer 1–${REQUIRED_ADVISORS.length - 1}`);
      if (v.reveals !== undefined) {
        need(Array.isArray(v.reveals) && v.reveals.length > 0, `${at}: reveals must be a non-empty array`);
        need(Array.isArray(v.reveals) && new Set(v.reveals).size === v.reveals.length, `${at}: reveals must not repeat ids`);
        for (const e of [].concat(v.reveals)) {
          need(knownEvidence(e), `${at}: reveals unknown evidence "${e}"`);
          need(!knownEvidence(e) || hiddenIds.has(e), `${at}: reveals "${e}", which is already visible`);
          revealable.add(e);
        }
      }
    });
    const last = variants.at(-1);
    need(isObj(last) && (last.when === undefined || (isObj(last.when) && Object.keys(last.when).length === 0)), `advice.${id}: last variant must be unconditional so selectAdvice() always returns one`);
  }
  need(new Set(adviceIds).size === adviceIds.length, 'advice ids must be unique across all advisers');
  // An oversized advice block was not scanned, so reachability cannot be judged; its own error stands.
  if (!adviceOversized) for (const h of hiddenIds) need(revealable.has(h), `hidden evidence "${h}" is never revealed by any advice (unreachable)`);

  // -- hybrid unlock
  const hu = ep.hybridUnlock;
  need(isObj(hu), 'hybridUnlock must be an object');
  const huList = Array.isArray(hu?.inspected) ? hu.inspected : [];
  need(huList.length > 0, 'hybridUnlock.inspected must be a non-empty array');
  need(new Set(huList).size === huList.length, 'hybridUnlock.inspected must not repeat ids');
  for (const e of huList) need(knownEvidence(e), `hybridUnlock.inspected references unknown evidence "${e}"`);
  need(isStr(hu?.lockedHint), 'hybridUnlock.lockedHint required');

  // -- decisions
  const decisions = Array.isArray(ep.decisions) ? ep.decisions : [];
  need(decisions.length >= 2, 'at least two decisions required');
  if (decisions.length > CONTENT_LIMITS.maxDecisions) {
    // Fail fast: every remaining check (postmortem, DOM ids, reachability) iterates the decision list.
    problems.push(`decisions: ${decisions.length} exceeds the limit of ${CONTENT_LIMITS.maxDecisions} (CONTENT_LIMITS.maxDecisions) — remove decisions; content is not truncated`);
    return problems;
  }
  const decisionIds = decisions.map(d => d?.id);
  need(new Set(decisionIds).size === decisionIds.length, 'decision ids must be unique');
  decisions.forEach((d, i) => {
    const at = `decisions[${i}]${isStr(d?.id) ? ` (${d.id})` : ''}`;
    if (!isObj(d)) { problems.push(`${at}: must be an object`); return; }
    for (const k of ['id', 'label', 'description', 'risk']) need(isStr(d[k]), `${at}: ${k} required`);
    need(isId(d.id), `${at}: id must be a safe identifier`);
    need(isObj(d.outcome) && isStr(d.outcome.heading) && isStr(d.outcome.text), `${at}: outcome needs heading + text`);
    need(d.requiresHybrid === undefined || typeof d.requiresHybrid === 'boolean', `${at}: requiresHybrid must be boolean`);
  });
  need(decisions.filter(d => d?.requiresHybrid === true).length === 1, 'exactly one decision must have requiresHybrid: true');
  need(decisions.some(d => isObj(d) && !d.requiresHybrid), 'at least one decision must be available without the hybrid unlock');

  // -- postmortem: one per decision, every adviser rated
  need(isObj(ep.postmortem) && sameSet(Object.keys(ep.postmortem), decisionIds), 'postmortem must have exactly one entry per decision id');
  for (const id of decisionIds) {
    const pm = ep.postmortem?.[id];
    need(isObj(pm) && isStrList(pm.unknown), `postmortem.${id}: unknown must be a non-empty string array`);
    need(isObj(pm?.advisors) && sameSet(Object.keys(pm.advisors), REQUIRED_ADVISORS), `postmortem.${id}: advisors must rate exactly the four advisers`);
    for (const a of REQUIRED_ADVISORS) {
      const r = pm?.advisors?.[a];
      need(isObj(r) && RATINGS.includes(r.rating) && isStr(r.text), `postmortem.${id}.advisors.${a}: rating (${RATINGS.join('/')}) + text required`);
    }
  }
  // -- generated DOM ids: safe syntax is not enough; prefixed ids must also be unique (evidence
  // 'body-e_monitor' would render ev-body-e_monitor, the body id of e_monitor). Same functions as app.js.
  const idsSafe = evidence.every(e => isObj(e) && isId(e.id)) && decisions.every(d => isObj(d) && isId(d.id));
  if (idsSafe) {
    for (const dup of duplicateDomIds({evidence, decisions, advisorOrder: REQUIRED_ADVISORS})) {
      problems.push(`generated DOM id collision: "${dup}" would appear more than once — rename the evidence/decision id that produces it`);
    }
  }

  // Structural checks must pass before executing the shared rules on content.
  if (!problems.length) {
    const reached = reachableEvidence(ep);
    for (const h of hiddenIds) need(reached.has(h), `hidden evidence "${h}" cannot be reached from the initial state`);
  }
  return problems;
}

/** Explore all discovery/inspection/consultation sets (at most 3^5 * 2^4 states).
 * Advice selection depends only on those sets, so repeat consultations and all
 * adviser orders are included without retaining presentation or trust state.
 */
function reachableEvidence(ep) {
  const initial = ep.evidence.reduce((mask, e, i) => e.hidden ? mask : mask | (1 << i), 0);
  const queue = [[initial, 0, 0]];
  const seen = new Set([`${initial}:0:0`]);
  const reached = new Set();
  const enqueue = (discovered, inspected, consulted) => {
    const key = `${discovered}:${inspected}:${consulted}`;
    if (!seen.has(key)) { seen.add(key); queue.push([discovered, inspected, consulted]); }
  };
  for (let at = 0; at < queue.length; at++) {
    const [discovered, inspected, consulted] = queue[at];
    const state = {
      inspectedSources: ep.evidence.filter((_, i) => inspected & (1 << i)).map(e => e.id),
      consultations: ep.advisorOrder.filter((_, i) => consulted & (1 << i)).map(advisorId => ({advisorId})),
    };
    ep.evidence.forEach((e, i) => {
      if (discovered & (1 << i)) {
        reached.add(e.id);
        enqueue(discovered, inspected | (1 << i), consulted);
      }
    });
    ep.advisorOrder.forEach((id, i) => {
      const advice = selectAdvice(state, ep, id);
      const revealed = (advice.reveals ?? []).reduce((mask, evidenceId) => mask | (1 << ep.evidence.findIndex(e => e.id === evidenceId)), discovered);
      enqueue(revealed, inspected, consulted | (1 << i));
    });
  }
  return reached;
}
