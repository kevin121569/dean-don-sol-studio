// Creative C1: LUKE display name, cinematic opening, optional audio, plain-English copy, safe areas.
// Proves the creative layer changes presentation only: engine/rules/validation untouched, episode structure identical
// to the approved r7 baseline, internal `darth` identifiers preserved.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateEpisode} from '../js/content.js';
import {reduce, ACTIONS as A, isHybridUnlocked} from '../js/engine.js';
import {createInitialState, restoreState, createStore} from '../js/state.js';
import {AUDIO_PREFS_KEY, DEFAULT_AUDIO_PREFS, CUES, normalizeAudioPrefs, loadAudioPrefs, saveAudioPrefs, createAudioDirector} from '../creative/audio.js';
import {validateIntroScript, createIntro, INTRO_BEATS} from '../creative/intro.js';
import {createCreativeLayer} from '../creative/creative.js';
import {makeUI} from './ui-harness.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const episode = JSON.parse(read('data/episode-001.json'));
const script = JSON.parse(read('creative/intro-script.json'));
const html = read('index.html');
const css = read('css/game.css');
const clone = v => structuredClone(v);
const visibleText = markup => markup.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
const SPOILER = /clock|six minutes|6 minutes|2:0[5-9]|drift|runs? fast|ahead of|timestamp/i;

// =============================================================================================================
// Engineering protection
// =============================================================================================================
test('C1 core rule modules are byte-identical to approved r7 (no engine, validation, restore or telemetry change)', () => {
  const pinned = {
    'js/engine.js': '7d543aa191870bd7c6ea978bdbb7df5f23bb2aec735ab35cde5cd77977c7734d',
    'js/state.js': 'ce323ada229fa874f4e5559cc3345406e631a708dc1da341fe946cd84b97a670',
    'js/content.js': 'ff68de6b9c5d61527ed5681b74fde2308ecfd585c1c2bab847ffa85b67dde26b',
    'js/advice.js': 'e9afc25309491640ce4ab217467adc94d9edc56cebb6726425b1a13ea85515cd',
    'js/telemetry.js': '84c379e934b610ee47dcb08c8280173526de405c8f5386d717cade36822a8164',
  };
  for (const [file, hash] of Object.entries(pinned)) {
    assert.equal(crypto.createHash('sha256').update(read(file).replace(/\r\n/g, '\n')).digest('hex'), hash, file);
  }
});

test('C1 episode structure is identical to the r7 baseline: ids, conditions, reveals, ratings, decisions unchanged', () => {
  const {structure: baseline} = JSON.parse(read('tests/fixtures/episode-001-structure.json'));
  const STRUCT = /(^|\.)(id|icon|hidden|requiresHybrid|rating|version|consultedFewerThan|hybridUnlocked)$|\.(inspected|reveals|advisorOrder)(\[\d+\])?$/;
  const strip = (v, p) => p === '.briefing' ? '<briefing text>' : Array.isArray(v) ? v.map((x, i) => strip(x, `${p}[${i}]`))
    : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, strip(x, `${p}.${k}`)]))
      : typeof v === 'string' && !STRUCT.test(p) ? '<text>' : v;
  assert.deepEqual(strip(episode, ''), baseline);
  assert.deepEqual(validateEpisode(episode), []);
});

