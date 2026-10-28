# Kate retest: Five-case usability-only patch (2026-10-28)

## Baseline and release discipline
- Tested artifact: `HARNESS-QA-FIVE-CASES-FULL5-20261027-E.apk` (Case 1 completed, Case 2 unlocked for all six children, Sound/Test Sound worked).
- Protected baseline: `feature/harness-five-case-campaign`; do not overwrite build E, alter approved case data, bypass source fingerprints, or change unlock rules.
- Patch branch: `fix/harness-five-case-kate-usability-20261028`.
- Next APK must use a **new build ID, application ID and APK filename**, with an explicit QA-only label, manifest inventory, checksum, and fresh device install verification.
- This file defines acceptance gates; it is not an implementation pass or a claim of a built APK.

## Patch acceptance criteria
1. **Scroll cue:** On each scrollable case view, show a small, accessible, gently animated down-arrow reading “Scroll for more” only when content is below the viewport and the player has not yet scrolled. Hide it when scrolled or when no overflow exists. Respect reduced-motion preference. Don't obscure interactive controls.
2. **Mobile bounds:** At 320px wide and other representative Android viewport sizes, text wraps without horizontal cutoff; no clipped dialog text, card text, clue copy, buttons, or bottom controls. Pad content by the bottom device safe area; verify large font settings and keyboard appearance.
3. **Android Back:** During a case, hardware/system Back returns to **the current case menu**, retaining progress. From menus, Back follows the expected in-app hierarchy. Never jump to the QA opening screen from active gameplay or silently reset progress. Exercise Capacitor/WebView history/Back handling on a real Android device.
4. **Hidden fifth clue:** Only after the four required primary clues are checked, the existing optional/hidden fifth clue gets a soft pulse. Keep the clue's position and discovery behavior, and avoid revealing its answer or moving it into the primary list.
5. **Clue-four feedback:** Only on transition from three to four primary clues checked, play one subtle completion chime (only if sound is enabled), and show a small “Four clues checked—look deeper” marker. Do not replay due to re-render or case resume.

## Regression checks
- Complete Case 1 through the actual required path, then confirm Case 2 unlocks; all subsequent locks remain unchanged.
- “What could you try next?” hint is still available with no solution reveal.
- Original fifth clue remains discoverable and required/optional status is unchanged.
- Sound and Test Sound behave as before; the new chime obeys mute.
- Leave/re-enter a case, rotate the phone, increase font size, use system Back repeatedly, and check no progress loss.
- Inspect build fingerprint and package identity before sending to Kate.
- Kate repeats the six-child checklist. Release only after all five patch criteria and regressions pass.

## Implementation notes
- The QA Android wrapper stages legacy HTML into the five-case campaign, including an externally approved Case 2 source. Do not casually edit frozen source or replace the Case 2 payload with a different version.
- Implement case-specific clue counting against the real primary-clue state rather than visual button counts. Use a one-time state transition for chime/marker.
- Avoid broad global CSS rules that may affect unrelated legacy screens; scope mobile fixes to inspected case views.
