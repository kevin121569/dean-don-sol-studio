# CLAUDE — Independent HARNESS Five-Case Release Review

**Role:** Independent adversarial reviewer. Do not rubber-stamp this build, change production files, or publish. Examine the evidence yourself and produce reproducible findings. This is not a request to rewrite game difficulty or stories.

## Source of truth (October 30, 2026)
Repository: `kevin121569/dean-don-sol-studio`  
Baseline five-case branch: `feature/harness-five-case-campaign`  
Build F (Kate-tested rollback): `fix/harness-five-case-kate-usability-20261028` (PR #73)  
Build G (current QA candidate): `fix/harness-five-case-build-g-20261029` at SHA `381b7f8873978df7bd064bbbd77c3c1478bedd93` (draft PR #75).  
Test-only PRs: #78 decision-path regression; #79 native launch/Back smoke; #80 real Android Case 1 checked-clue persistence; #81 later-case native WebView tests. Test-only PRs are not production code.

The validated artifact is the **QA-only** Android APK `HARNESS-QA-FIVE-CASES-FULL5-20261029-G.apk`, built by GitHub Actions run 40886104535. Do **not** publish this package. Its app ID is `com.theidealabstudio.harness.campaign.fullqa.g` and it contains a QA banner.

## Evidence with limitations — independently verify
- Six-child field study on Build F: all six completed Case 1, Case 2 unlocked, usability checklist passed. Ages 8–13 are a small usability sample, not proof of universal suitability.
- Build G targeted phone retest: QA banner below Android system bar, clue acknowledgment, neutral fifth-clue label, Sound OFF and Back reported passing; screenshots verified the banner.
- [Android Case 1 inspected-clue persistence PASS](https://github.com/kevin121569/dean-don-sol-studio/actions/runs/41112344422): one real inspected `Monitor Alert` clue stayed **1 of 4** before Back, after Resume, and after force-stop/relaunch/Resume; inspect report.json and screenshot artifact.
- [Android later-case compatibility PASS](https://github.com/kevin121569/dean-don-sol-studio/actions/runs/41132835174): Case 2 legacy art loads and Back goes to selector; Cases 3–5 have four illustrated initial clues, clue drawers open, inspected clue marked, audio starts OFF, native Back returns to menu. **Test-only seeded prior-case saves were used. This is NOT an uninterrupted natural five-case play-through.**
- [Correct-width Case 3 check](https://github.com/kevin121569/dean-don-sol-studio/actions/runs/41133851372): 390 CSS px with documentWidth=390, header/banner/gauge inside bounds. Other 390 px checks interrupted by ADB/CDP instability. Earlier clipped screenshots used 390 *physical* px at 240 dpi (~260 CSS px), below the 320 px supported minimum.
- Browser case playthrough tests and engine decision/regression checks passed; they do not establish native end-to-end completion.
- User's manual **organic Cases 2–5 restart and sequential-unlock phone walkthrough is still pending**. [Acceptance checklist](android/harness-campaign-qa/BUILD_G_FINAL_RELEASE_GATE.md).

## Required audit (severity P0/P1/P2 with exact files, evidence, reproduction and mitigation)
1. **Game integrity:** five-case manifest, Case 1/2 frozen source hashes, every source/art SHA, hidden clue timing, adviser judgment gates, all legal endings, difficulty invariants and no hidden unlocking bypass in production.
2. **Persistence:** session versioning, per-case save keys, save/restore after Back and force-stop, case completion and next-case unlock; check legacy Case 1/2 iframe state versus campaign store state, not just status labels. Explicitly state what is *not* proven by CI.
3. **Mobile & accessibility:** safe-top/bottom padding, 320 and 390 CSS px, large font, reduced motion, keyboard and screen-reader controls, Android hardware Back, feedback sounds respect mute and sound toggles.
4. **Store/privacy/security:** determine if any network requests, analytics, identifiers, advertising or external scripts/permissions actually ship. Confirm privacy policy, Data safety, Kids/Families policy, content ratings and appropriate age targeting. Flag any WebView-only app-policy exposure, and cite official Play policy, not guesses.
5. **Release engineering:** QA APK must remain QA-only, no debug signing in production, no `fullqa.g` package submission. Produce a separate signed **AAB** with compliant version code/package ID, Android 16 API 36 or higher target for new submissions as of Aug. 31, 2026, no yellow QA banner, and verify Play App Signing and store requirements. Do not assume this AAB exists.
6. **Release process:** verify Play Console eligibility and status of any applicable closed-test requirement (for new personal developer accounts generally 12 opted-in testers continuously for 14 days), developer identity/package registration and staged rollout. Verify whether the account is personal/new/eligible instead of assuming. Confirm final user approval for actual production submission.

## Official policy references (verify freshness independently)
- Target API: https://support.google.com/googleplay/android-developer/answer/11926878
- New personal developer closed testing: https://support.google.com/googleplay/android-developer/answer/14151465
- Google Play Families: https://support.google.com/googleplay/android-developer/answer/9893335
- Privacy/content declaration: https://support.google.com/googleplay/android-developer/answer/9859455
- App Bundle requirement: https://support.google.com/googleplay/android-developer/answer/9844279

## Response format
A. **Verdict:** PASS / CONDITIONAL / FAIL for release preparation and separately for production publish.  
B. **Verified scope:** what source/code/assets/tests you actually inspected, with commit SHA.  
C. **Finding table:** severity, path/line, evidence, reproducible steps, recommended fix, blocking?  
D. **Missing proof:** especially organic Cases 2–5 phone progression and privacy/Play Console status.  
E. **Publication checklist:** exact remaining steps and responsible party.  
F. **No-change statement:** confirm you did not change code, merge PRs, regenerate content, alter APKs or submit an app.

**Do not claim Play Store approval or production readiness without direct proof. Do not merge, publish or modify any protected branch.**