// =============================================================================================================
// 1. DARTH → LUKE (player-facing only; internal ids preserved)
// =============================================================================================================
test('C1 LUKE: the adviser displays as LUKE everywhere players see it; no visible DARTH remains', () => {
  assert.equal(episode.advisors.darth.name, 'LUKE');
  // Every player-visible string in the episode (keys, ids and asset paths are internal).
  const visible = [];
  const walk = (v, key) => { if (typeof v === 'string') { if (!['id', 'icon', 'until'].includes(key)) visible.push(v); }
    else if (Array.isArray(v)) v.forEach(x => walk(x, key)); else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) if (!['advisorOrder', 'inspected', 'reveals'].includes(k)) walk(x, k); };
  walk(episode, '');
  assert(visible.length > 80);
  for (const s of visible) assert(!/darth/i.test(s), `visible episode text mentions Darth: ${s}`);
  assert(visible.some(s => /\bLUKE\b/.test(s)), 'LUKE appears in dialogue');
  assert(!/darth/i.test(visibleText(html)), 'index.html visible text');
  assert(/\bLUKE\b/.test(visibleText(html)));
  for (const l of script.lines) assert(!/darth/i.test(l.text));
  assert(script.lines.some(l => /\bLUKE\b/.test(l.text)));
  assert.match(read('assets/characters/darth.svg'), /aria-label="LUKE: worst-case thinker"/);
});

test('C1 LUKE: internal darth identifiers, files, advice keys and save structure are preserved', () => {
  assert.deepEqual(episode.advisorOrder, ['boy', 'tooth', 'darth', 'donsol']);
  assert(Object.hasOwn(episode.advisors, 'darth') && Object.hasOwn(episode.advice, 'darth'));
  assert.deepEqual(episode.advice.darth.map(v => v.id), ['darth_staged', 'darth_worst']);
  assert.equal(episode.advisors.darth.icon, 'assets/characters/darth.svg');
  assert(fs.existsSync(path.join(root, 'assets/characters/darth.svg')));
  // A save written with the darth key (as any existing player's save is) restores unchanged.
  let s = reduce(createInitialState(episode), {type: A.START}, episode);
  s = reduce(s, {type: A.CONSULT, advisorId: 'darth'}, episode);
  s = reduce(s, {type: A.SET_TRUST, advisorId: 'darth', value: -1}, episode);
  assert.deepEqual(s.consultations, [{advisorId: 'darth', adviceId: 'darth_worst'}]);
  assert.equal(s.trustWeights.darth, -1);
  assert.deepEqual(restoreState(clone(s), episode), s);
});

test('C1 LUKE: every rendered scene and every announcement says LUKE, never DARTH', async () => {
  const ui = makeUI(episode); await ui.app.boot();
  const scenes = [ui.html()];
  ui.app.dispatch({type: A.START});
  for (const id of ['e_monitor', 'e_controller']) ui.click('toggleEvidence', id);
  ui.app.dispatch({type: A.CONSULT, advisorId: 'darth'}); ui.flush();
  assert.match(ui.live(), /^LUKE: /);
  ui.app.dispatch({type: A.CONSULT_ALL}); ui.click('toggleEvidence', 'e_clocksync');
  scenes.push(ui.html());
  ui.app.dispatch({type: A.GO_TO_DECISION}); scenes.push(ui.html());
  ui.app.dispatch({type: A.SUBMIT_DECISION, decisionId: 'd_hybrid'}); scenes.push(ui.html());
  ui.app.dispatch({type: A.VIEW_POSTMORTEM}); scenes.push(ui.html());
  for (const markup of scenes) assert(!/darth/i.test(visibleText(markup)), visibleText(markup).slice(0, 200));
  assert(scenes.some(m => /\bLUKE\b/.test(visibleText(m))));
  assert.equal(ui.app.getState().sceneId, 'postmortem');
});

// =============================================================================================================
// 4. Plain English without spoilers
// =============================================================================================================
test('C1 no spoiler: nothing shown before discovery hints at the hidden clock discrepancy', () => {
  const beforeDiscovery = [
    ...episode.briefing.paragraphs, episode.briefing.heading, episode.briefing.clock, episode.briefing.clockNote,
    episode.hybridUnlock.lockedHint,
    ...episode.decisions.flatMap(d => [d.label, d.description]), // visible on the decide screen, even while locked
    ...script.lines.map(l => l.text),
    visibleText(html),
  ];
  for (const s of beforeDiscovery) assert(!SPOILER.test(s), `pre-discovery text hints at the clock twist: ${s}`);
});

