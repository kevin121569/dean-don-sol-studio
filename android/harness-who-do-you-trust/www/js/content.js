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
 * Content values echoed in error messages are capped, so an error never reproduces megabytes of content.
 * The value itself is never altered: this affects only the message text.
 */
const show = v => typeof v === 'string'
  ? (v.length <= MAX_IDENTIFIER_LENGTH ? v : `${v.slice(0, 16)}…(${v.length} characters)`)
  : `<${Array.isArray(v) ? 'array' : v === null ? 'null' : typeof v}>`;
// "advice.boy[0] (boy_find)" — the id suffix only when it is a short string, so labels stay bounded.
// r7: the length test comes FIRST, so trim() (a whole-string scan) only ever runs on ≤ 64 characters.
const label = (base, id) => `${base}${typeof id === 'string' && id.length <= MAX_IDENTIFIER_LENGTH && id.trim() ? ` (${id})` : ''}`;
const listShape = (value, field, max, overMessage) => {
  if (!Array.isArray(value) || value.length === 0) return `${field} must be a non-empty array`;
  if (value.length > max) return overMessage(value.length);
  return null;
};

/**
 * r6 stage 2: container types and cardinality ONLY. Reads .length and container types; never traverses an
 * element's contents beyond classifying it as an object. It visits only fixed-size structures (4 advisers) or
 * lists it has just proven bounded, so every later stage runs on bounded collections. `postmortem` keys are
 * read only after the decision count is known to be within its limit (one Object.keys; JavaScript has no
 * cheaper own-key count, and its cost is of the same order as the JSON.parse that created those keys).
 * Error wording matches the existing rules it moved from, so existing messages are unchanged.
 */
