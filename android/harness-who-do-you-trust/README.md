# Who Do You Trust? — Android wrapper

This folder is the native wrapper workspace for the reviewed Harness Episode 001 R1 web build.

- App id: `com.theidealabstudio.harnesswhodoyoutrust`
- App name: `Who Do You Trust?`
- Web source: the hash-locked R1 payload under `www`
- Generated Capacitor web root: `dist`
- Target SDK: Android 16 / API 36 through Capacitor 8
- No signing keys belong in git.
- Debug builds are for device acceptance only. Do not upload an unsigned bundle to Play.

## Build sequence

1. Update `www/` only by copying an approved, tested web payload and updating the hash lock in `scripts/build-wrapper.mjs` in the same reviewed change.
2. Run `npm install`.
3. Run `npm run build:web`; this verifies all 19 R1 source blobs and bundles the native bridge.
4. Run `npx cap add android` once, then `npm run cap:sync` after web changes.
5. Open with `npm run cap:open`.
6. Perform physical-device input, lifecycle, back-button, safe-area, persistence, audio/subtitles, reduced-motion, and accessibility checks before signing.
7. Create the upload key only at the signing stage, outside git; then build the signed AAB and use Play App Signing.

The web/game logic is the reviewed R1 producer-acceptance build: story opening, optional audio with permanent subtitles, the full evidence/adviser/decision loop, and the evidence-based mission report. Native code remains limited to persistence and lifecycle handling.
