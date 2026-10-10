// Optional audio for The Harness: Who Do You Trust? (Creative C1).
//
// Provenance: every sound and the music are SYNTHESIZED AT RUNTIME by this file with the Web Audio API.
// There are no recorded or third-party audio assets. Narration uses the device's built-in speech voice
// (window.speechSynthesis) when it exists and ships no audio file; subtitles are always shown either way.
//
// Rules: audio is never required to play and never the only carrier of information. Preferences live under
// their own storage key, separate from game saves. Sound is enabled by default, but an explicit Enter tap unlocks playback as required by WebView policies.

export const AUDIO_PREFS_KEY = 'harness-wdyt:audio';
export const DEFAULT_AUDIO_PREFS = Object.freeze({enabled: true, voice: 0.8, music: 0.65, sfx: 0.85});
export const CUES = Object.freeze(['evidence', 'reveal', 'unlock', 'decide', 'outcome',
  'advisor-boy', 'advisor-tooth', 'advisor-darth', 'advisor-donsol']);

const clamp01 = v => (typeof v === 'number' && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : null);

/** Any stored value → a complete, valid preference object. Unknown keys are dropped. */
export function normalizeAudioPrefs(raw) {
  const r = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  return {
    enabled: r.enabled !== false,
    voice: clamp01(r.voice) ?? DEFAULT_AUDIO_PREFS.voice,
    music: clamp01(r.music) ?? DEFAULT_AUDIO_PREFS.music,
    sfx: clamp01(r.sfx) ?? DEFAULT_AUDIO_PREFS.sfx,
  };
}
export function loadAudioPrefs(storage) {
  try { return normalizeAudioPrefs(JSON.parse(storage?.getItem(AUDIO_PREFS_KEY) ?? 'null')); }
  catch { return normalizeAudioPrefs(null); }
}
export function saveAudioPrefs(storage, prefs) {
  try { storage?.setItem(AUDIO_PREFS_KEY, JSON.stringify(normalizeAudioPrefs(prefs))); return true; }
  catch { return false; }
}

// A minor-pentatonic palette around A; investigation music stays low, sparse and unresolved.
const NOTE = {A2: 110, C3: 130.81, D3: 146.83, E3: 164.81, G3: 196, A3: 220, C4: 261.63, D4: 293.66, E4: 329.63, G4: 392, A4: 440, C5: 523.25, E5: 659.25};
const MOTIF = ['A3', 'C4', 'E4', 'D4', 'A3', 'G3', 'C4', 'E3'];

/**
 * @param {{window?: object, storage?: object}} deps  Injected so tests can run without a browser.
 */
