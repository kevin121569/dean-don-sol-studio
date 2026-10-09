# Android / Capacitor notes — Who Do You Trust? v0.1

**Status: notes only.** No Capacitor project, no signing keys, and nothing published. Google Play is blocked until Kevin completes Play Console identity/device verification (packet §9).

## Why the web build is already wrap-ready

| Packet §9 requirement | How v0.1 meets it | Proven by |
|---|---|---|
| No server-only APIs | Static files only; `fetch()` is used only for the bundled `data/episode-001.json` | `episode-001.test.js` → "no core-play network dependency" |
| No cross-origin assumptions | Every resource is same-origin and relative | Browser check: 11/11 resources same-origin |
| No remote dependencies for core play | No CDN, fonts, analytics, or `@import` | Same test + resource audit |
| No absolute URLs for local assets | Every path is relative (`css/…`, `js/…`, `data/…`, `assets/…`) | Same test |
| State usable without a server | `createStore(episode, backend)` accepts any `getItem/setItem/removeItem` backend | `engine.test.js` → in-memory backend round-trip |

**One constraint:** the game uses ES modules plus `fetch()` for its JSON, so it must be **served over HTTP(S)**. Opening `index.html` straight from disk (`file://`) won't work. Capacitor serves bundled assets from `https://localhost` on Android, so this is fine there.

## Wrapper steps (Stage E, after Don Sol web approval)

1. Create the wrapper in a **separate folder or repo** so Gradle and `node_modules` never land on theidealabstudio.com:
   ```
   npm init -y
   npm i @capacitor/core @capacitor/android @capacitor/preferences @capacitor/app
   npm i -D @capacitor/cli @capacitor/assets
   npx cap init "Who Do You Trust?" com.theidealabstudio.harnesswhodoyoutrust --web-dir www
   ```
2. A copy step syncs `games/harness-who-do-you-trust/` → `www/`, **excluding** `tests/`, `android/`, `package.json`, `*.md`.
3. `npx cap add android`, then `npx cap sync android`.
4. Generate the adaptive icon and splash from a 1024² source with `npx @capacitor/assets generate --android`.
5. Build a signed **AAB** in Android Studio. Create the upload key **only at this step**, store it outside git, and enroll in Play App Signing.
6. Internal testing track, then a closed test once verification clears.

## Native adapters to add (all inside `js/app.js` boot; the engine never changes)

| Concern | Web (now) | Android (later) |
|---|---|---|
| Persistence | `localStorage` | `@capacitor/preferences` behind a small sync cache that matches the `createStore` backend shape. Also save on `App.addListener('pause')`, because Android can kill a backgrounded WebView. |
| Back button | Browser back | `App.addListener('backButton')`: close an open dialog → decide→investigate → otherwise confirm exit |
| Live announcements | `setTimeout`-based (not `requestAnimationFrame`, which stalls in a non-drawing WebView; found during this build) | Same |
| Dialog reset | Confirm button resets directly; does not depend on the dialog's async `close` event (also found during this build) | Same |
| Safe areas | `viewport-fit=cover` + `env(safe-area-inset-*)` in `game.css` | Same |
| Telemetry | In-memory buffer + `harness:telemetry` DOM event; nothing leaves the device | Add a sink only if a privacy-reviewed analytics plan is approved. The Play Data Safety form can currently declare **no data collected**. |
| Permissions | None | Request **none**. Do not add `INTERNET` unless a later feature needs it. |

## Play listing reminders (verify in Play Console at submission time)

- New personal developer accounts must run a closed test with at least 12 opted-in testers for 14 days before production.
- A privacy policy URL is required even when no data is collected.
- If the target audience includes under-13s, the Families policy applies. Decide this before the store listing.
- Target the API level Play currently requires.

## Creative C1 additions (branch `feature/harness-wdyt-creative-c1`)

**Status:** web source only. No APK was built in C1, and nothing here changes the Android wrapper branch.

**What C1 needs from the wrapper** (`feature/harness-android-capacitor-shell`, `android/harness-who-do-you-trust/`):

1. **Copy the new folder.** Copy `games/harness-who-do-you-trust/creative/` into `www/creative/`. `js/app.js` imports `../creative/creative.js`, and the opening loads `creative/intro-script.json` at runtime.
2. **Update the payload lock.** `scripts/build-wrapper.mjs` hash-locks 14 files at their **r5** values. It refuses to stage r7 or C1 ("Locked payload drift") until its `expected` map is updated in a separately reviewed commit. The C1 blob SHAs are in `CREATIVE_C1_REPORT.md` §7.
3. **Safe areas.** The top inset is now on the sticky header (`.bar { padding-top: calc(10px + env(safe-area-inset-top)) }`). With `viewport-fit=cover` and an overlaid status bar (`StatusBar.setOverlaysWebView({overlay: true})`, or edge-to-edge on Android 15+), the header clears the status bar while scrolling. The opening pads its top and bottom by the same insets.
4. **Audio.**
   - Web Audio synthesis works in the WebView after the player taps "Turn sound on" (the required user gesture). No audio permission and no audio files are needed.
   - **`speechSynthesis` is often missing in Android WebView.** Narration then falls back to subtitles only, and the sound dialog says so.
   - A native TTS plugin would be a separately reviewed adapter; C1 does not add one.
5. **Backgrounding.** Audio pauses on `visibilitychange` / `pagehide`, which the WebView fires when the app is paused.
6. **Back button.** The opening is a native `<dialog>`. The Capacitor `backButton` listener should close any open dialog first (opening → Skip; sound / help / reset → close) before leaving the app. This is in the existing native-adapter backlog.