test('C1 plain English: the opening and briefing explain the crisis, the stakes, the helpers and the goal', () => {
  const opening = script.lines.map(l => l.text).join(' ');
  for (const must of [/Server 4/, /Open Forge/, /shut (it )?down/i, /erase/i, /no undo/i, /\bBOY\b/, /\bTOOTH\b/, /\bLUKE\b/, /DON SOL/, /open it/i, /ask/i, /trust/i, /no live countdown/i]) {
    assert.match(opening, must);
  }
  // The emerging "Signal War" is framed as unconfirmed, never as fact for Episode 1.
  assert.match(opening, /Nobody knows yet whether tonight is part of it/);
  assert.match(opening, /Threat unconfirmed/i);
});

// =============================================================================================================
// 3. Audio: default enabled but waiting for an explicit start gesture, separate preferences
// =============================================================================================================
const memory = () => { const m = new Map(); return {getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), removeItem: k => m.delete(k), m}; };

test('C2 audio prefs: sound enabled by default, mute respected, preferences separate from saves', () => {
  const store = memory();
  assert.deepEqual(loadAudioPrefs(store), {...DEFAULT_AUDIO_PREFS});
  assert.equal(DEFAULT_AUDIO_PREFS.enabled, true);
  assert.deepEqual(normalizeAudioPrefs({enabled: 'yes', voice: 7, music: -1, sfx: 'x', extra: 1}), {enabled: true, voice: 1, music: 0, sfx: DEFAULT_AUDIO_PREFS.sfx});
  assert(saveAudioPrefs(store, {enabled: true, voice: 0.5, music: 0.2, sfx: 0.9}));
  assert.deepEqual(loadAudioPrefs(store), {enabled: true, voice: 0.5, music: 0.2, sfx: 0.9});
  // Separate from the game save and the motion/intro settings key.
  const gameStore = createStore(episode, store);
  assert.notEqual(AUDIO_PREFS_KEY, gameStore.key);
  assert.notEqual(AUDIO_PREFS_KEY, 'harness-wdyt:settings');
  gameStore.save(createInitialState(episode));
  assert(!/voice|music|sfx/.test(store.getItem(gameStore.key)));
  // Broken storage never throws and falls back to default-enabled preferences.
  const broken = {getItem() { throw new Error('denied'); }, setItem() { throw new Error('quota'); }};
  assert.deepEqual(loadAudioPrefs(broken), {...DEFAULT_AUDIO_PREFS});
  assert.equal(saveAudioPrefs(broken, {enabled: true}), false);
});

/** Minimal Web Audio + speech fakes that record what happens. */
function fakeAudioWindow() {
  const log = {contexts: 0, oscillators: 0, resumed: 0, suspended: 0, spoken: [], cancelled: 0};
  class Param { setValueAtTime() {} exponentialRampToValueAtTime() {} set value(v) { this.v = v; } get value() { return this.v; } }
  class Node { connect(n) { return n; } }
  class Ctx {
    constructor() { log.contexts++; this.state = 'running'; this.currentTime = 0; this.destination = new Node(); }
    createGain() { const g = new Node(); g.gain = new Param(); return g; }
    createOscillator() { log.oscillators++; const o = new Node(); o.frequency = new Param(); o.start = () => {}; o.stop = () => {}; return o; }
    resume() { log.resumed++; this.state = 'running'; }
    suspend() { log.suspended++; this.state = 'suspended'; }
  }
  const timers = [];
  return {log, timers, win: {
    AudioContext: Ctx,
    speechSynthesis: {speak: u => log.spoken.push(u.text), cancel: () => { log.cancelled++; }},
    SpeechSynthesisUtterance: class { constructor(t) { this.text = t; } },
    setTimeout: (fn, ms) => { timers.push({fn, ms}); return timers.length; }, clearTimeout: () => {},
  }};
}

