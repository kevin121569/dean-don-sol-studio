# HARNESS Build G — release acceptance and independent-review handoff

**Candidate:** `FULL5-20261029-G` (QA-only Android APK). **Rollback:** Build F.  
**Decision:** HOLD public release until every open criterion below is supported by evidence and the owner approves the final production package. Do not rename the QA APK or submit its QA-only package to Play Store.

## Verified baseline
- Six-child Build F field test: 6/6 completed Case 1 and unlocked Case 2; core difficulty preserved.
- Build G phone report: top QA banner, tap acknowledgement, hidden fifth-clue label, sound off, Back navigation passed targeted checks.
- Native Android API 35 Case 1 persistence: checked `Monitor Alert` stayed at **1 of 4** through Back, Resume, force-stop, relaunch, Resume. [Successful run](https://github.com/kevin121569/dean-don-sol-studio/actions/runs/41112344422).
- Native Android compatibility using **seeded test-only predecessor completions**, not organic progression: Case 2 opens with artwork; Cases 3–5 show four images, accept an evidence inspection and native Back, and start audio OFF. [Successful run](https://github.com/kevin121569/dean-don-sol-studio/actions/runs/41132835174).
- Correct-width Case 3: `window.innerWidth=390`, document width 390; banner, header, gauge within bounds. Remaining 390 CSS-pixel checks were interrupted by ADB/CDP failures.
- Existing engine tests validate later-case legitimate decisions, save envelopes and sequential unlocks; browser UI checks reach outcomes. Neither proves full uninterrupted phone progression.

## Release-blocking phone walkthrough (organic, no seeded saves)
Use **Build G** on a normal Android phone. Keep existing test state; do not clear data or uninstall. Note device/Android version, and PASS/ISSUE for each gate.

| Gate | Action | Acceptance |
|---|---|---|
| 2A | Open The Missing Two normally; inspect Monitor Alert or another clue, Android system Back, Resume | Same clue still inspected; no reset |
| 2B | Force-stop Build G without clearing storage; relaunch, resume Case 2 | Same inspected clue remains |
| 2C | Finish the case naturally, review outcome, return to selector | **Case 3** unlocks with no fixture |
| 3A | Open The Cold Mirror, inspect four primary clues, consult advisers, discover optional fifth clue | Images render, clues react, fifth clue appears only when eligible |
| 3B | Back, Resume, then force-stop/relaunch and Resume Case 3 | Inspected clues and adviser selections persist |
| 3C | Finish a valid judgment/outcome/review | **Case 4** unlocks |
| 4A | Open The Ledger's Weight, inspect evidence, use **graded adviser weights**, make a valid decision | Text/buttons fit screen, logic respects required weighting |
| 4B | Back/Resume and full process restart; resume | Clues/adviser weights and progress persist |
| 4C | Complete review | **Case 5** unlocks |
| 5A | Open The Open Record; inspect, consult, decide, complete | Correct art, clues, review, season-complete state |
| 5B | Back/Resume and force-stop/relaunch | Saved state/season completion survives |
| Common | Inspect all active case screens, status bar and bottom safe area; test Sound OFF; use system Back | No horizontal clipping, unintended sound, lost state, crash or splash jump |

**If any gate fails**, record exact step, screenshot and observed/expected behavior. Pause public release; preserve Build G/F before modifying gameplay. A passing browser test or a seeded native test **does not** replace this walkthrough.

## Independent Claude review — mandatory after the gates above
Provide Claude a fixed SHA/commit or PR diff, the original Build G APK manifest and checksum, GitHub CI results, the completed phone checklist, and the known limitations. Require a written review covering:
1. Five-case sequence and no illicit unlock bypass.
2. Persistent progress, full restart behavior, storage key/version compatibility.
3. Clue eligibility, fifth-clue reveal, advisor choices and ending logic.
4. Mobile safe areas, 320–390 CSS-pixel layouts, Back behavior and sound-off.
5. Source integrity and shipped art fingerprints, packaging identity and Play policy readiness.
6. Security/privacy, accessibility, third-party licensing, age suitability, and any STOP-SHIP findings.

Request severity, file/line evidence, reproducible steps and a clear **PASS / CONDITIONAL / FAIL**. Do not treat unverified assertions as a passing review. Address STOP-SHIP issues, rerun tests and have Claude verify again.

## Publication gate
Only after all checks and independent review pass:
- Build an explicitly **production** signed Android package with correct package identity, version, app labeling and no QA banner/QA-only instructions. Never upload `fullqa.g` or repurpose a debug APK.
- Check signing, target SDK/Play requirements, privacy disclosures, children/families rules if applicable, age rating, store assets, content rights, and internal/closed-track test requirements.
- Publish only after verifying the selected production package and receiving owner approval of the final store submission.
- Archive source commit, release checklist, APK/AAB hash, review report and rollback plan.
- Then select and scope the **next game** as a separate project; do not mix its code into the HARNESS release branch.
