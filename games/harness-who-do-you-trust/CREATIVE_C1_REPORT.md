# Harness Episode 1 — Creative C1 delivery report

**Branch:** `feature/harness-wdyt-creative-c1` (from `main` `194dac4e4aa5b8451222aa02c59397cafe2bb8bc`).

**Status:** development branch only. Not merged, deployed or published. `main` auto-publishes through GitHub Pages, so merging needs separate deploy approval. The War Room prototype is not included.

## 1. What C1 implements

| Item | Implemented |
|---|---|
| **DARTH → LUKE** (player-facing) | Adviser display name, dialogue, Help, briefing, opening, endings and postmortem text, live announcements, and the icon's accessible name. **Kept as-is:** `darth` keys, advice ids `darth_staged` / `darth_worst`, `assets/characters/darth.svg`, the CSS variable `--darth`, and save structure. Nothing outside the game was changed (novel, screenplay, marketing site). |
| **Cinematic opening** (THE SIGNAL WAR / THE SHUTDOWN CALL) | Full-screen command-centre scene in inline SVG + CSS: network grid, Server 4 pulse, "SIGNAL DETECTED / THREAT UNCONFIRMED", cast strip. 13 narrated lines, each with its own subtitle: the crisis, the stakes ("no undo"), the Signal War framed as **unconfirmed**, BOY / TOOTH / LUKE / DON SOL, and the mission and controls. It shows on first launch only; replay it from the briefing or Help. **Skip** gets focus; Esc also skips. Under reduced motion it never auto-advances and all animation is off; the player steps through with Next. Motion uses only transform/opacity. |
| **Narration, music, sound** | Sound is off on first launch. A header **Sound** button opens on/off plus separate **narration / music / effects** volumes. Preferences are saved under `harness-wdyt:audio`, separate from game saves. Narration uses the device's own speech voice, with subtitles always shown. Mystery-themed investigation music plays only on the investigate and decide screens. There are distinct cues for each adviser, opening evidence, new-evidence discovery, the hybrid option unlocking, a decision-tension swell, and one neutral outcome stinger (it never grades the choice). Audio pauses in the background. Nothing autoplays. |
| **Plain-English experience** | The approved copy pass from Kevin's handoff: briefing, all evidence, adviser lines, decisions, outcomes and postmortem. UI copy covers clues, helpers, "How much do you trust …? Doubt / Neutral / Trust", a mission line on the investigate screen, and "Take your time · no live countdown". |
| **Spoiler safety** | C1 corrected two pre-discovery hints in the handoff copy: the locked-option hint ("…the two clocks…") and the locked option's description. A test forbids clock / time-difference wording in anything shown before discovery. |
| **Android safe area** | The top inset moved from `body` (which scrolls away) onto the sticky header. The opening respects every inset. |

## 2. Engineering protection (proven, not asserted)

- `js/engine.js`, `js/state.js`, `js/content.js`, `js/advice.js` and `js/telemetry.js` are **byte-identical to r7**; a test pins their SHA-256.
- The episode's **structure is identical to r7**: every id, condition, reveal, rating, decision and flag. A test compares it with a fixture generated from `main` `194dac4` (`tests/fixtures/episode-001-structure.json`). The only difference is a fourth briefing paragraph, which is text.
- `validateEpisode()` accepts the new copy unchanged. There is no countdown and no speed scoring, and the creative code never reads or writes scoring.
- Changed engine-adjacent files:
  - `js/app.js`: one import, two hooks, a replay action, plain-English templates. Strings that existing tests assert are kept verbatim.
  - `js/dom-ids.js`: 15 new static ids registered, so the r2 completeness test covers them.
- **Placement:** the creative modules live in `creative/`, not `js/`, so the r2 static-hosting test, which pins the `js/` file count, stays unchanged.

## 3. Tests

| Run | Result |
|---|---|
| Existing suite (unchanged test files) | **130 / 130** |
| Existing audit groups | **33 / 33** |
| New `tests/creative-c1.test.js` | **19 / 19** |
| **Total** | **149 / 149** tests, **33 / 33** audit groups |

**Mutation check:** reverting LUKE to DARTH, adding a clock hint and removing the safe-area fix made exactly the 4 relevant C1 tests fail. Restoring the files brought it back to 19/19.

**Real-browser check (Chromium, 1280×800 and 375×812):**
- First launch opens the opening with Skip focused. It auto-advances; Skip closes it, remembers that, and announces it.
- The visible text reads LUKE, with no DARTH anywhere.
- Sound on/off, volumes and saving all work.
- Reduced motion leaves 0 running animations.
- No horizontal scroll at phone width; no console errors.

**Disclosed test-helper change:** `tests/ui-harness.js` injects the new `createCreativeLayer` dependency, because the harness strips `app.js` imports. No test file changed.

## 4. Assets and provenance

There are no binary audio, image or video files. All music and effects are synthesized at runtime by `creative/audio.js` (original code). Narration is the device's text-to-speech reading original text. Visuals are original inline SVG/CSS. The full table is in `creative/README.md`.

## 5. Incomplete items and blockers