test('C2 audio: no context or sound before player taps Enter even though sound defaults ON', () => {
  const {log, win} = fakeAudioWindow();
  const audio = createAudioDirector({window: win, storage: memory()});
  assert.equal(log.contexts, 0, 'no AudioContext at load');
  for (const c of CUES) assert.equal(audio.cue(c), false, c);
  assert.equal(audio.speak('hello'), false);
  assert.equal(audio.setMusic(true), false);
  assert.equal(log.contexts, 0);
  // Player taps Enter (a user gesture): unlock the already enabled sound.
  assert(audio.unlock());
  assert.equal(log.contexts, 1);
  assert(audio.cue('evidence') && audio.cue('advisor-darth') && audio.cue('outcome'));
  assert(audio.setMusic(true) && audio.musicPlaying);
  assert(audio.speak('Signal detected.')); assert.deepEqual(log.spoken, ['Signal detected.']);
  // Turning it off stops music and narration at once.
  audio.setPrefs({enabled: false});
  assert.equal(audio.musicPlaying, false);
  assert(log.cancelled > 0);
  assert.equal(audio.cue('evidence'), false);
});

test('C1 audio: separate voice/music/effects levels; background pauses; voice 0 silences narration only', () => {
  const {log, win} = fakeAudioWindow();
  const store = memory();
  const audio = createAudioDirector({window: win, storage: store});
  audio.unlock(); audio.setPrefs({enabled: true, voice: 0, music: 0.6, sfx: 0.2});
  assert.equal(audio.speak('x'), false, 'voice at 0 → no narration');
  assert(audio.cue('reveal'), 'effects still play');
  assert.deepEqual(loadAudioPrefs(store), {enabled: true, voice: 0, music: 0.6, sfx: 0.2});
  audio.suspend(); assert.equal(log.suspended, 1); assert(log.cancelled > 0);
  audio.resume(); assert(log.resumed >= 2);
  assert.deepEqual([...CUES].filter(c => c.startsWith('advisor-')), ['advisor-boy', 'advisor-tooth', 'advisor-darth', 'advisor-donsol']);
  assert(['evidence', 'reveal', 'unlock', 'decide', 'outcome'].every(c => CUES.includes(c)));
});

test('C1 audio: without Web Audio or speech (e.g. some Android WebViews) everything is a safe no-op', () => {
  const audio = createAudioDirector({window: {}, storage: memory()});
  assert.deepEqual(audio.capabilities, {webAudio: false, speech: false});
  assert.equal(audio.unlock(), false);
  audio.setPrefs({enabled: true});
  assert.equal(audio.cue('evidence'), false);
  assert.equal(audio.speak('x'), false);
  assert.doesNotThrow(() => { audio.suspend(); audio.resume(); audio.setMusic(true); });
});

// =============================================================================================================
// 2. Opening: subtitles, skip, reduced motion, cast and mission
// =============================================================================================================
test('C1 opening script: valid, every narration line has a matching subtitle, all beats known', () => {
  assert.deepEqual(validateIntroScript(script), []);
  for (const l of script.lines) { assert(l.text.trim().length > 0); assert(INTRO_BEATS.includes(l.beat)); }
  for (const beat of ['boy', 'tooth', 'luke', 'donsol', 'mission', 'callout']) assert(script.lines.some(l => l.beat === beat), beat);
  assert(validateIntroScript({...script, lines: [{id: 'x', beat: 'nope', durationMs: 10, text: ''}]}).length >= 3);
  assert.deepEqual(validateIntroScript(null), ['intro script is not an object']);
});

