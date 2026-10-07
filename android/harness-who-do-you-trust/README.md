# Who Do You Trust? — Android wrapper

This folder is the native wrapper workspace for the reviewed Harness Episode 001 web build.

- App id: `com.theidealabstudio.harnesswhodoyoutrust`
- App name: `Who Do You Trust?`
- Web root: `www`
- No signing keys belong in git.
- Do not deploy or publish from this branch.

## Build sequence

1. Copy the locked web game from `games/harness-who-do-you-trust/` into `www/`, excluding tests, android notes, package.json, Markdown reports, and test results.
2. Run `npm install`.
3. Run `npx cap add android` once.
4. Run `npx cap sync android`.
5. Open with `npx cap open android`.
6. Perform physical-device input, lifecycle, back-button, safe-area, persistence, reduced-motion, and accessibility checks before signing.
7. Create the upload key only at the signing stage, outside git; then build the signed AAB and use Play App Signing.

The web/game logic remains the reviewed r5 build. Native persistence/lifecycle adapters should be added only as a separately reviewed change.