export function createAudioDirector({window: win = globalThis, storage} = {}) {
  let prefs = loadAudioPrefs(storage);
  let ctx = null, buses = null, music = null, unlocked = false;
  const AC = win?.AudioContext ?? win?.webkitAudioContext ?? null;
  const speech = win?.speechSynthesis ?? null;
  const Utterance = win?.SpeechSynthesisUtterance ?? null;

  function ensureContext() {
    if (ctx || !AC) return ctx;
    try {
      ctx = new AC();
      const master = ctx.createGain();
      master.connect(ctx.destination);
      buses = {master, music: ctx.createGain(), sfx: ctx.createGain()};
      buses.music.connect(master);
      buses.sfx.connect(master);
      applyGains();
    } catch { ctx = null; buses = null; }
    return ctx;
  }
  function applyGains() {
    if (!buses) return;
    buses.master.gain.value = prefs.enabled ? 1 : 0;
    buses.music.gain.value = prefs.music * 0.75;
    buses.sfx.gain.value = prefs.sfx * 0.85;
  }
  const playing = () => prefs.enabled && unlocked && ctx && ctx.state !== 'closed';

  // One enveloped oscillator note. All sounds below are built from this.
  function tone(freq, start, dur, {type = 'sine', gain = 0.3, bus = 'sfx', attack = 0.01, glideTo} = {}) {
    const t = ctx.currentTime + start;
    const osc = ctx.createOscillator(), env = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t + dur);
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(gain, t + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(env).connect(buses[bus]);
    osc.start(t); osc.stop(t + dur + 0.05);
  }
  const SOUNDS = {
    evidence: () => { tone(NOTE.E4, 0, 0.18, {gain: 0.22}); tone(NOTE.A4, 0.09, 0.3, {gain: 0.18}); },
    reveal: () => [NOTE.A4, NOTE.C5, NOTE.E5].forEach((f, i) => tone(f, i * 0.07, 0.35, {type: 'triangle', gain: 0.16})),
    unlock: () => { tone(NOTE.A3, 0, 0.5, {gain: 0.18}); tone(NOTE.E4, 0.12, 0.6, {gain: 0.16}); },
    decide: () => { tone(55, 0, 1.6, {gain: 0.25, attack: 0.5}); tone(82.41, 0.1, 1.5, {gain: 0.14, attack: 0.5}); },
    // One reflective stinger for every outcome: the sound never grades the player's choice.
    outcome: () => { [NOTE.A3, NOTE.C4, NOTE.E4].forEach(f => tone(f, 0, 1.2, {type: 'triangle', gain: 0.12})); tone(NOTE.G4, 0.5, 1.4, {gain: 0.1}); },
    // Distinct adviser cues, one character per voice.
    'advisor-boy': () => [NOTE.E4, NOTE.G4, NOTE.A4].forEach((f, i) => tone(f, i * 0.06, 0.12, {type: 'triangle', gain: 0.16})),
    'advisor-tooth': () => { tone(1800, 0, 0.03, {type: 'square', gain: 0.06}); tone(1800, 0.08, 0.03, {type: 'square', gain: 0.06}); tone(NOTE.D3, 0.14, 0.25, {gain: 0.16}); },
    'advisor-darth': () => { tone(NOTE.A2, 0, 0.22, {type: 'sawtooth', gain: 0.08}); tone(NOTE.A2, 0.28, 0.22, {type: 'sawtooth', gain: 0.08}); }, // LUKE (internal id: darth)
    'advisor-donsol': () => [NOTE.C4, NOTE.E4, NOTE.G4].forEach(f => tone(f, 0, 0.6, {gain: 0.08, attack: 0.08})),
  };

  function startMusic() {
    if (music || !playing()) return;
    const drone = [NOTE.E3, NOTE.A3].map(f => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'triangle'; o.frequency.value = f; g.gain.value = 0.065;
      o.connect(g).connect(buses.music); o.start();
      return o;
    });
    let step = 0;
    const tick = () => {
      if (!music) return;
      if (ctx.state === 'running') tone(NOTE[MOTIF[step++ % MOTIF.length]], 0, 1.4, {type: 'triangle', gain: 0.15, bus: 'music', attack: 0.06});
      music.timer = win.setTimeout(tick, 1600 + (step % 3) * 400);
    };
    music = {drone, timer: null};
    tick();
  }
  function stopMusic() {
    if (!music) return;
    win.clearTimeout?.(music.timer);
    for (const o of music.drone) { try { o.stop(); } catch { /* already stopped */ } }
    music = null;
  }

  return {
    get prefs() { return {...prefs}; },
    capabilities: Object.freeze({webAudio: Boolean(AC), speech: Boolean(speech && Utterance)}),
    get unlocked() { return unlocked; },
    status() { if(!prefs.enabled) return 'Sound off. Tap to turn it on.';
      if(!AC) return 'Audio unavailable on this device: Web Audio is missing.';
      if(!ctx||!unlocked) return 'Sound ready. Tap Enter Server 4 to activate.';
      return `Audio engine: ${ctx.state}. ${ctx.state==='running'?'Music and effects enabled.':'Tap Test sound to retry.'}`;
    },
    /** Call ONLY from a user gesture (click / tap / key). */
    unlock() {
      if (!ensureContext()) return false;
      try { const result=ctx.resume?.(); result?.catch?.(()=>{}); } catch { /* resume is best effort */ }
      unlocked = true;
      return true;
    },
    setPrefs(patch) {
      prefs = normalizeAudioPrefs({...prefs, ...patch});
      saveAudioPrefs(storage, prefs);
      applyGains();
      if (!prefs.enabled) { stopMusic(); this.stopSpeech(); }
      return {...prefs};
    },
    cue(name) {
      if (!CUES.includes(name) || !playing()) return false;
      if(ctx.state==='suspended') { try { ctx.resume?.()?.catch?.(()=>{}); } catch {} }
      try { SOUNDS[name](); return true; } catch { return false; }
    },
    setMusic(on) { if (on) startMusic(); else stopMusic(); return Boolean(music); },
    get musicPlaying() { return Boolean(music); },
    /** Speak one subtitle line with the device voice. Returns false when narration is unavailable or off. */
    speak(text) {
      if (!prefs.enabled || !unlocked || prefs.voice === 0 || !speech || !Utterance) return false;
      try {
        speech.cancel();
        const u = new Utterance(text);
        u.volume = prefs.voice; u.rate = 0.95;
        speech.speak(u);
        return true;
      } catch { return false; }
    },
    stopSpeech() { try { speech?.cancel(); } catch { /* ignore */ } },
    /** Background the game: pause everything. */
    suspend() { this.stopSpeech(); try { ctx?.suspend?.(); } catch { /* ignore */ } },
    resume() { if (prefs.enabled && unlocked) { try { ctx?.resume?.(); } catch { /* ignore */ } } },
  };
}
