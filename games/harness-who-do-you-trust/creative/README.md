# Creative C1 — assets and provenance

Presentation layer for **The Harness: Who Do You Trust? — Episode 1: The Shutdown Call**. It observes game actions and never changes game state, saves, scoring, evidence, decisions or validation.

| File | Purpose |
|---|---|
| `creative.js` | Wires the opening, sound controls and audio cues into the app. Becomes a no-op when its elements or browser APIs are missing. |
| `intro.js` | Skippable opening. Validates its script, shows subtitles always, speaks them when narration is on, and auto-advances only when motion is allowed. |
| `intro-script.json` | Opening narration and subtitles: 13 lines, in plain English and spoiler-free. |
| `audio.js` | Audio preferences and the synthesized audio director. |

## Asset list and licensing / provenance

| Asset | Type | Source | Licence / ownership |
|---|---|---|---|
| Investigation music (low A drone + sparse minor-pentatonic motif) | generated at runtime | `audio.js` `startMusic()`, Web Audio oscillators | Original code in this repository; no samples or recordings |
| Effects: evidence chime, reveal sparkle, option-unlock, decision tension swell, outcome stinger | generated at runtime | `audio.js` `SOUNDS` | Original code; no samples |
| Adviser cues: BOY (quick rising triplet), TOOTH (two dry clicks + low tone), LUKE (two low pulses), DON SOL (warm chord) | generated at runtime | `audio.js` `SOUNDS['advisor-*']` | Original code; no samples |
| Spoken opening / tutorial | device text-to-speech | `window.speechSynthesis` reading `intro-script.json` | No audio file is shipped. The text is original; the voice is the player's own device voice. |
| Opening visuals (network grid, Server 4 pulse, callout, cast strip) | inline SVG + CSS | `index.html` `#introDialog`, `css/game.css` (Creative C1 section) | Original markup and styles |
| LUKE icon accessible name | text change only | `assets/characters/darth.svg` (filename kept for save compatibility) | Original |

**There are no binary audio, image or video files in C1.** `assets/audio/` still contains only its README.

**Design reference** (not shipped, not copied as code): Kevin's local `HARNESS_EP01_SIGNAL_WAR_CINEMATIC_v2.zip`. From it, C1 adopted:
- the approved plain-English episode copy, structure-checked against r7;
- the beat sequence, "SIGNAL DETECTED / THREAT UNCONFIRMED" and "AN ATTACK? A MISTAKE? OR A TRAP?";
- the cast descriptions.

C1 corrected two pre-discovery clock hints from that copy (the locked hint and the locked option's description).

## Behaviour rules (enforced by `tests/creative-c1.test.js`)

- Sound is **off** on first launch. No `AudioContext` exists until the player turns sound on, and that click is the user gesture that autoplay policies require.
- Preferences are stored under `harness-wdyt:audio`, separate from the game save (`harness-wdyt:episode-001:v1`) and the motion/intro settings (`harness-wdyt:settings`).
- Narration, music and effects have separate volumes. Narration volume 0 silences only narration.
- Audio pauses when the page or app is hidden (`visibilitychange`, `pagehide`).
- Every sound has an on-screen equivalent, and subtitles are always shown. Where the device has no speech voice (common in Android WebViews), narration is subtitles only, and the sound dialog says so.
- The outcome stinger is the same for every decision, so sound never grades the player.
- No countdown, timer display or speed scoring.

## Not in C1

- Recorded voice talent. Device text-to-speech is used instead. Professional narration would need a casting decision, recordings and a licence.
- Composed or recorded music.
- The War Room arcade prototype (it has its own integration gate).