function shapeProblems(ep) {
  const out = [];
  const shapeOf = {postmortemKeys: []};
  // -- evidence
  if (!Array.isArray(ep.evidence)) out.push('evidence must be an array');
  else if (ep.evidence.length < 3 || ep.evidence.length > MAX_EVIDENCE) out.push(`evidence count ${ep.evidence.length} outside packet range 3–5`);
  // -- advisers (fixed set of 4)
  if (!Array.isArray(ep.advisorOrder) || ep.advisorOrder.length !== REQUIRED_ADVISORS.length) out.push(`advisorOrder must be exactly ${REQUIRED_ADVISORS.join(', ')}`);
  if (!isObj(ep.advisors) || Object.keys(ep.advisors).length !== REQUIRED_ADVISORS.length) out.push('advisors must have exactly the four required profiles');
  // -- advice: 4 blocks; each a bounded list of variants; each variant's lists bounded
  // r7: count AND membership. Stage 3 reads ep.advice[a] for every required adviser, so stage 2 must prove
  // each one present; four keys alone is not enough (e.g. `boy` replaced by an unexpected `other`).
  const adviceKeysOk = isObj(ep.advice) && Object.keys(ep.advice).length === REQUIRED_ADVISORS.length
    && REQUIRED_ADVISORS.every(a => Object.hasOwn(ep.advice, a));
  if (!adviceKeysOk) out.push('advice must have exactly the four required blocks');
  if (isObj(ep.advice)) {
    for (const a of REQUIRED_ADVISORS) {
      if (!Object.hasOwn(ep.advice, a)) { out.push(`advice.${a}: required block is missing — the advice blocks must be exactly ${REQUIRED_ADVISORS.join(', ')}`); continue; }
      const variants = ep.advice[a];
      if (!Array.isArray(variants) || !variants.length) { out.push(`advice.${a}: must be a non-empty array`); continue; }
      if (variants.length > CONTENT_LIMITS.maxAdviceVariantsPerAdviser) {
        out.push(`advice.${a}: ${variants.length} variants exceeds the limit of ${CONTENT_LIMITS.maxAdviceVariantsPerAdviser} (CONTENT_LIMITS.maxAdviceVariantsPerAdviser) — merge or remove variants; content is not truncated`);
        continue; // never traverse an oversized list
      }
      variants.forEach((v, i) => {
        if (!isObj(v)) return; // judged by the semantic stage ("must be an object")
        const at = label(`advice.${a}[${i}]`, v.id);
        if (v.when !== undefined && !isObj(v.when)) { out.push(`${at}: when must be an object if present`); return; }
        if (v.when?.inspected !== undefined) {
          const bad = listShape(v.when.inspected, `${at}: when.inspected`, CONTENT_LIMITS.maxWhenInspected,
            n => `${at}: when.inspected has ${n} entries; the limit is ${CONTENT_LIMITS.maxWhenInspected} (CONTENT_LIMITS.maxWhenInspected) — list each required evidence id once`);
          if (bad) out.push(bad);
        }
        if (v.reveals !== undefined) {
          const bad = listShape(v.reveals, `${at}: reveals`, MAX_EVIDENCE,
            n => `${at}: reveals has ${n} entries; the limit is ${MAX_EVIDENCE} (the evidence maximum) — list each revealed evidence id once`);
          if (bad) out.push(bad);
        }
      });
    }
  }
  // -- hybrid unlock
  if (!isObj(ep.hybridUnlock)) out.push('hybridUnlock must be an object');
  else {
    const bad = listShape(ep.hybridUnlock.inspected, 'hybridUnlock.inspected', MAX_EVIDENCE,
      n => `hybridUnlock.inspected has ${n} entries; the limit is ${MAX_EVIDENCE} (the evidence maximum) — list each required evidence id once`);
    if (bad) out.push(bad);
  }
  // -- decisions, then postmortem ONLY once the decision count is known to be bounded
  const decisionsBounded = Array.isArray(ep.decisions) && ep.decisions.length <= CONTENT_LIMITS.maxDecisions;
  if (!Array.isArray(ep.decisions) || ep.decisions.length < 2) out.push('at least two decisions required');
  else if (ep.decisions.length > CONTENT_LIMITS.maxDecisions) {
    out.push(`decisions: ${ep.decisions.length} exceeds the limit of ${CONTENT_LIMITS.maxDecisions} (CONTENT_LIMITS.maxDecisions) — remove decisions; content is not truncated`);
  }
  if (decisionsBounded) {
    if (!isObj(ep.postmortem)) out.push('postmortem must have exactly one entry per decision id');
    else {
      const keys = Object.keys(ep.postmortem);
      if (keys.length > CONTENT_LIMITS.maxDecisions) {
        out.push(`postmortem has ${keys.length} entries; the limit is ${CONTENT_LIMITS.maxDecisions} (CONTENT_LIMITS.maxDecisions, one per decision) — remove the extra entries`);
      } else shapeOf.postmortemKeys = keys;
    }
  }
  return {problems: out, postmortemKeys: shapeOf.postmortemKeys};
}

/**
 * r5 identifier pass (r6: stage 3). Runs after stage 2 has proven every collection it visits is an array of
 * bounded size, so there is no capping here. Visits every free-form identifier (episode, evidence, advice
 * variant, decision ids) and every reference to one (when.inspected, reveals, hybridUnlock.inspected,
 * postmortem keys); an over-long identifier costs one .length read. Non-strings and empty strings are left
 * to the safe-identifier and reference rules of stage 4. Nothing is truncated or normalized.
 */
