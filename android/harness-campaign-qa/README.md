# HARNESS campaign Case 3 phone gate

This wrapper is an isolated physical-device test app for the five-case campaign
branch. It is not a production release and cannot update or replace the old v12
test app or the future Play app.

- Android ID: `com.theidealabstudio.harness.campaign.case3qa`
- Launcher: **HARNESS QA · CASE 3**
- Visible build: **C3-20261027-A**
- Entry: a QA launcher that can open the full campaign or unlock and start Case
  3 inside this test app only
- Source: staged directly from `games/harness-who-do-you-trust/campaign-v2`
- Network: none required during play

The staging script recreates the approved Case 1 runtime, copies the exact
approved Case 2 monolith, copies the campaign modules/data/art, rewrites only
the packaged Case 2 path and Case 3 QA launch route, and writes a SHA-256
inventory for every staged file.

Local web-stage check:

```bash
npm run build:web
```

Android generation requires Node 22, Java 21, Android SDK 36, and the npm
dependencies. The GitHub workflow performs those steps and uploads an unsigned
debug APK named `HARNESS-QA-CASE3-C3-20261027-A.apk` for phone testing.

Never upload this debug package to Google Play.