/** Fake DOM with just the opening's elements. */
function fakeIntroDom() {
  const els = {};
  const make = id => ({id, dataset: {}, textContent: '', attrs: {}, listeners: {}, open: false, focused: false,
    setAttribute(k, v) { this.attrs[k] = v; }, removeAttribute(k) { delete this.attrs[k]; },
    addEventListener(t, f) { this.listeners[t] = f; }, showModal() { this.open = true; }, close() { this.open = false; }, focus() { this.focused = true; }});
  for (const id of ['introDialog', 'introSubtitle', 'introProgress', 'introNext', 'introSkip', 'scene-title', 'introCover', 'introGuide', 'introBegin', 'introBack', 'introMuteToggle', 'introAudioStatus', 'introGuideAudioStatus', 'introTestSound']) els[id] = make(id);
  els.introGuide.hidden=true; els.introCover.hidden=false;
  return {els, doc: {getElementById: id => els[id] ?? null}};
}

// C2 approved re-pin: static title + written briefing, deliberately no timed subtitle advancement.
test('C2 opening: title then static instructions, first Enter unlocks audio, no timer or progress counter', () => {
  const {els,doc}=fakeIntroDom();const {win,timers,log}=fakeAudioWindow();
  const audio=createAudioDirector({window:win,storage:memory()});
  let closed=null;
  const intro=createIntro({document:doc,window:win,audio,script,reducedMotion:()=>false,onClose:how=>{closed=how;}});
  assert(intro.available&&intro.open());assert.equal(intro.index,0);assert(els.introNext.focused);
  assert.equal(els.introGuide.hidden,true);assert.equal(els.introCover.hidden,false);
  assert.equal(timers.length,0);assert.equal(log.contexts,0);
  intro.next();assert.equal(intro.index,1);assert.equal(els.introGuide.hidden,false);assert.equal(els.introCover.hidden,true);
  assert.equal(log.contexts,1,'first player gesture unlocks the audio engine');
  assert.equal(timers.length,1,'only repeating music schedules a timer; instructions never advance');
  assert.equal(els.introProgress.textContent,'');
  intro.next();assert.equal(closed,'finished');assert.equal(els.introDialog.open,false);
});

test('C1 opening: first launch only; never changes game state; absent markup is a no-op', async () => {
  const {els, doc} = fakeIntroDom();
  const {win} = fakeAudioWindow();
  let saved = {};
  const state = Object.freeze(createInitialState(episode));
  const layer = createCreativeLayer({document: doc, window: win, storage: memory(), episode, ACTIONS: A, isHybridUnlocked,
    getState: () => state, reducedMotion: () => true, settings: {read: () => saved, write: s => { saved = s; }}, loadScript: async () => script});
  await layer.boot();
  assert.equal(els.introDialog.open, true, 'first launch opens the opening');
  layer.intro.close('skip');
  assert.equal(saved.introSeen, true, 'remembered in settings, not in the game save');
  const again = createCreativeLayer({document: doc, window: win, storage: memory(), episode, ACTIONS: A, isHybridUnlocked,
    getState: () => state, reducedMotion: () => true, settings: {read: () => saved, write: s => { saved = s; }}, loadScript: async () => script});
  els.introDialog.open = false;
  await again.boot();
  assert.equal(els.introDialog.open, false, 'not shown again automatically');
  // Observing every kind of action never mutates game state (all inputs are frozen).
  const next = Object.freeze(reduce(state, {type: A.START}, episode));
  assert.doesNotThrow(() => again.onAction({type: A.START}, state, next));
  // No intro markup (e.g. the DOM-interface harness) → silently unavailable.
  const none = createIntro({document: {getElementById: () => null}, window: win, audio: null, script, reducedMotion: () => true});
  assert.equal(none.available, false); assert.equal(none.open(), false);
});