function identifierLengthProblems(ep, postmortemKeys) {
  const max = MAX_IDENTIFIER_LENGTH;
  const out = [];
  const check = (value, field, kind) => {
    if (typeof value === 'string' && value.length > max) {
      out.push(`${field}: ${kind} is ${value.length} characters; the limit is ${max} (MAX_IDENTIFIER_LENGTH) — shorten it; identifiers are never truncated`);
    }
  };
  check(ep.id, 'id', 'identifier');
  ep.evidence.forEach((e, i) => check(e?.id, `evidence[${i}].id`, 'identifier'));
  for (const a of REQUIRED_ADVISORS) {
    ep.advice[a].forEach((v, i) => {
      if (!isObj(v)) return;
      check(v.id, `advice.${a}[${i}].id`, 'identifier');
      (v.when?.inspected ?? []).forEach((r, j) => check(r, `advice.${a}[${i}].when.inspected[${j}]`, 'reference'));
      (v.reveals ?? []).forEach((r, j) => check(r, `advice.${a}[${i}].reveals[${j}]`, 'reference'));
    });
  }
  ep.hybridUnlock.inspected.forEach((r, j) => check(r, `hybridUnlock.inspected[${j}]`, 'reference'));
  ep.decisions.forEach((d, i) => check(d?.id, `decisions[${i}].id`, 'identifier'));
  postmortemKeys.forEach(k => check(k, `postmortem key "${k.slice(0, 16)}…"`, 'reference'));
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
  // Stage 1: the episode is an object.
  if (!isObj(ep)) return ['episode is not an object'];

  // Stage 2 (r6): container types and cardinality only — no content traversal of unproven collections.
  const shape = shapeProblems(ep);
  if (shape.problems.length) return shape.problems;

  // Stage 3 (r5): identifier/reference length over collections now proven bounded.
  const tooLong = identifierLengthProblems(ep, shape.postmortemKeys);
  if (tooLong.length) return tooLong;

  // Stage 4: semantic, reference, DOM-id and reachability validation (unchanged rules) on bounded content.
  // -- identity + briefing
  need(isId(ep.id), 'id must be a safe identifier (letter followed by letters, digits, _ or -)');
  need(Number.isInteger(ep.version) && ep.version > 0, 'version must be a positive integer');
  need(isStr(ep.title), 'title must be a non-empty string');
  const b = ep.briefing;
  need(isObj(b) && isStr(b.heading) && isStrList(b.paragraphs) && isStr(b.clock) && isStr(b.clockNote),
    'briefing needs heading, paragraphs[], clock, clockNote');

  // -- evidence (stage 2 proved: an array of 3–5)
  const evidence = ep.evidence;
  const evidenceIds = evidence.map(e => e?.id);
  need(new Set(evidenceIds).size === evidenceIds.length, 'evidence ids must be unique');
  const hiddenIds = new Set();
  evidence.forEach((e, i) => {
    const at = label(`evidence[${i}]`, e?.id);
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
  // (stage 2 proved: advisorOrder has 4 entries; advisors and advice are objects with 4 keys)
  need(sameSet(ep.advisorOrder, REQUIRED_ADVISORS), `advisorOrder must be exactly ${REQUIRED_ADVISORS.join(', ')}`);
  need(sameSet(Object.keys(ep.advisors), REQUIRED_ADVISORS), 'advisors must have exactly the four required profiles');
  for (const id of REQUIRED_ADVISORS) {
    const a = ep.advisors?.[id];
    need(isObj(a) && ['name', 'verb', 'strength', 'weakness'].every(k => isStr(a[k])), `advisors.${id}: name, verb, strength, weakness required`);
    need(isLocalAssetPath(a?.icon), `advisors.${id}: icon must be a relative path to a local asset (assets/<folder>/<name>.svg|png|webp)`);
  }

  // -- advice: four blocks, unique ids, only known conditions, only known evidence
  need(sameSet(Object.keys(ep.advice), REQUIRED_ADVISORS), 'advice must have exactly the four required blocks');
  const adviceIds = [];
  const revealable = new Set();
  for (const id of REQUIRED_ADVISORS) {
    const variants = ep.advice[id]; // stage 2 proved: a non-empty array of at most 8
    variants.forEach((v, i) => {
      const at = label(`advice.${id}[${i}]`, v?.id);
      if (!isObj(v)) { problems.push(`${at}: must be an object`); return; }
      need(isId(v.id), `${at}: id must be a safe identifier`);
      adviceIds.push(v.id);
      need(isStr(v.text), `${at}: text required`);
      const when = v.when ?? {}; // stage 2 proved: an object if present
      for (const k of Object.keys(when)) need(WHEN_KEYS.includes(k), `${at}: unknown condition "${show(k)}" (engine would ignore it)`);
      if (when.inspected !== undefined) { // stage 2 proved: a non-empty array of at most 5
        // Repeats never change meaning (every(includes)), so requiring uniqueness rejects no distinct condition.
        need(new Set(when.inspected).size === when.inspected.length, `${at}: when.inspected must not repeat ids — list each required evidence id once`);
        for (const e of when.inspected) need(knownEvidence(e), `${at}: when.inspected references unknown evidence "${show(e)}"`);
      }
      need(when.hybridUnlocked === undefined || typeof when.hybridUnlocked === 'boolean', `${at}: when.hybridUnlocked must be boolean`);
      need(when.consultedFewerThan === undefined || (Number.isInteger(when.consultedFewerThan) && when.consultedFewerThan > 0 && when.consultedFewerThan < REQUIRED_ADVISORS.length),
        `${at}: when.consultedFewerThan must be an integer 1–${REQUIRED_ADVISORS.length - 1}`);
      if (v.reveals !== undefined) { // stage 2 proved: a non-empty array of at most 5
        need(new Set(v.reveals).size === v.reveals.length, `${at}: reveals must not repeat ids`);
        for (const e of v.reveals) {
          need(knownEvidence(e), `${at}: reveals unknown evidence "${show(e)}"`);
          need(!knownEvidence(e) || hiddenIds.has(e), `${at}: reveals "${show(e)}", which is already visible`);
          revealable.add(e);
        }
      }
    });
    const last = variants.at(-1);
    need(isObj(last) && (last.when === undefined || (isObj(last.when) && Object.keys(last.when).length === 0)), `advice.${id}: last variant must be unconditional so selectAdvice() always returns one`);
  }
  need(new Set(adviceIds).size === adviceIds.length, 'advice ids must be unique across all advisers');
  for (const h of hiddenIds) need(revealable.has(h), `hidden evidence "${h}" is never revealed by any advice (unreachable)`);

  // -- hybrid unlock (stage 2 proved: an object whose inspected is a non-empty array of at most 5)
  const hu = ep.hybridUnlock;
  const huList = hu.inspected;
  need(new Set(huList).size === huList.length, 'hybridUnlock.inspected must not repeat ids');
  for (const e of huList) need(knownEvidence(e), `hybridUnlock.inspected references unknown evidence "${show(e)}"`);
  need(isStr(hu?.lockedHint), 'hybridUnlock.lockedHint required');

  // -- decisions (stage 2 proved: an array of 2–8)
  const decisions = ep.decisions;
  const decisionIds = decisions.map(d => d?.id);
  need(new Set(decisionIds).size === decisionIds.length, 'decision ids must be unique');
  decisions.forEach((d, i) => {
    const at = label(`decisions[${i}]`, d?.id);
    if (!isObj(d)) { problems.push(`${at}: must be an object`); return; }
    for (const k of ['id', 'label', 'description', 'risk']) need(isStr(d[k]), `${at}: ${k} required`);
    need(isId(d.id), `${at}: id must be a safe identifier`);
    need(isObj(d.outcome) && isStr(d.outcome.heading) && isStr(d.outcome.text), `${at}: outcome needs heading + text`);
    need(d.requiresHybrid === undefined || typeof d.requiresHybrid === 'boolean', `${at}: requiresHybrid must be boolean`);
  });
  need(decisions.filter(d => d?.requiresHybrid === true).length === 1, 'exactly one decision must have requiresHybrid: true');
  need(decisions.some(d => isObj(d) && !d.requiresHybrid), 'at least one decision must be available without the hybrid unlock');

  // -- postmortem: one per decision, every adviser rated
  // (stage 2 proved: an object with at most 8 keys, which it already enumerated once)
  need(sameSet(shape.postmortemKeys, decisionIds), 'postmortem must have exactly one entry per decision id');
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
