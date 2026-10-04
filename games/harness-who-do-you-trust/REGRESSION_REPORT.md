# Harness Episode 001 — Issue #5 remediation r2 regression report

**Verdict: AUTOMATED REMEDIATION PASS — READY FOR DON SOL REVIEW.**

All four Issue #4 conditional-pass gaps have code fixes, exact Astra reproducers, controls, and broader property coverage. All 55 prior tests pass, and 2 of them were minimally maintained (listed below). All 24 prior audit groups pass. No merge or deployment was performed. Per Issue #5, no Astra re-test is requested until Don Sol reviews this patch.

| Audit identity | Value |
|---|---|
| Repository | `kevin121569/dean-don-sol-studio` |
| Task | [Issue #5](https://github.com/kevin121569/dean-don-sol-studio/issues/5), closing [Issue #4](https://github.com/kevin121569/dean-don-sol-studio/issues/4) gaps |
| Exact base branch | `fix/harness-wdyt-redteam-r1` |
| Exact base commit / sole commit parent | `c1dedcc97a774157724c1e3b99ac5652ea770d62` |
| Remediation branch | `fix/harness-wdyt-redteam-r2` |
| Fix revision | The commit containing this report (its SHA is in the Don Sol handoff) |
| Allowed scope | `games/harness-who-do-you-trust/` only (verified: no other path changed) |
| Runtime used for checks | Node.js `v24.18.0`, no dependencies; Chromium (in-app browser) smoke test |
| Report date | 2026-10-04 UTC |
| Main comparison commit | `b259244fd7b1391e139bf88e43a92049d8dfaa6d` (untouched) |

## Exact automated totals

| Run | Total | Pass | Fail | Skipped / cancelled / todo |
|---|---:|---:|---:|---:|
| Node test suite, all files | **71** | **71** | 0 | 0 / 0 / 0 |
| ↳ prior suite (`engine` 17 + `episode-001` 14 + `redteam` 24) | 55 | 55 | 0 | 0 / 0 / 0 |
| ↳ new r2 regressions (`redteam-r2.test.js`) | 16 | 16 | 0 | 0 / 0 / 0 |
| Astra-style audit groups (24 prior + 4 r2) | **28** | **28** | 0 | None |
| r2 regressions against exact unfixed base `c1dedcc` | 16 | 5 controls | 11 expected | 0 / 0 / 0 |
| r2 audit groups against exact unfixed base | 4 | 0 | 4 expected | None |

The 5 r2 tests that pass on the unfixed base are deliberate **controls**, so they must pass both before and after the fix:
- reset still cancels consult-all
- reset followed by a new-run START is still a cancellation
- the exactly-once nested repeat
- valid icons are accepted
- 60,000-state no-false-rejection

Every reproducer and gap-specific test fails on the base: [r2-base-reproducers.tap](tests/results/r2-base-reproducers.tap).

Evidence committed with the patch:
- [Node suite TAP, all 71](tests/results/node-test.tap)
- [Audit results + diagnostics, 28 groups](tests/results/astra-audit.json)
- [r2 regressions against the unfixed base](tests/results/r2-base-reproducers.tap)
- [r1 base reproducers](tests/results/base-reproducers.tap) (unchanged from r1)

Run from this game folder:

```sh
npm test
node --test --test-reporter=tap "tests/*.test.js"
node tests/astra-audit.mjs /tmp/harness-astra-audit.json
```

## Issue #4 gap → code fix → regression test

All r2 test names are in [tests/redteam-r2.test.js](tests/redteam-r2.test.js). Audit groups are prefixed `r2 gapN` in [tests/astra-audit.mjs](tests/astra-audit.mjs).

| Gap (Issue #4) | Code fix | Regression tests |
|---|---|---|
| **1 MEDIUM — CONSULT_ALL telemetry truncated by ordinary nested state change** | `js/app.js`: a `runGeneration` counter, bumped **only** by RESET, is captured per dispatch. Consult-all telemetry continues while the run is unchanged and stops only when a reset started a new run. r1 used `state !== next`, which treated any nested change as a cancellation. The same rule now governs `episode_complete`, which had the same root cause. The render/announce guard (`state !== next` → don't draw stale state) is deliberately unchanged, and commit-before-notify is untouched, so the r1 reset-overwrite fix holds. | `R2-1 Astra reproducer` (nested GO_TO_DECISION during BOY's event → 4 events, in order, matching committed advice) · `R2-1 control: reset during CONSULT_ALL` (1 event, reset state wins, no stale announcement, new run logs normally) · `R2-1 control: reset followed by new-run START` · `R2-1 same root cause` (nested VIEW_POSTMORTEM keeps `episode_complete`) · `R2-1 exactly once` (nested repeat consult-all: 4 updates + 4 intentional no-ops) · audit `r2 gap1` · browser: a live `harness:telemetry` listener clicking *I'm ready to decide* → 4 events logged |
| **2 MEDIUM — generated DOM ID collisions** | New `js/dom-ids.js` is the single source of every generated id (`ID_NAMESPACES`, `domId`, `STATIC_IDS`, `generatedIds`, `duplicateDomIds`). `js/app.js` now renders every content-derived id and ARIA reference through `domId` (output strings are byte-identical to r1). `js/content.js` runs `duplicateDomIds` with **the same functions** and rejects any episode whose generated ids would collide with each other or with a static id. | `R2-2 Astra reproducer` (`e_controller`→`body-e_monitor` rejected naming `ev-body-e_monitor`; app refuses to boot; unvalidated render shown to really collide) · `R2-2 pairwise` (72 ordered namespace pairs examined; the 4 collidable ones in the `ev-` family each solved for a colliding id and rejected) · `R2-2 property` (600 seeded adversarial id sets: **255 accepted** → every scene rendered with all ids unique and every ARIA/`for` reference resolving to exactly one element; **292 rejected** → each a genuine collision; 53 merged-id sets skipped as structurally invalid) · `R2-2 completeness` (every rendered id is enumerated; `STATIC_IDS` covers every literal id in `app.js` and `index.html`) · audit `r2 gap2` · browser: 59 ids unique, 29 references resolve once |
| **3 MEDIUM — relative asset URL validation bypass** | `js/content.js`: the r1 denylist is replaced with an **allowlist**, `^assets(/[A-Za-z0-9_-]+)+\.(svg\|png\|webp)$`. That shape excludes every whitespace/control character (which WHATWG URL parsing strips), schemes, `//`, backslashes, `%`-encoding, `.`/`..`, query and fragment. As a second guard, the value must resolve through `new URL()` to exactly the same local path. | `R2-3 Astra reproducers` (leading space, tab, newline, CR LF, protocol-relative, space + protocol-relative; each first shown to resolve **externally** in a WHATWG parser, then rejected) · `R2-3 broader` (38 more: schemes, NBSP/BOM/control chars, embedded tab, root-absolute, UNC/backslash, `..`, `%2e%2e`, `%2f`, `./`, `//`, query, fragment, trailing space, missing extension, wrong folder, non-strings) · `R2-3 valid relative icons` (accepted and resolve inside `assets/`) · audit `r2 gap3` · browser: all 4 icons load same-origin |
| **4 LOW — engine-impossible `discoveredEvidence` order** | `js/state.js`: restore requires the canonical visible prefix in episode order, then a hidden suffix that `revealOrderReachable()` can build by appending reveal chunks from consulted advisers. It mirrors `engine.js` exactly (`[...new Set(reveals)]`, first occurrence wins, already-discovered skipped). Which consult revealed what is not stored, so any legitimate sequence is accepted. | `R2-4 Astra reproducer` (reversed BOY save rejected; the real save restores) · `R2-4 broader` (exactly 1 of 120 orders of 5 items restores; exactly 1 of 24 visible-prefix orders) · `R2-4 append semantics` (second episode shape: either cross-adviser reveal order restores, a multi-item reveal keeps its listed order, hidden-before-visible rejected) · `R2-4 no false rejections` (**60,000** seeded reachable states across both episode shapes restore, including **211** runs with stale advice) · audit `r2 gap4` (+15,000 states) · browser: real save restores after reload, reversed copy discarded |

## Prior tests maintained (2) and harness changes, all disclosed

| File | Change | Why |
|---|---|---|
| `tests/redteam.test.js` | Static-hosting test title and pinned count `13` → `14` | It enumerates `js/` and pins the total as a tripwire. `js/dom-ids.js` is the deliberate new core module. |
| `tests/astra-audit.mjs` | Added `js/dom-ids.js` to the static resource list; added 4 `r2 gapN` groups; target metadata → r2 | Same new module; r2 audit coverage |
| `tests/ui-harness.js` | Imports and injects `domId` | The harness strips `app.js` imports and injects them by name |
| `tests/results/*` | `node-test.tap` and `astra-audit.json` regenerated; `r2-base-reproducers.tap` added | Evidence for this revision |

No other prior test changed. The icon validation message still contains *"icon must be a relative path"*, so the Issue #1 validator test passes unmodified.

## Preserved mechanics and required reruns

| Check | Result (r2) |
|---|---|
| Evidence order and BOY reveal timing | 120 permutations, 360 valid BOY timings |
| Adviser order / repeated consultation | 24 orders with repeats and consult-all |
| Hybrid gating | 32 subsets: 28 locked, 4 unlocked; locked submission rejected |
| Outcomes | 4 outcomes × minimal/full = 8 engine routes + 8 rendered app routes |
| Reset / restore / corrupt saves | 36 common corrupt saves rejected; reset persists briefing; restore re-verified in a real browser |
| Malformed content | 30 common content mutations rejected, plus all r1 and r2 cases |
| Reachable-state restore | r1 50,000 + r1 audit 30,000 (seed `0x51d27b93`, 1,233 completed) + r2 60,000 + r2 audit 15,000 |
| Reduced motion | 4 OS/manual combinations |
| Local-only hosting | 14 core resources HTTP 200, all same-origin (browser: 7 JS modules, all same-origin) |
| All 7 Issue #2 fixes / 11 original Astra reproducers | All `F1`–`F7` tests in `redteam.test.js` pass unmodified |
| `/missing-page/` parity | 5/5 files byte-identical to `main` (blob SHAs listed in the r1 section below, unchanged) |
| Scope | Only `games/harness-who-do-you-trust/` differs from base; `main` untouched |
| Console | No errors in the browser smoke test |

## Environment note (not a product defect)

On a Windows checkout with `core.autocrlf=true`, the **unmodified r1 base** reports 44/55 tests and 16/24 audit groups. `tests/ui-harness.js` strips imports with `/^import .*;\n/gm`, which does not match `\r\n`. On an LF checkout the same base is 55/55 and 24/24, matching r1's claims. All r2 numbers here come from an LF worktree. Recommended follow-up, deliberately not changed under Issue #5's scope: make that regex `\r?\n`, or add `.gitattributes` `* text eol=lf` for the game folder.

## Limits and review gate

The r2 regressions run the actual app functions in the deterministic DOM-interface harness. They were also smoke-tested in Chromium:
- live telemetry listener
- rendered id/ARIA uniqueness
- icon loading
- save restore and the reversed-order rejection across real reloads
- a full hybrid route

Physical keyboard/touch, screen-reader speech and Android WebView remain outstanding, as in r1.

Ready for Don Sol's review. No Astra re-test requested; no merge, deployment, publishing or canon change is authorized by this report.

---

# History — Issue #3 (r1) report, unchanged

## Harness Episode 001 — Issue #3 remediation regression report

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
