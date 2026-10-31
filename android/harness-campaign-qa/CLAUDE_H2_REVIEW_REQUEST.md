# Independent Claude re-review request — HARNESS Build H2

Claude's first review of Build G at `381b7f8873978df7bd064bbdd7c3c1478bedd93` identified three stop-ship defects.

**Review this exact remediation branch:** `fix/harness-claude-stopship-build-h2-20261030`, draft PR #82, compared with `fix/harness-single-back-handler-build-h-20261029`. Treat it as a new source candidate; neither G nor H2 is a production app.

Please verify these independently:
1. **One Back handler:** The H base removed `popstate` and Capacitor Back handling from `app/play.mjs`. `app/mobile-navigation.mjs` alone owns Android Back and should return to the current case menu without rewinding the story.
2. **No locked-case bypass:** Cases 3–5 must reject direct `play.html?case=episode-005&preview=1` access when locked. `app/play.mjs` must no longer branch on query preview or bypass the store's `locked` decision.
3. **Real replay:** `PLAY AGAIN` invokes `restartCompletedCase` to remove the selected case's live save. Frozen Cases 1 and 2 use exact legacy save keys; Cases 3–5 use campaign-store saves. Completed/unlock history must survive replay, and replay of a locked case must fail.
4. **Fingerprints:** Shared renderer `play.mjs` SHA-256 recorded in Cases 3–5 manifest; frozen source and art fingerprint checks remain unchanged. Review the successful CI regression and Android QA build output.
5. **Regression:** Inspect tests in `tests/claude-stopship-regressions.test.mjs` for logical blind spots. Test the actual browser/UI, not only regex checks, before declaring PASS. Explicitly call out any behavior that remains untested.

Respond with **PASS / CONDITIONAL / FAIL** for the 3 stop-ship issues, plus file/line evidence and severity for any new defect. Do not merge, publish, overwrite, reset protected versions, or give a blanket Play approval.

Even if all code issues pass, **Google Play production release remains blocked** until organic Android Cases 2–5 continuation, complete children/Family privacy disclosures, correct production app ID and signed AAB, developer account/tester eligibility, ratings and listing are reviewed. This QA build is debug-signed and not publishable.
