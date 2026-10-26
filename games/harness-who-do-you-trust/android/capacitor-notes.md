# Android / Capacitor notes — Who Do You Trust? v0.1

**Status: Android release candidate in progress.** The reviewed R1 web source is staged in `android/harness-who-do-you-trust/` under the permanent package ID `com.theidealabstudio.harnesswhodoyoutrust`. No signing keys exist in git and nothing has been published. The Idea Lab Studio website was verified in Play Console on October 26, 2026.

## Why the web build is already wrap-ready

| Packet §9 requirement | How v0.1 meets it | Proven by |
|---|---|---|
| No server-only APIs | Static files only; `fetch()` is used only for the bundled `data/episode-001.json` | `episode-001.test.js` → "no core-play network dependency" |
| No cross-origin assumptions | Every resource is same-origin and relative | Browser check: 11/11 resources same-origin |
| No remote dependencies for core play | No CDN, fonts, analytics, or `@import` | Same test + resource audit |
| No absolute URLs for local assets | Every path is relative (`css/…`, `js/…`, `data/…`, `assets/…`) | Same test |
| State usable without a server | `createStore(episode, backend)` accepts any `getItem/setItem/removeItem` backend | `engine.test.js` → in-memory backend round-trip |

**One constraint:** the game uses ES modules plus `fetch()` for its JSON, so it must be **served over HTTP(S)**. Opening `index.html` straight from disk (`file://`) won't work. Capacitor serves bundled assets from `https://localhost` on Android, so this is fine there.

## Wrapper steps (Stage E)

1. Build and hash-check the locked R1 payload with `npm run build:web` inside `android/harness-who-do-you-trust/`.
2. Run `npx cap add android`, then `npm run cap:sync`.
3. Generate the adaptive icon and splash from an approved 1024² source with `npx @capacitor/assets generate --android`.
4. Complete the physical-device release gate: touch, lifecycle, Back, safe areas, persistence, sound/subtitles, reduced motion and accessibility.
5. Create the upload key only after those checks, keep it outside git, build a signed AAB and enroll in Play App Signing.
6. Upload to internal testing, complete the store listing and policy forms, then run the required closed test before production access.

## Native adapters in the Android wrapper (the engine never changes)

| Concern | Web (now) | Android (later) |
|---|---|---|
| Persistence | `localStorage` | `@capacitor/preferences` behind a synchronous cache that matches the `createStore` backend shape; pending writes flush when the app backgrounds. |
| Back button | Browser back | `App.addListener('backButton')`: close an open dialog → use the game's Back control → browser history → minimize at the root |
| Live announcements | `setTimeout`-based (not `requestAnimationFrame`, which stalls in a non-drawing WebView; found during this build) | Same |
| Dialog reset | Confirm button resets directly; does not depend on the dialog's async `close` event (also found during this build) | Same |
| Safe areas | `viewport-fit=cover` + `env(safe-area-inset-*)` in `game.css` | Same |
| Telemetry | In-memory buffer + `harness:telemetry` DOM event; nothing leaves the device | Add a sink only if a privacy-reviewed analytics plan is approved. The Play Data Safety form can currently declare **no data collected**. |
| Permissions | None | Request **none**. Do not add `INTERNET` unless a later feature needs it. |

## Play listing reminders (verify in Play Console at submission time)

- New personal developer accounts must run a closed test with at least 12 opted-in testers for 14 days before production.
- A privacy policy URL is required even when no data is collected.
- If the target audience includes under-13s, the Families policy applies. Decide this before the store listing.
- Target Android 16 / API 36 for new submissions after August 31, 2026.

## R1 presentation layer

**Status:** locked into the Android release candidate. The game keeps permanent subtitles and remains fully playable without sound.

**Wrapper treatment** (`android/harness-who-do-you-trust/`):

1. **Locked presentation.** `creative/` is included in the 19-file payload lock. Any change must update the source, tests, vendored Android payload and hashes together.
2. **Mission report.** The R1 after-action report rewards recorded investigation steps rather than declaring one decision the winner.
3. **Safe areas.** The top inset is now on the sticky header (`.bar { padding-top: calc(10px + env(safe-area-inset-top)) }`). With `viewport-fit=cover` and an overlaid status bar (`StatusBar.setOverlaysWebView({overlay: true})`, or edge-to-edge on Android 15+), the header clears the status bar while scrolling. The opening pads its top and bottom by the same insets.
4. **Audio.**
   - Web Audio synthesis works in the WebView after the player taps "Turn sound on" (the required user gesture). No audio permission and no audio files are needed.
   - **`speechSynthesis` is often missing in Android WebView.** Narration then falls back to subtitles only, and the sound dialog says so.
   - A native TTS plugin would be a separately reviewed adapter; C1 does not add one.
5. **Backgrounding.** Audio pauses on `visibilitychange` / `pagehide`, which the WebView fires when the app is paused.
6. **Back button.** The opening is a native `<dialog>`. The Capacitor `backButton` listener should close any open dialog first (opening → Skip; sound / help / reset → close) before leaving the app. This is in the existing native-adapter backlog.
