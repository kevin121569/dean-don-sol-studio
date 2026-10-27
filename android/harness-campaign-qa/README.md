# HARNESS five-case campaign phone gate

This wrapper is an isolated physical-device test app for the five-case campaign
branch. It is not a production release and cannot update or replace the old v12
test app or the future Play app.

- Android ID: `com.theidealabstudio.harness.campaign.fullqa.e`
- Launcher: **HARNESS QA E · 5 CASES**
- Visible build: **FULL5-20261027-E**
- Entry: the real campaign selector with only Case 1 unlocked on a fresh install
- Source: staged directly from `games/harness-who-do-you-trust/campaign-v2`
- Network: none required during play

The staging script recreates the approved Case 1 runtime, copies the exact
approved Case 2 monolith, copies the campaign modules/data/art, rewrites only
the packaged Case 2 path and Case 3 QA launch route, and writes a SHA-256
inventory for every staged file. It does not seed or skip any level.

Local web-stage check:

```bash
npm run build:web
```

Android generation requires Node 22, Java 21, Android SDK 36, and the npm
dependencies. The GitHub workflow performs those steps and uploads an unsigned
debug APK named `HARNESS-QA-FIVE-CASES-FULL5-20261027-E.apk` for phone testing.

Never upload this debug package to Google Play.