// =============================================================================================================
// Visual behaviour, accessibility, safe areas, no countdown
// =============================================================================================================
test('C1 visuals: every C1 animation is gated by reduced motion; motion uses transform/opacity only', () => {
  const c1 = css.slice(css.indexOf('Creative C1'));
  const gated = c1.slice(c1.indexOf('@media (prefers-reduced-motion: no-preference)'));
  const block = gated.slice(0, gated.indexOf('\n}\n') + 3);
  for (const name of [...c1.matchAll(/@keyframes\s+([\w-]+)/g)].map(m => m[1])) {
    assert(block.includes(`animation: ${name}`), `${name} must only run inside the reduced-motion gate`);
  }
  assert.equal([...c1.matchAll(/animation:/g)].length, [...block.matchAll(/animation:/g)].length, 'no ungated animation');
  assert(block.split('\n').filter(l => /animation:|transition:/.test(l)).every(l => l.includes(':not([data-motion="reduce"])')));
  for (const m of c1.matchAll(/@keyframes [\w-]+ \{([^}]*\})/g)) assert(!/\b(width|height|top|left|margin)\b/.test(m[1]), 'layout-thrashing keyframe');
});

test('C1 safe areas: sticky header clears the status bar; opening respects every inset', () => {
  assert.match(css, /\.bar \{[^}]*padding-top: calc\(10px \+ env\(safe-area-inset-top\)\)/);
  assert.match(css, /body \{[^}]*padding: 0 env\(safe-area-inset-right\) env\(safe-area-inset-bottom\) env\(safe-area-inset-left\)/);
  assert.match(css, /\.intro-cover-top\{[^}]*env\(safe-area-inset-top\)/);
  assert.match(css, /\.intro-cover-bottom\{[^}]*env\(safe-area-inset-bottom\)/);
  assert.match(html, /viewport-fit=cover/);
});

test('C1 accessibility: labelled controls, live subtitles, keyboard-reachable skip, 44px targets', () => {
  for (const id of ['soundEnabled', 'volVoice', 'volMusic', 'volSfx']) assert.match(html, new RegExp(`<label[^>]*for="${id}"`), id);
  assert.match(html, /id="introSubtitle"[^>]*aria-live="polite"/);
  assert.match(html, /<button[^>]*id="introNext"[^>]*>Enter Server 4/);
  assert.match(html, /<dialog id="introDialog"[^>]*aria-labelledby="introTitle"/);
  assert.match(html, /<dialog id="audioDialog"[^>]*aria-labelledby="audioTitle"/);
  assert.match(html, /id="soundButton"[^>]*aria-pressed="true"[^>]*>Sound: on</);
  assert.match(css, /\.sliders input\[type=range\]\{[^}]*min-height:44px/);
  assert.match(html, /Everything you hear is also shown on screen/);
});

test('C1 no countdown and no speed scoring: nothing ticks, scoring and engine untouched', async () => {
  const ui = makeUI(episode); await ui.app.boot(); ui.app.dispatch({type: A.START});
  const text = visibleText(ui.html());
  assert.match(text, /no live countdown/);
  assert(!/\b\d{1,2}:\d{2}\b(?!\s*a\.m\.)/.test(text.replace(/2:1[036] a\.m\.|2:10|2:16|2:13/g, '')), 'no clock display');
  for (const file of ['creative/audio.js', 'creative/intro.js', 'creative/creative.js']) {
    const src = read(file);
    assert(!/setInterval|Date\.now|performance\.now/.test(src), `${file}: no timing of the player`);
    assert(!/score|outcomeId|trustWeights/.test(src.replace(/\/\/.*$/gm, '')), `${file}: never reads or writes scoring`);
  }
});

test('C1 local-only: creative files load nothing remote; no binary audio assets are required', () => {
  for (const file of ['creative/audio.js', 'creative/intro.js', 'creative/creative.js', 'creative/intro-script.json']) {
    assert(!/https?:\/\//.test(read(file).replace(/\/\/.*$/gm, '')), file);
  }
  const audioDir = fs.readdirSync(path.join(root, 'assets/audio'));
  assert.deepEqual(audioDir, ['README.md'], 'sound is synthesized at runtime; no audio files to license');
});