1. **Android build: blocked outside C1's scope.** The wrapper branch locks its web payload to **r5** blob hashes and would reject r7 and C1. It needs a separately reviewed update to its `www/` copy (including `creative/`) and its lock list (§7). No APK was built.
2. **Narration on Android.** WebViews often lack `speechSynthesis`, so narration falls back to subtitles. Spoken narration on the phone needs a reviewed native TTS adapter or recorded voice talent (casting and licence).
3. **Music and effects are synthesized,** not composed or recorded. They suit a prototype; a composer could replace them later.
4. **Not yet tested:**
   - physical keyboard, touch and screen reader;
   - audible audio quality (the automated checks confirm behaviour, not how it sounds);
   - Android status bar on a real device.

## 6. Read-only review instructions for Astra

1. **Check out the branch, read-only.** Base `194dac4`. Use an LF checkout; the CRLF harness issue is still open.
2. **Run** from `games/harness-who-do-you-trust/`:
   - `node --test "tests/*.test.js"` (expect 149 / 149);
   - `node tests/astra-audit.mjs` (expect 33 / 33).
3. **Verify independently:**
   - (a) no core-module drift: `git diff 194dac4 -- js/engine.js js/state.js js/content.js js/advice.js js/telemetry.js` is empty;
   - (b) episode structure equality with `main` apart from text;
   - (c) no visible "Darth" in any rendered scene, Help, opening, announcements or the icon label, while internal `darth` ids remain;
   - (d) nothing before discovery hints at the clock difference;
   - (e) no AudioContext and no sound before the player opts in;
   - (f) audio preferences never enter the game save;
   - (g) reduced motion stops all opening animation and auto-advance;
   - (h) no remote loads.
4. **Serve over HTTP** and play: first launch, Skip, replay, sound on/off and volumes, all four outcomes, reset, reload.
5. **Out of scope:** the War Room prototype, Android packaging, deployment.

## 7. Android build and test instructions

For the wrapper branch, as a separately reviewed change. Never sign or publish from this branch.

1. On `feature/harness-android-capacitor-shell`, copy `games/harness-who-do-you-trust/{index.html,css,js,data,assets,creative}` from this C1 commit into `android/harness-who-do-you-trust/www/`. Exclude `tests/`, `android/`, `*.md` and `package.json`.
2. Update `scripts/build-wrapper.mjs` `expected` (git blob SHA-1, LF):

   | File | Blob SHA-1 |
   |---|---|
   | `assets/characters/boy.svg` | `968da6e149dba7a6b27a353b86ada558ffcb38f7` |
   | `assets/characters/darth.svg` | `9ea1e191b1c663dae85ce482c52b7479f6bd0da0` |
   | `assets/characters/donsol.svg` | `7162c160906fe11c4c899b652fb4da7254e5aa0a` |
   | `assets/characters/tooth.svg` | `376a2a95f0906d2aa4d9dd381785dbac3ceb14ea` |
   | `css/game.css` | `9d80f74f02e7aaded6d1852cb3bc1228716d2e89` |
   | `data/episode-001.json` | `c8336a4f6d4965462e2d180312cc8dfcf5d131fd` |
   | `index.html` | `dd7a7abe57130e5103921947512663a80bb09110` |
   | `js/advice.js` | `b7194e413f6d0beacb699dcb4817a4cfc26faf44` |
   | `js/app.js` | `ee986b9965ddb4a1d4644ce00746affc1ca8564a` |
   | `js/content.js` | `5742da8c04b6cbfcd968e50d86d40745d4a391a7` |
   | `js/dom-ids.js` | `c7c090df15c65cd14190bba1d494735982e5c2a9` |
   | `js/engine.js` | `b2784f5fdf7a8c385d22b3ec44444e4880f77dfc` |
   | `js/state.js` | `fcbc5d911aed22c1bbeefcc294cc6d4671f19522` |
   | `js/telemetry.js` | `927b3579e539e8e801c834b6478d5d8b77b78d15` |
   | `creative/audio.js` | `739abb5d662e3f1536045801d57453663c709926` |
   | `creative/creative.js` | `c4a8f752dd4b2c0b77f0f79a21cd91ac3b8a5353` |
   | `creative/intro.js` | `8fb15175234b65c13d477b6a6d3c159a25e43987` |
   | `creative/intro-script.json` | `16340b60662cd16a11cbd4199efaa30036f74fac` |

   These SHAs belong to this C1 commit; recompute them if C1 changes. The engine, state, advice, telemetry and three of the icons are byte-identical to the wrapper's current lock.
3. In `android/harness-who-do-you-trust/`, run:
   ```
   npm install
   npm run build:web
   npx cap sync android
   cd android
   gradlew.bat :app:assembleDebug --no-daemon --max-workers=2 --console=plain
   ```
   Keep the known-good APK. Record the new APK's path, size and SHA-256.
4. **Install on the Motorola and check:**
   - Status-bar spacing at the top of every screen and while scrolling.
   - First-launch opening: Skip, then Next with **Reduce motion** on.
   - Sound on/off and volumes; narration (subtitles-only if there's no device voice); audio pausing when the app is backgrounded.
   - LUKE everywhere; all five clues, including BOY's reveal; TOOTH's updated reply.
   - All four decisions and recaps.
   - The Back button with the opening and dialogs open.
   - Upgrade over an existing save (state must resume); offline play.
5. **Do not upload to Google Play.** That needs the signed-AAB release gate and Kevin's account verification.
