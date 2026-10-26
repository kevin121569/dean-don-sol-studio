# Who Do You Trust? — Google Play release readiness

Updated: October 26, 2026

## Frozen identity

- App name: **Who Do You Trust?**
- Series: **The Harness**
- Android package: `com.theidealabstudio.harnesswhodoyoutrust`
- Release source: Episode 001 R1 producer-acceptance build
- Android runtime: Capacitor 8, target API 36
- Business model for first release: undecided; no ads or in-app purchases are implemented

The package identifier is permanent. Development builds must use a different suffix and must never be uploaded under the production identity.

## Passed

- The Idea Lab Studio website is verified in Play Console.
- The R1 source includes the story opening, permanent subtitles, optional audio, evidence investigation, four advisers, four decision routes and an evidence-based mission report.
- The complete Node regression suite passes 165 tests.
- The separate adversarial audit passes all 33 groups.
- Core play is offline, has no analytics, no advertising SDK, no account and no remote content dependency.
- The Android bridge is limited to device persistence and lifecycle/Back handling.
- The production package ID is set in `capacitor.config.json`.

## Required before a signed bundle

- Approve a 1024 × 1024 app icon and splash artwork.
- Generate the native Android project with Capacitor 8 and verify target API 36.
- Pass real-device checks for touch, relaunch restore, process death, hardware Back, safe areas, sound/subtitles and screen-reader navigation.
- Add a public privacy-policy URL that accurately states the app's local-only data behavior.
- Choose the declared target-age groups. If any child age group is selected, complete every applicable Families requirement.
- Choose the launch price and countries.

## Required in Play Console

- Create the app with the frozen package ID and enroll it in Play App Signing.
- Keep the upload keystore and passwords outside git and outside chat.
- Complete App access, Ads, Content rating, Target audience, Data safety and privacy-policy declarations.
- Upload the signed AAB to Internal testing first.
- Run the closed test required for this personal developer account before requesting production access.

## Release rule

No one uploads a production AAB until the physical-device gate, privacy page, audience declaration and store assets are approved. Debug APKs are test artifacts only.
