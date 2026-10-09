// Skippable cinematic opening for Episode 1 (Creative C1). Presentation only: it never reads or changes game state.
// Visuals are CSS + inline SVG in index.html (#introDialog); this module only advances beats, shows the matching
// subtitle (always), speaks it when narration is on, and closes. Under reduced motion nothing auto-advances and the
// stylesheet removes all animation: the player steps through with Next or skips.

export const INTRO_BEATS = Object.freeze(['grid', 'pulse', 'callout', 'question', 'stakes', 'world', 'boy', 'tooth', 'luke', 'donsol', 'mission', 'final']);
export const INTRO_LIMITS = Object.freeze({maxLines: 20, maxTextLength: 280, minDurationMs: 1500, maxDurationMs: 12000});

/** Validate the script before it can drive the UI. Returns a list of problems (empty = valid). */
export function validateIntroScript(script) {
  const problems = [];
  if (!script || typeof script !== 'object' || Array.isArray(script)) return ['intro script is not an object'];
  for (const k of ['id', 'title', 'kicker']) if (typeof script[k] !== 'string' || !script[k].trim() || script[k].length > 80) problems.push(`intro ${k} must be a non-empty string of at most 80 characters`);
  const lines = script.lines;
  if (!Array.isArray(lines) || !lines.length || lines.length > INTRO_LIMITS.maxLines) return [...problems, `intro lines must be an array of 1–${INTRO_LIMITS.maxLines}`];
  const ids = new Set();
  lines.forEach((l, i) => {
    const at = `intro line ${i}`;
    if (!l || typeof l !== 'object') { problems.push(`${at} must be an object`); return; }
    if (typeof l.id !== 'string' || !/^[a-z][a-z0-9_-]{0,31}$/.test(l.id) || ids.has(l.id)) problems.push(`${at}: id must be a unique short identifier`);
    ids.add(l.id);
    if (!INTRO_BEATS.includes(l.beat)) problems.push(`${at}: unknown beat`);
    if (typeof l.text !== 'string' || !l.text.trim() || l.text.length > INTRO_LIMITS.maxTextLength) problems.push(`${at}: text (the subtitle) must be 1–${INTRO_LIMITS.maxTextLength} characters`);
    if (!Number.isInteger(l.durationMs) || l.durationMs < INTRO_LIMITS.minDurationMs || l.durationMs > INTRO_LIMITS.maxDurationMs) problems.push(`${at}: durationMs out of range`);
  });
  return problems;
}

/**
 * @param {{document, window, audio, script, reducedMotion: () => boolean, onClose?: (how: string) => void}} deps
 * Returns a no-op controller when the page has no intro markup (e.g. the DOM-interface test harness).
 */
export function createIntro({document: doc, window: win, audio, script, reducedMotion, onClose}) {
  const dialog = doc?.getElementById?.('introDialog');
  const subtitle = doc?.getElementById?.('introSubtitle');
  if (!dialog || !subtitle || !script || validateIntroScript(script).length) {
    return {available: false, open() { return false; }, close() {}, next() {}, get index() { return -1; }, get isOpen() { return false; }};
  }
  const progress = doc.getElementById('introProgress');
  const nextBtn = doc.getElementById('introNext');
  let index = -1, timer = null, isOpen = false;

  const clearTimer = () => { if (timer !== null) { win.clearTimeout(timer); timer = null; } };
  function show(i) {
    clearTimer();
    index = i;
    const line = script.lines[i];
    dialog.dataset.beat = line.beat;
    subtitle.textContent = line.text;                    // subtitles are always shown
    if (progress) progress.textContent = `${i + 1} / ${script.lines.length}`;
    const last = i === script.lines.length - 1;
    if (nextBtn) nextBtn.textContent = last ? 'Begin investigation' : 'Next';
    audio?.speak(line.text);                             // no-op unless sound + voice are on
    if (!reducedMotion() && !last) timer = win.setTimeout(() => show(i + 1), line.durationMs);
  }
  function close(how = 'skip') {
    if (!isOpen) return;
    isOpen = false;
    clearTimer();
    audio?.stopSpeech();
    try { dialog.close(); } catch { dialog.removeAttribute('open'); }
    onClose?.(how);
  }
  const controller = {
    available: true,
    open() {
      if (isOpen) return true;
      isOpen = true;
      try { dialog.showModal(); } catch { dialog.setAttribute('open', ''); }
      show(0);
      doc.getElementById('introSkip')?.focus();
      return true;
    },
    close,
    next() { if (!isOpen) return; if (index >= script.lines.length - 1) close('finished'); else show(index + 1); },
    get index() { return index; },
    get isOpen() { return isOpen; },
  };
  // Native <dialog> Escape → treat as Skip (no reliance on the async 'close' event).
  dialog.addEventListener('cancel', e => { e.preventDefault(); close('skip'); });
  return controller;
}
