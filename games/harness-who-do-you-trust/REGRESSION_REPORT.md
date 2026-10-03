# Harness Episode 001 — Issue #3 remediation regression report

**Verdict: AUTOMATED REMEDIATION PASS — READY FOR DON SOL REVIEW.**

All seven Issue #2 findings have code fixes and adversarial regressions. The
original 31 tests remain unchanged and pass. No merge or deployment was performed.
Don Sol must review this patch before an Astra re-test is requested.

| Audit identity | Value |
|---|---|
| Repository | `kevin121569/dean-don-sol-studio` |
| Task | [Issue #3](https://github.com/kevin121569/dean-don-sol-studio/issues/3), remediation of Issue #2 |
| Exact base branch | `feature/harness-wdyt-episode-001-v0.1` |
| Exact base commit / sole commit parent | `f5083a201c612c78ce5ebedace71bc1fd26290c6` |
| Remediation branch | `fix/harness-wdyt-redteam-r1` |
| Fix revision | The commit containing this report; use its commit-pinned handoff link |
| Allowed scope | `games/harness-who-do-you-trust/` only |
| Runtime used for checks | Node.js `v24.19.0`; no dependencies installed |
| Report date | 2026-10-03 UTC |
| Main comparison commit | `b259244fd7b1391e139bf88e43a92049d8dfaa6d` |

The exact base was materialized from verified Git blobs. All 20 original game
files in the baseline replay match the base blob hashes. The remote remediation
commit uses the complete base repository tree, with only game paths replaced or
added. Its SHA is reported separately in the Don Sol handoff because a commit
cannot contain its own SHA in this file.

## Exact automated totals

| Run | Total | Pass | Fail | Skipped / cancelled / todo |
|---|---:|---:|---:|---:|
| Node test suite, original plus new tests | 55 | 55 | 0 | 0 / 0 / 0 |
| Original shipped tests, unchanged | 31 | 31 | 0 | 0 / 0 / 0 |
| New red-team regressions | 24 | 24 | 0 | 0 / 0 / 0 |
| Re-executed Issue #2 audit groups | 24 | 24 | 0 | None |
| Selected failure reproducers against exact old base | 12 | 0 | 12 expected | 0 / 0 / 0 |

The 24 audit groups are reported separately from the 55 Node tests; many exercise
the same scenarios and are not 24 additional unique unit tests. The old-base run
proves that all 11 Astra failures, plus the new decision-ID injection case, fail
before the patch. Those 12 regressions pass in the complete fixed suite.

Run from this game folder:

```sh
npm test
node --test --test-reporter=tap "tests/*.test.js"
node tests/astra-audit.mjs /tmp/harness-astra-audit.json
```

Evidence is committed with the patch:

- [Node suite TAP](tests/results/node-test.tap)
- [Original audit rerun results and diagnostics](tests/results/astra-audit.json)
- [Expected failures against the exact base](tests/results/base-reproducers.tap)

The baseline replay uses the unchanged 20 base files and copies only the new
`redteam.test.js`, `ui-harness.js`, and `advice.js` harness dependency alongside
them. The original app, content, engine, and state modules are not patched.
`advice.js` supplies an injected dependency unused by the old app. Run the selected
reproducers there with:

```sh
node --test --test-reporter=tap \
  --test-name-pattern="Astra reproducer|F1.*ID injection|F2 denied" \
  tests/redteam.test.js
```

## Astra defect → fix → regression

All test names below are in [tests/redteam.test.js](tests/redteam.test.js).

| Finding | Code change | Regression coverage |
|---|---|---|
| F1 HIGH — identifier/attribute injection | `content.js` enforces safe episode, evidence, advice and decision IDs; advisers remain an exact fixed set. `app.js` escapes every interpolated identifier attribute in evidence, adviser, trust and decision controls. | `F1 evidence ID injection...` and `F1 decision ID injection...` reject consistent malicious content, inspect the safe loader error, then bypass validation to independently verify escaped attribute boundaries and absence of injected image/script nodes or event-handler attributes. `F1 reject unsafe IDs...` checks every definition type. |
| F2 HIGH — storage-denied startup | `state.js` acquires the default storage property inside `try`; denied access uses a no-op backend. Storage method errors stay guarded. | `F2 denied localStorage property getter...` installs a getter throwing `SecurityError`, exercises the adapter and boots/plays the actual app. `F2 unavailable storage methods...` verifies denied methods and explicit no-op storage. |
| F3 MEDIUM — impossible saves | `state.js` requires saved advice's mandatory reveal effects. Shared first-match selection checks whether each saved variant was selectable at a prior inspection prefix and possible prior adviser count; it does not require the variant to match current evidence. | `F3 mandatory BOY reveal...` and `F3 Don Sol frame as first and sole...` reproduce both forged saves exactly. `F3 legitimate stale advice...` preserves thin/unread stale advice and valid later frame/staged re-consultations. |
| F4 MEDIUM — validator holes | `content.js` rejects explicit null conditions and duplicate reveal IDs. A finite exploration using the shared selector proves every hidden item reachable from initial discovery, inspection and consultation sets. `engine.js` also de-duplicates discovery effects defensively. | `F4 null when...`, `F4 duplicate reveals...`, and `F4 self-dependent reveal...` reproduce the three Astra mutations. `F4 reachability...` additionally rejects an unconditional rule shadowing a reveal and accepts a reachable conditional reveal. |
| F5 MEDIUM — inherited adviser actions | Shared `advice.js` checks explicit adviser membership, own advice property and array shape before lookup. Engine consultations/trust and restore use own-property-safe handling. | `F5 prototype adviser IDs...` verifies `constructor`, `__proto__`, and `toString` return the identical state, cannot set trust, and are rejected in saves without throwing. |
| F6 MEDIUM — dispatch/reset and live-region races | `app.js` commits state before notifying synchronous telemetry sinks and stops old-dispatch presentation/events if a nested reset changes state. Reset cancels live timers and invalidates callbacks with a generation counter. | `F6 synchronous telemetry listener...` verifies state, persisted state and rendered briefing after the exact nested reset. `F6 delayed pre-reset live callback...` forcibly invokes a retained BOY callback before and after the reset message. Additional consult-all and decision telemetry reset cases reject stale events and announcements. |
| F7 LOW — failed-consult telemetry | `app.js` only logs single consultation attempts for known advisers. Valid repeated consultations and consult-all retain intentional `updated:false`. | `F7 invalid adviser attempts...` checks unknown and prototype IDs emit zero normal consultation events. `F7 valid repeated consultations...` verifies 10 valid events, the repeated single no-op and four consult-all no-op events; out-of-scene attempts emit none. |

`js/advice.js` contains the pure selection logic shared by engine, validator,
restore and UI. Engine's existing `selectAdvice` and `isHybridUnlocked` exports
remain available. No episode text, decision, outcome, adviser profile, CSS or
asset was changed.

## Preserved mechanics and required reruns

| Check | Independently verified result |
|---|---|
| Evidence order and BOY reveal timing | 120 permutations, 360 valid BOY timings; all evidence inspected once, hybrid available, saves restore |
| Adviser order / repeated consultation | 24 orders; four unique advisers, expected final advice set, idempotent repeats and consult-all |
| Hybrid gating | All 32 evidence subsets: 28 locked, 4 unlocked; locked submissions return the identical state |
| Outcomes and postmortems | All 4 outcomes × minimal applicable/full investigations = 8 engine routes and 8 app rendering routes |
| Postmortem content | Known/unknown, four adviser ratings, uncertainty, three alternatives and risks populated; no invented certainty |
| Common corrupted saves | 36 additional original-audit mutations rejected, plus the two Astra semantic forgeries |
| Common malformed content | 30 additional original-audit mutations rejected, plus null/duplicate/circular Astra cases and injection variants |
| Reachable state restore | Original 50,000 seeded samples pass; new 30,000 samples pass, with 1,233 completed samples at seed `0x51d27b93` |
| Refresh / settings / reset | App state and trust/uncertainty restore, corrupt saves start fresh, reset persists briefing, motion preference survives reload |
| Reduced motion | All 4 OS/manual combinations choose expected scroll behavior; existing CSS motion guards verified |
| Local/static operation | 13 core resources return HTTP 200 locally, including new `js/advice.js`; existing scan verifies no core-play remote loads |
| Text escaping | Original audit ordinary-content payload test passes; identifier escaping independently tested in both evidence and decision renderers |
| Missing Page isolation | All 5 `/missing-page/` file blob hashes match exact base and main |
| Scope isolation | Only game files differ from the exact base; main and original feature branch remain at their recorded SHAs |

The repeated 30,000-sample audit rerun uses the same seed as the new test; it is
not counted as another distinct set of reachable states.

## Missing Page hash parity

| Path | Git blob SHA, identical in base and main |
|---|---|
| `missing-page/The_Missing_Page_Archivist_Casebook.pdf` | `077974c1302ec25b310ece2abaf026492fbe1ad6` |
| `missing-page/The_Missing_Page_Junior_Casebook.pdf` | `f0cec2e533b57dfbc97fdba8e7782ec5da2e8838` |
| `missing-page/The_Missing_Page_Sleuth_Casebook.pdf` | `d31cd13e7a9b9ece5d28ba7b063daaf25a4a7754` |
| `missing-page/don-sol-avatar.webp` | `ba0002509e9ed8e3e7b94e808555a011a1e0682a` |
| `missing-page/index.html` | `21b9cfae6d3a68ee0a2364520fbdb5ea1944341f` |

These files are preserved by retaining the complete base tree outside the game
folder. Remote tree/ref verification is part of the final commit handoff.

## Limits and review gate

The UI regressions execute the actual app functions in a deterministic
DOM-interface harness with controlled storage, telemetry and timers. HTML token
checks verify the tested injection payloads' attribute boundaries without
executing HTML. These results do not establish native browser layout, physical
keyboard/touch navigation, screen-reader speech, native dialog focus/inert
behavior, or Android/Capacitor WebView operation. No usable Chromium runtime was
available; those native checks remain outstanding.

The patch is ready for Don Sol's review. No Astra re-test has been requested and
no merge, deployment, publishing, or manuscript-canon change is authorized by
this report.
