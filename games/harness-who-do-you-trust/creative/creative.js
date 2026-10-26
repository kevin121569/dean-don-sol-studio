// Creative C1 presentation layer: opening, audio controls and cues. It observes game actions and never changes
// game state, saves, scoring or validation. Missing elements or browser APIs make it a no-op, so the validated
// game runs identically without it (and inside the DOM-interface test harness).
import {createAudioDirector} from './audio.js';
import {createIntro, validateIntroScript} from './intro.js';

export const INTRO_SCRIPT_PATH = 'creative/intro-script.json';
const MUSIC_SCENES = new Set(['investigate', 'decide']);

/**
 * @param {{document, window, storage, episode, ACTIONS, isHybridUnlocked, getState: () => object,
 *          reducedMotion: () => boolean, settings: {read: () => object, write: (s: object) => void},
 *          say?: (text: string) => void, loadScript?: () => Promise<object>}} deps
 */
export function createCreativeLayer(deps) {
  const {document: doc, window: win, storage, episode, ACTIONS: A, isHybridUnlocked, getState, reducedMotion, settings, say} = deps;
  const audio = createAudioDirector({window: win, storage});
  let intro = null;
  const el = id => doc?.getElementById?.(id) ?? null;

  // ---- audio controls (header button → dialog with on/off and three volumes) -------------------------------
  const ui = {button: el('soundButton'), dialog: el('audioDialog'), enabled: el('soundEnabled'),
    voice: el('volVoice'), music: el('volMusic'), sfx: el('volSfx'), close: el('audioClose'), note: el('narrationNote')};
  function syncControls() {
    const p = audio.prefs;
    if (ui.button) { ui.button.textContent = p.enabled ? 'Sound: on' : 'Sound: off'; ui.button.setAttribute('aria-pressed', String(p.enabled)); }
    if (ui.enabled) ui.enabled.checked = p.enabled;
    for (const k of ['voice', 'music', 'sfx']) if (ui[k]) { ui[k].value = String(Math.round(p[k] * 100)); ui[k].disabled = !p.enabled; }
    if (ui.note) ui.note.textContent = audio.capabilities.speech
      ? 'Narration uses this device’s built-in voice. Subtitles are always shown.'
      : 'This device has no built-in voice, so narration appears as subtitles only.';
  }
  function setEnabled(on) {
    if (on) audio.unlock();                     // called from the click/change handler: a real user gesture
    audio.setPrefs({enabled: on});
    syncControls();
    audio.setMusic(on && MUSIC_SCENES.has(getState()?.sceneId));
    say?.(on ? 'Sound on.' : 'Sound off.');
  }
  ui.button?.addEventListener('click', () => { syncControls(); try { ui.dialog?.showModal(); } catch { ui.dialog?.setAttribute('open', ''); } });
  ui.close?.addEventListener('click', () => { try { ui.dialog?.close(); } catch { ui.dialog?.removeAttribute('open'); } });
  ui.enabled?.addEventListener('change', () => setEnabled(ui.enabled.checked));
  for (const k of ['voice', 'music', 'sfx']) ui[k]?.addEventListener('input', () => { audio.setPrefs({[k]: Number(ui[k].value) / 100}); if (k === 'sfx') audio.cue('evidence'); });
  syncControls();

  // ---- pause when the game is backgrounded (tab hidden, app switched, phone locked) -------------------------
  doc?.addEventListener?.('visibilitychange', () => (doc.visibilityState === 'hidden' ? audio.suspend() : audio.resume()));
  win?.addEventListener?.('pagehide', () => audio.suspend());

  // ---- opening ---------------------------------------------------------------------------------------------
  const loadScript = deps.loadScript ?? (async () => (await fetch(INTRO_SCRIPT_PATH)).json());
  async function prepareIntro() {
    try {
      const script = await loadScript();
      if (validateIntroScript(script).length) return null;
      intro = createIntro({document: doc, window: win, audio, script, reducedMotion,
        onClose: how => { settings.write({...settings.read(), introSeen: true}); say?.(how === 'finished' ? 'Opening finished. Start investigating whenever you are ready.' : 'Opening skipped. Start investigating whenever you are ready.'); doc?.getElementById?.('scene-title')?.focus?.(); }});
      el('introSkip')?.addEventListener('click', () => intro.close('skip'));
      el('introNext')?.addEventListener('click', () => intro.next());
      return intro;
    } catch { return null; }
  }

  return {
    audio,
    get intro() { return intro; },
    /** First launch shows the opening once; afterwards it is available from the briefing. */
    async boot() {
      await prepareIntro();
      if (intro?.available && settings.read().introSeen !== true && getState()?.sceneId === 'briefing') intro.open();
    },
    openIntro() { return intro?.open() ?? false; },
    /** Called by app.js after every committed, current dispatch. Presentation only. */
    onAction(action, prev, next) {
      if (action.type === A.RESET) { audio.stopSpeech(); audio.setMusic(false); return; }
      const investigating = prev.sceneId === 'investigate';
      if (action.type === A.OPEN_EVIDENCE && next !== prev) audio.cue('evidence');
      if (action.type === A.CONSULT && investigating && episode.advisorOrder.includes(action.advisorId)) audio.cue(`advisor-${action.advisorId}`);
      if (action.type === A.CONSULT_ALL && investigating) audio.cue('advisor-donsol');
      if (next.discoveredEvidence.length > prev.discoveredEvidence.length) audio.cue('reveal');
      if (!isHybridUnlocked(prev, episode) && isHybridUnlocked(next, episode)) audio.cue('unlock');
      if (prev.sceneId !== next.sceneId) {
        if (next.sceneId === 'decide') audio.cue('decide');
        if (next.sceneId === 'outcome') audio.cue('outcome');
        audio.setMusic(MUSIC_SCENES.has(next.sceneId));
      }
    },
  };
}
