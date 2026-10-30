# HARNESS Build G — native checked-clue persistence release gate
Date: 2026-10-30
Scope: exact QA-only `FULL5-20261029-G` APK; no rebuild, no merge, no new gameplay or paid test.

## Preconditions
- Keep Build F installed as rollback; Build G is a separately identified QA app.
- Use a fresh or known Case 1 test save. Do **not** clear app storage between the persistence steps.
- A Case 1 title or a "RESUME CASE" menu button alone is insufficient evidence that inspected clue data survived.

## Deterministic one-device check
1. Launch Build G, open the five-case selector, and tap **BEGIN CASE** or **RESUME CASE** for **Server 4**.
2. If shown the briefing, choose **START SILENT** (not sound mode); proceed to the Investigation Board.
3. Open **Monitor alert**, confirm **Clue opened ✓**, then close its details and verify the clue is marked **checked/inspected**.
4. Take screenshot A of the checked clue or the **CLUES CHECKED** progress count, showing at least one inspected clue.
5. Press the Android **system Back** button once. Verify you land on the five-case selector, not the QA splash.
6. Tap **RESUME CASE** for Server 4. Verify Monitor alert is still inspected **without tapping it again**. Take screenshot B.
7. Fully close the app / remove it from recents; force-stop it in Android App Info if available. Do not clear data or uninstall.
8. Reopen Build G, enter the five-case selector, tap **RESUME CASE**, and verify **the same inspected clue** remains marked. Take screenshot C.

## Pass/Fail
PASS requires matching saved inspection in A, B, and C; correct system Back destination; no crash; and no loss of Case 1 unlock/progress. A visible resume button without the inspected clue is **not** a pass.

FAIL/INVESTIGATE if the checked marker or inspectedSources state disappears at any step, Back leaves the case unexpectedly, or the app crashes. Record the step, phone model/Android version, and screenshots; preserve the original Build G and F installations.

## Later-case gate (separate)
Repeat equivalent **real-device** resume/Back/progress checks for Case 2–5 after legally unlocking each one. Verify Case 2 completion unlocks Case 3, Case 3 unlocks Case 4, Case 4 unlocks Case 5, and the finale completes. Browser-level tests are not a substitute for Android save, audio, and touch verification.

## Automation
GitHub Actions workflow `harness-buildg-persistence.yml` in draft PR #80 is the isolated automated attempt at the Case 1 gate. It downloads the previously verified Build G APK rather than rebuilding it. Mark **pending**, not passing, until screenshots and a successful test report are inspected. Do not merge PR #80 for a failing or merely queued run.
