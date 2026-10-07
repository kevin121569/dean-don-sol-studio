# Harness Episode 001 — r6 remediation regression report (LOW ×2: validation fail-fast ordering)

**Verdict: AUTOMATED REMEDIATION PASS — READY FOR DON SOL REVIEW.**

Astra's r5 result was FAIL with two LOW validation-path findings; the accepted-content restore fix itself passed. r6 restructures `validateEpisode()` into four stages so cheap container checks run before any traversal.

Unchanged:
- `feasibleHistory()`, restore semantics and advice selection;
- `MAX_IDENTIFIER_LENGTH = 64` and the r4 `CONTENT_LIMITS`;
- every existing error message;
- all valid-content behavior.

The 107 existing tests pass **unmodified**, and the 31 existing audit groups pass. No merge or deployment.

| Identity | Value |
|---|---|
| Exact base / sole parent | `fix/harness-wdyt-redteam-r5` @ `16a272037bfaf2d70da99497b365f84e7505cceb` |
| Branch | `fix/harness-wdyt-redteam-r6` |
| Product change | `js/content.js` only (validation) |
| Scope | `games/harness-who-do-you-trust/` only; r5 and `main` not modified |
| Runtime | Node.js `v24.18.0`, LF checkout, no dependencies |
| Date | 2026-10-06 UTC |

## The staged validator

| Stage | Does | Never does |
|---|---|---|
| **1** | episode is an object | — |
| **2 — shape / cardinality** (`shapeProblems`) | container **types** and **lengths** for evidence, `advisorOrder`, `advisors`, `advice` (4 blocks, each a 1–8 list; per variant: `when` is an object, `when.inspected` 1–5, `reveals` 1–5), `hybridUnlock.inspected` 1–5, decisions 2–8; **then, only if decisions are bounded**, `postmortem` is an object with ≤ 8 keys | read an element of an unproven list; echo content; enumerate `postmortem` while decisions are over the limit |
| **3 — identifier length** (r5, `identifierLengthProblems`) | every id and reference ≤ 64, over collections stage 2 has **proven** bounded (`capped()` removed) | — |
| **4 — semantics** (unchanged rules) | safe ids, uniqueness, references, conditions, DOM ids, reachability | re-check cardinality (the duplicated r4 checks were removed: unreachable after stage 2) |

Each stage returns its problems and stops if there are any.

Error wording that moved into stage 2 is **verbatim**, which is why the existing message assertions pass unchanged. Content values interpolated into messages go through `show()`: strings over 64 characters print as `first16…(N characters)`, and non-strings print as `<type>`. Labels such as `advice.tooth[0] (tooth_reconciled)` include the id only when it is a short string. **Content is never altered.** Only message text is bounded.

**Why `postmortem` is enumerated at all.** When decisions are within the limit, stray keys must still be rejected (existing behavior). JavaScript has no early-exit own-key count. Measured: an early-break `for…in` over 300k keys costs the same as `Object.keys`, because V8 collects every key first. So stage 2 does one `Object.keys`, only after the decision count passes. Its cost is the same order as the `JSON.parse` that created those keys (table below).

## Exact totals

| Run | Total | Pass | Fail |
|---|---:|---:|---:|
| Node suite | **121** | **121** | 0 |
| ↳ existing 107 (`engine` 17, `episode-001` 14, `redteam` 24, `-r2` 16, `-r3` 13, `-r4` 10, `-r5` 13), unmodified | 107 | 107 | 0 |
| ↳ new `redteam-r6.test.js` | 14 | 14 | 0 |
| Audit groups (31 existing + 1 r6) | **32** | **32** | 0 |
| **Before:** r6 tests on r5 `16a2720` | 14 | 5 | 9 expected |

Evidence: [node-test.tap](tests/results/node-test.tap), [astra-audit.json](tests/results/astra-audit.json), [r6-on-r5.tap](tests/results/r6-on-r5.tap).

**What the 5 passes on r5 mean:**
- Three containers were already handled without traversal by r4's early exits: 9 variants, 6-entry `when.inspected`, 9 decisions.
- 5 × 300k `reveals` already stopped at the r5 length pass.
- Accepted max-boundary content was already valid.

They stay as regressions. The **9 r5 failures** are the genuine defects:
- oversized evidence / `reveals` / `hybridUnlock` traversed and echoed;
- scalar lists echoed;
- the shape-before-length ordering;
- postmortem enumerated while decisions > 8 (100k and 300k);
- the 100k-stray-key count message.

## Defect → fix → regression

| Defect | Fix (`js/content.js`) | Regressions (`tests/redteam-r6.test.js`; audit `r6 fail-fast`) |
|---|---|---|
| **A. Oversized / malformed collections bypassed the cheap guard** (`capped()` skipped them in the pre-pass; stage 4 then traversed and interpolated their contents) | Stage 2 rejects wrong-type and over-cardinality containers **before** any traversal. Stage 3 runs only on proven-bounded collections. Stage-4 message values are bounded by `show()`. | **Proxy-instrumented, zero element reads:** evidence ×6, advice ×9, `when.inspected` ×6, `reveals` ×6, `hybridUnlock.inspected` ×6, decisions ×9, each holding 300k-character ids/refs |
| | | **Boundaries:** evidence 5/6, variants 8/9, decisions 8/9, `reveals` 5/6, `hybridUnlock` 5/6 |
| | | `reveals` 5 × 300k refs → length errors only (bounded) |
| | | **13 malformed scalar / non-array forms** (`when.inspected` string/object/number, `reveals` string/array-like object, `hybridUnlock` and its list, evidence, decisions, an advice block, advice, `advisorOrder`, `when`) → exact existing message, content never echoed |
| | | **Ordering:** an over-limit container plus 300k ids elsewhere → only the shape error |
| | | Every rejection's error text < 2,000 chars |
| **B. `Object.keys(ep.postmortem)` ran before the decision-count check** | `postmortem` is read only after decisions are proven within 2–8; its key count ≤ 8 is stage 2, and exact equality with the decision ids stays in stage 4 | 9 decisions + **100k** and **300k** postmortem keys → rejected in ~0.05 ms with **0** `ownKeys` calls (Proxy); stray keys with decisions in range → still rejected (exact-set rule, **1** enumeration); 100k stray keys → count error, no keys echoed |
| Accepted content must not change | — | All limits at maximum at once (5 evidence, 8 variants × 4, 5-entry conditions, 5-entry hybrid, 8 decisions, ids at 64) → valid, plays, restores exactly; shipped episode valid |

## Before / after validation timings (same script, isolated runs)

| Invalid content | r5 validate | r5 error text | r6 validate | r6 error text |
|---|---:|---:|---:|---:|
| evidence ×100,000 | **949 ms** | 853 chars | **1.4 ms** | 46 chars |
| evidence ×6, ids 300k | 2.2 ms | **1,801,124 chars** | 0.1 ms | 41 chars |
| advice.boy ×9, ids 300k | 0.7 ms | 143 | 0.0 ms | 143 |
| `when.inspected` ×6 of 300k | 0.4 ms | 152 | 0.1 ms | 152 |
| `when.inspected` scalar 300k | 0.3 ms | **300,158** | 0.1 ms | 76 |
| `reveals` ×6 of 300k | 2.4 ms | **1,800,405** | 0.1 ms | 124 |
| `reveals` scalar 300k | 0.5 ms | **300,243** | 0.1 ms | 59 |
| `hybridUnlock.inspected` ×6 of 300k | 1.7 ms | **1,800,329** | 0.0 ms | 113 |
| decisions ×9 + 100k postmortem keys | **152 ms** (enumerated) | 110 | **0.0 ms** (0 enumerations) | 110 |
| decisions ×9 + 300k postmortem keys | **634 ms** (enumerated) | 110 | **0.0 ms** (0 enumerations) | 110 |
| stray postmortem key, decisions OK | 0.2 ms (1 enumeration) | 54 | 2.5 ms (1 enumeration) | 54 |

## Performance, separated

**1. Valid accepted-content restore bound** (r3 / r4 / r5, unchanged):
- ≤ 930 search states and ≤ 120 `selectAdvice` calls;
- ≤ 8 variants × ≤ 5-entry conditions, ≤ 8 decisions;
- ids ≤ 64;
- ≲ 1.3 × 10⁵ comparisons of ≤ 64-char strings per restore.

Re-measured in this suite, at the id limit: `store.load()` p50 0.10 ms, p99 1.05 ms under full-suite load (r5 isolated: 0.032 / 0.29 ms).

**2. Invalid-content validation bound** (r6):
- Stage 2 reads only container types and lengths. It visits at most 4 adviser blocks × ≤ 8 variants (proven bounded first), plus at most one `Object.keys(postmortem)`, and only once decisions ≤ 8.
- Stages 3–4 run only on proven-bounded collections; message text is bounded per value.
- Measured: over-limit containers and over-long ids are rejected in **≤ 1.4 ms**, with **≤ 674 characters** of error text across every case here.
- **Exception, stated plainly:** with decisions in range, a `postmortem` holding N stray keys costs one O(N) enumeration (106 ms at N = 300k). That's the same order as the parse below.

**3. Unavoidable `fetch` / `JSON.parse` before validation** (validation cannot run on bytes it hasn't parsed):

| Payload | File size | `JSON.parse` | Validation after parse |
|---|---:|---:|---:|
| shipped episode | 0.01 MB | 0.2 ms | ~4–9 ms (full semantic + reachability) |
| evidence ids 300k | 1.5 MB | 9.9 ms | 0.08 ms |
| evidence ×100,000 | 29.6 MB | 245 ms | 0.06 ms |
| decisions ×9 + 300k postmortem keys | 3.5 MB | 174 ms | 0.03 ms |
| decisions OK + 300k stray postmortem keys | 3.5 MB | 171 ms | 106 ms (one enumeration) |

The real `loadEpisode()` timings in the suite (10k / 100k / 300k ids: 391 / 844 / 2,324 ms under load) are dominated by `fetch` + parse. Episode file size is outside what content validation can bound.

## Preserved (re-run)

| Check | Result |
|---|---|
| r3 exact differential | tiny1 104,720 / tiny2 50,640: 0 false accepts, 0 false rejects; 10,000 mutations; 194,852 reachable saves |
| Reachable-save controls | r2 60,000; r3 194,852; r4 14,400; r5 10,800 at the id limit; none rejected |
| r4 pathological arrays | 100k-condition and 100k-variant cases rejected in ≤ 0.1 ms |
| r5 identifier reproducers / boundaries | 10k / 100k / 300k refused via the real `loadEpisode()`; 63 / 64 / 65 per namespace; 1e6-char ids; near-identical 64-char ids |
| Accepted max-boundary content | all limits at maximum at once: valid, plays, restores |
| `/missing-page/` | 5/5 byte-identical to current `main` (`c3a5868`) |

**Not touched, as instructed:** native accessibility / device follow-ups, deployment, homepage linking, the CRLF harness issue, repository governance.

Ready for Don Sol's review. No merge, deployment, publishing or canon change.

---

# History — r5, r4, r3, r2 and r1 reports, unchanged

## Harness Episode 001 — r5 remediation regression report (LOW: identifier length)

**Verdict: AUTOMATED REMEDIATION PASS — READY FOR DON SOL REVIEW.**

Astra's r4 result was FAIL for one LOW finding: identifier lengths were unbounded, so content satisfying every r4 cardinality limit could still make restore materially slower.

r5 adds one validation bound, `MAX_IDENTIFIER_LENGTH = 64`. It covers every content-chosen identifier and every reference to one, and it is checked **first**, before any downstream work.

Unchanged:
- engine, advice selection, restore, `feasibleHistory()` and the r4 `CONTENT_LIMITS`;
- identifiers are never truncated or normalized;
- the 94 existing tests pass **unmodified**;
- the 30 existing audit groups pass.

No merge or deployment.

| Identity | Value |
|---|---|
| Exact base / sole parent | `fix/harness-wdyt-redteam-r4` @ `3b9a5d9ca707795e03a5d0dc57a77cf254b9d225` |
| Branch | `fix/harness-wdyt-redteam-r5` |
| Product change | `js/content.js` only (validation) |
| Scope | `games/harness-who-do-you-trust/` only; `main`, r4 and r3 not modified |
| Runtime | Node.js `v24.18.0`, LF checkout, no dependencies |
| Date | 2026-10-06 UTC |

## Why a separate constant, not `CONTENT_LIMITS.maxIdentifierLength`

The preferred shape was tried first. The existing r4 test pins `CONTENT_LIMITS` to exactly its three keys, so adding a fourth key **failed an existing test** (93/94). Since the existing tests and r4's limits must stay unchanged, the bound is the single shared export `MAX_IDENTIFIER_LENGTH`. It is used by:
- the pre-pass;
- `isId()`, so every safe-identifier check, including the DOM-id gate, implies the bound;
- every error message.

## Exact totals

| Run | Total | Pass | Fail |
|---|---:|---:|---:|
| Node suite | **107** | **107** | 0 |
| ↳ existing 94 (`engine` 17, `episode-001` 14, `redteam` 24, `-r2` 16, `-r3` 13, `-r4` 10), unmodified | 94 | 94 | 0 |
| ↳ new `redteam-r5.test.js` | 13 | 13 | 0 |
| Audit groups (30 existing + 1 r5) | **31** | **31** | 0 |
| **Before:** r5 tests on r4 `3b9a5d9` | 13 | 2 controls | 11 expected |

The 2 controls (distinct 64-character ids stay distinct; at-limit content is bounded) hold on both commits.

Evidence: [node-test.tap](tests/results/node-test.tap), [astra-audit.json](tests/results/astra-audit.json), [r5-on-r4.tap](tests/results/r5-on-r4.tap).

## Complete identifier namespace audit

Established by reading every use in `content.js`, `state.js`, `advice.js`, `engine.js`, `dom-ids.js`, `telemetry.js` and `app.js`.

| Namespace | Content-controlled? | Where it flows | r5 bound |
|---|---|---|---|
| Episode `id` | yes | save `episodeId`, restore equality, storage key `harness-wdyt:<id>:v1`, telemetry `episode` | **≤ 64**, identifier |
| Evidence `id` | yes | saves (discovered / inspected), restore Maps and `includes`, feasible-history position map, DOM ids (5 namespaces), `data-id`, telemetry | **≤ 64**, identifier |
| Advice variant `id` | yes | saves (consultations), restore lookup and comparison, feasible-history match mask, telemetry | **≤ 64**, identifier |
| Decision `id` | yes | saves (decisions / outcome), restore Map, DOM ids (`dec-`, `lock-`), radio `value`, telemetry | **≤ 64**, identifier |
| `when.inspected[]` | yes (references) | `selectAdvice()` `includes`, restore conditions | **≤ 64**, reference; also ≤ 5 entries (r4) |
| `reveals[]` | yes (references) | engine append, restore reveal checks, feasible-history positions | **≤ 64**, reference; ≤ 5 (unique known ids) |
| `hybridUnlock.inspected[]` | yes (references) | `isHybridUnlocked()` in selection and restore | **≤ 64**, reference; ≤ 5 (unique known ids) |
| Postmortem keys | yes (references) | must equal the decision-id set; looked up by decision id | **≤ 64**, reference (stray keys too) |
| Adviser ids; `advisorOrder`; `advisors` / `advice` / `postmortem[].advisors` keys | **no**: exactly `boy, tooth, darth, donsol` | trust keys, `trust-` / `adv-` / `consult-` DOM ids | fixed enum (≤ 6 chars) |
| `when` keys | **no**: ⊆ {inspected, hybridUnlocked, consultedFewerThan} | selection | fixed enum |
| `rating` | **no**: strong / weak / mixed | render only | fixed enum |
| `version` | integer | save equality | positive integer |
| Advisor `icon` | yes (asset path, not an identifier) | `<img src>` and validation regex / URL only; **not** on restore, persistence or comparison | allowlist regex (r2); length category 4 below |
| Text (titles, bodies, advice text, outcomes, postmortem text, hints) | yes | render only | category 4 below |

**Derived identifiers** are all bounded once their source is:
- DOM ids: fixed prefix + id ≤ 64;
- the storage key;
- save fields;
- telemetry fields.

## Defect → fix → regression

| Defect (Astra, LOW) | Fix (`js/content.js`) | Regressions (`tests/redteam-r5.test.js`; audit `r5 identifier length`) |
|---|---|---|
| Identifier length unbounded; restore grows with it (Astra fixture: 10k / 100k / 300k-char evidence ids, all r4 limits satisfied) | `MAX_IDENTIFIER_LENGTH = 64`. The `identifierLengthProblems()` pre-pass runs **first** and returns early, before any lookup, comparison, DOM-id generation or reachability. It visits all 8 content namespaces above, iterating only collections already capped by r4 or the evidence range. `isId()` includes the bound. | **Identifiers** (episode, evidence, advice variant, decision): 63 and 64 accepted; 65 rejected with the exact field and limit, and only length errors returned; empty / non-string / null rejected |
| | | **References** (`when.inspected`, `reveals`, `hybridUnlock.inspected`): 65 rejected with the exact field first; an at-limit dangling reference is still judged "unknown" |
| | | **Postmortem key:** a stray 65-char key rejected |
| | | **1,000,000-char repeated-prefix ids** in 5 namespaces: only length errors, **0.02 ms** |
| | | **Distinct 64-char ids differing only in the last character:** accepted, DOM ids unique, played, saved and restored exactly, and a swap is not equivalent |
| | | **Astra reproducer via the real `loadEpisode()`:** 10k / 100k / 300k refused with the exact message |
| | | **At-limit worst case** (below) |
| **No truncation or normalization** | Over-length is an error; the episode does not load | Error text states "identifiers are never truncated"; the near-identical-ids test proves no equivalence |

## Before / after timings

Astra's fixture: 5 evidence, 4 advisers, 8 variants per adviser, 5-entry `when.inspected`, 8 decisions, evidence ids at the given length with all references updated. Path: real `loadEpisode()` over HTTP → reducer-produced saves → `createStore().load()`.

| Evidence id length | r4: load | r4 `store.load()` p50 / p99 / max | save size | r5 |
|---:|---|---|---:|---|
| short | accepted | 0.076 / 0.49 / 1.1 ms | 0.5 KB | accepted, 0.071 / 0.42 / 0.85 ms |
| 63 | accepted | — | 0.8 KB | accepted, 0.075 / 0.60 / 0.70 ms |
| **64** | accepted | — | 0.8 KB | **accepted, 0.057 / 0.37 / 0.60 ms** |
| 65 | accepted | — | — | **rejected** (exact message) |
| 10,000 | accepted | 0.26 / 1.18 / 1.9 ms | 60 KB | **rejected** |
| 100,000 | accepted | 1.49 / 8.32 / 8.3 ms | 900 KB | **rejected** |
| 300,000 | accepted | **7.69 / 28.6 / 28.6 ms** | **2.7 MB** | **rejected** |

At 300k-character ids, r4's save size (2.7 MB) also approached typical localStorage quotas, a persistence risk that is now removed.

**At the limit, every content identifier at 64** (evidence, advice variants, decisions, episode), same shape, 10,800 loads of real and forged-order saves:
- `store.load()`, isolated run: **p50 0.032 ms, p99 0.29 ms, max 1.3–4.4 ms** (isolated garbage-collection pauses);
- the same test during the concurrent full suite: p50 0.072 ms, p99 0.66 ms, max 5.5 ms;
- largest save 1,391 bytes;
- search states ≤ 108 / 930; `selectAdvice` ≤ 78 / 120.

**Honest note:** the real `loadEpisode()` still takes 55 / 160 / 464 ms isolated (240 / 480 / 1,251 ms under full-suite load) to *reject* the 10k / 100k / 300k fixtures. That time is spent in `fetch` and `JSON.parse` of the multi-megabyte file **before** validation runs. Validation itself is 0.02 ms, and no restore runs. Raw episode file size is not something content validation can bound (category 4).

## Performance claim, by category

| # | Category | Status |
|---|---|---|
| 1 | **Search-state count** (r3) | ≤ (I+1)(H+1)·Σ2^k = **930** states; ≤ **120** memoized `selectAdvice()` calls |
| 2 | **Array cardinality** (r4) | variants ≤ 8 per adviser; `when.inspected` ≤ 5 unique; decisions ≤ 8; evidence ≤ 5; reveals / hybrid ≤ 5 unique known ids; advisers = 4 |
| 3 | **Identifier / string size on restore** (r5) | every identifier and reference ≤ **64** characters. Fixed enums ≤ 18 chars. Restore reads no other content strings. So each comparison / hash on the restore path is O(64), and per-restore work is ≲ 1.3 × 10⁵ comparisons × O(64) character operations |
| 4 | **Still unbounded, not on restore** | text fields (titles, bodies, advice text, outcomes, postmortem text, hints) and the `icon` path length: they affect episode file size, `fetch` + `JSON.parse` time and render time, never restore, persistence or comparisons. A tampered local save is parsed and shape-checked in time linear in its own size (unchanged from r3/r4; device-local data, not content). |

## Preserved (re-run)

| Check | Result |
|---|---|
| r3 exact differential | tiny1 104,720 / tiny2 50,640 candidates: 0 false accepts, 0 false rejects; 10,000 mutations; 194,852 reachable saves restored |
| Reachable-save controls | r2 60,000; r3 194,852; r4 14,400 within-limit; r5 10,800 at the id limit; no genuine save rejected |
| r4 reproducers | 100k-condition and 100k-variant cases rejected (< 1 ms); boundaries unchanged |
| Stale / re-entrant advice; overlapping and multi-item reveals; all three condition types; gameplay, telemetry / reset, persistence, id / asset defenses, reduced motion, local hosting | existing 94 tests + 30 audit groups: pass, unmodified |
| `/missing-page/` | 5/5 byte-identical to current `main` |

**Not touched, as instructed:** the CRLF harness issue; native keyboard / touch / screen-reader / Android checks; homepage linking; deployment; the r3 content already on `main`.

Ready for Don Sol's review. No merge, deployment, publishing or canon change.

---

## History — r4, r3, r2 and r1 reports, unchanged

## Harness Episode 001 — r4 remediation regression report (LOW: content-size restore performance)

**Verdict: AUTOMATED REMEDIATION PASS — READY FOR DON SOL REVIEW.**

Astra's r3 result was PASS WITH RESIDUAL RISKS, with one LOW finding: restore execution time was not bounded by r3's documented state bounds, because each `selectAdvice()` call scans schema-valid advice and condition arrays of unbounded size.

r4 bounds content complexity at **validation time**, with explicit limits and actionable errors. It does **not** touch the engine, `selectAdvice()`, `feasibleHistory()`, or any restore semantics:
- the 84 existing tests pass **unmodified**;
- the 29 existing audit groups pass;
- the r3 exact differentials still show 0 false accepts and 0 false rejects.

No merge or deployment.

| Identity | Value |
|---|---|
| Exact base / sole parent | `fix/harness-wdyt-redteam-r3` @ `0e89c929d0bb527890ba3e9fe07908c623603388` |
| Branch | `fix/harness-wdyt-redteam-r4` |
| Product change | `js/content.js` only (validation). `engine.js`, `advice.js`, `state.js`, `app.js`: unchanged. |
| Scope | `games/harness-who-do-you-trust/` only; this patch does not touch `main` |
| `main` (observed, not changed here) | advanced independently to `0b64ea440798d6434164a1fc57ffc6e25bf55eea`. Its game folder is **byte-identical to r3** (tree `4f3592aa…`), so r3 is on `main` (unlinked from the homepage). **r4 is not.** `/missing-page/` 5/5 identical to this `main`. |
| Runtime | Node.js `v24.18.0`, LF checkout, no dependencies |
| Date | 2026-10-06 UTC |

## Exact totals

| Run | Total | Pass | Fail |
|---|---:|---:|---:|
| Node suite | **94** | **94** | 0 |
| ↳ existing 84 (`engine` 17, `episode-001` 14, `redteam` 24, `redteam-r2` 16, `redteam-r3` 13), unmodified | 84 | 84 | 0 |
| ↳ new `redteam-r4.test.js` | 10 | 10 | 0 |
| Audit groups (29 existing + 1 r4) | **30** | **30** | 0 |
| **Before:** r4 tests on r3 `0e89c92` | 10 | 3 controls | 7 expected |

Skipped / cancelled / todo: 0 / 0 / 0. Evidence: [node-test.tap](tests/results/node-test.tap), [astra-audit.json](tests/results/astra-audit.json), [r4-on-r3.tap](tests/results/r4-on-r3.tap).

The 3 r4 tests that pass on r3 are deliberate **controls**, which must pass on both commits:
- every evidence condition stays expressible;
- at-limit content plays and restores;
- the within-limits restore cost is identical, because restore code is unchanged.

## Defect → fix → regression

| Defect (Astra, LOW) | Fix (`js/content.js`) | Regressions (`tests/redteam-r4.test.js`; audit `r4 content limits`) |
|---|---|---|
| **1.** `when.inspected` of any length (100,000 entries) accepted; satisfied conditions scan it on every selection | `when.inspected` must have **≤ `CONTENT_LIMITS.maxWhenInspected` = 5** entries **and no repeated id**. Repeats never change meaning under `every(includes)`, so uniqueness rejects no distinct condition. The length is checked first, before any per-entry work. | Below/at/above: 4 and 5 unique accepted, 6 rejected (exact message); any repeat rejected; all 31 non-empty evidence sets still expressible; Astra case 1 rejected in 0.2–0.3 ms |
| **2.** Any number of variants per adviser (100,000) accepted; every selection scans them; validation took ~15–16 s | **≤ `CONTENT_LIMITS.maxAdviceVariantsPerAdviser` = 8** per adviser. Checked before scanning; an oversized block is not iterated, and its unscanned reveals do not produce a spurious "never revealed" error. | Below/at/above for **each** of the 4 advisers: 7 and 8 accepted, 9 rejected (exact message); Astra case 2 rejected in 0.2–0.3 ms with one error per adviser |
| **Same root cause, third array on the restore path:** decisions (restore indexes them; the postmortem key comparison is quadratic in them) | **≤ `CONTENT_LIMITS.maxDecisions` = 8.** Checked before the decision/postmortem/DOM-id/reachability checks, which then return early. | 7 and 8 accepted, 9 rejected (exact message) |
| **Runtime path** | Unchanged: `app.js` boot validates through `loadEpisode()` **before** `createStore()`, so `restoreState()` is reachable only with validated content | App-boot test: over-limit content shows *Episode could not load* with the `CONTENT_LIMITS` message, the save key is **never read**, and the app does not start. Control: at-limit content boots normally. |

**Completeness of the limit set.** The restore path (`state.js`, `advice.js`) reads these content arrays:
- `evidence` (already ≤ 5);
- `advisorOrder` (exactly 4);
- `advice[a]` (now ≤ 8);
- each `when.inspected` (now ≤ 5, unique);
- each `reveals` (already unique known ids, ≤ hidden count);
- `hybridUnlock.inspected` (already unique known ids, ≤ 5);
- `decisions` (now ≤ 8).

No other content array is read by restore. Text fields are never scanned.

**No truncation and no divergence.** Content outside a limit is a validation error, so the episode does not load. Nothing is clipped, and engine selection semantics are identical for every accepted episode.

## Shipped content

| | Limit | Shipped |
|---|---:|---:|
| Variants per adviser (boy / tooth / darth / donsol) | 8 | 1 / 3 / 2 / 3 |
| `when.inspected` entries (max) | 5 | 3 (all unique) |
| Decisions | 8 | 4 |

`validateEpisode(shipped) = []`, and all r1–r3 fixtures remain valid.

## Before / after performance (same script on both commits, Node 24, medians)

| Content | r3 validate | r3 restore | r4 validate | r4 runtime |
|---|---:|---:|---:|---|
| Shipped | accepted, 2.1 ms | 0.24 ms | accepted, 2.4 ms | 0.28 ms (same code; noise) |
| Astra case 1 (100k `when.inspected`, satisfied) | **accepted**, 105 ms | **10.5 ms** | **rejected, 0.2 ms** | never reached |
| Astra case 2 (100k variants × 4 advisers) | **accepted, 14.6 s** | **908 ms** | **rejected, 0.2 ms** | never reached |

**Honest note:** `restoreState()` is unchanged. Called **directly** with rejected content (bypassing the loader), it is still slow: 15.7 ms and 962 ms in the same run. Protection is the single load gate, which keeps validator and runtime semantics in one place. The app-boot regression proves the app cannot reach restore without passing that gate. Astra's environment measured 86 ms / 301 ms on r3; the absolute numbers differ with environment and save shape, but the scaling defect reproduces.

## Restore cost bound for accepted content (search vs execution)

**Search-state complexity** (r3, unchanged):
- ≤ (I+1)(H+1)·Σ2^k = 6·5·31 = **930** states;
- ≤ 4·6·5 = **120** memoized `selectAdvice()` calls.

**Total execution complexity** (r4 bounds the per-call factor):

| Term | Bound |
|---|---|
| One `selectAdvice()` call | ≤ 8 variants × (`when.inspected` 5 × prefix 5 + hybrid 5 × prefix 5 + consulted 4) ≈ **432** comparisons |
| Feasible-history search | ≤ 120 × 432 ≈ 52k (selections) + 930 states × 5 successors × 4 reveals ≈ 19k (transitions) |
| r1 per-advice selectability check | ≤ 4 advisers × 6 prefixes × 5 counts × 432 ≈ 52k |
| Remaining reference/invariant checks | O(E·V·R) ≤ 5·4·8·4 |
| **Per restore** | **≲ 1.3 × 10⁵ elementary comparisons**, independent of content size within the limits |

**Measured, adversarial worst case within the limits:**
- every limit at maximum, every `when` key used, every `when.inspected` listing all 5 ids;
- 8 decisions, 1 visible and 4 hidden evidence;
- 14,400 restores: real random-walk saves plus forged-order versions that force exhaustive search.

Results:
- search states max **105 / 930**; `selectAdvice` max **78 / 120**;
- restore **p50 0.05–0.07 ms, p99 0.31–0.53 ms**, p99.9 ≤ 1.0 ms;
- isolated maxima of a few ms (up to 20 ms under full-suite load) are garbage-collection pauses, not search growth.

The test asserts the state and selection bounds, plus a generous p99 < 5 ms ceiling, so it doesn't flake in CI.

**Validation cost** for accepted content is bounded by the same limits (r1 reachability ≤ 3⁵·2⁴ states). Over-limit content is rejected in < 1 ms.

## Preserved (re-run)

| Check | Result |
|---|---|
| r3 feasible-history differentials | tiny1 104,720 / tiny2 50,640 candidates: 0 false accepts, 0 false rejects; 10,000 mutations; 194,852 reachable Astra saves restored |
| Stale / re-entrant advice; overlapping and multi-item reveals; all three condition types | r3 cases 1–6 and controls, r2/r1 suites: pass, unmodified |
| Gameplay, telemetry/reset, persistence, ID/asset defenses, reduced motion, local hosting | existing suites + 29 audit groups: pass |
| `/missing-page/` | 5/5 byte-identical to `main` |

## Residual (not in scope; reported, not changed)

- A **tampered local save** is parsed and shape-checked in time linear in its own size before rejection. It is device-local data, not content, and is unchanged from r3.
- Render cost of very long text fields is unaffected by these limits; it is not on the restore path.
- Follow-ups unchanged: the CRLF harness import stripping; native keyboard / touch / screen-reader / Android checks.

Ready for Don Sol's review. No merge, deployment, publishing or canon change.

---

## History — r3, r2 and r1 reports, unchanged

## Harness Episode 001 — Issue #7 remediation r3 regression report

**Verdict: AUTOMATED REMEDIATION PASS — READY FOR DON SOL REVIEW.**

The Issue #6 MEDIUM save-history defect is fixed. Restore now requires **one feasible engine history** that explains the save's discovery order, inspection order, first-consultation order and every saved advice line at once. An exact differential against a reference explorer driving the real engine shows the validator accepts **exactly** the reachable saves: 0 false accepts and 0 false rejects. All 71 prior tests and all 28 prior audit groups pass, and **no prior test was modified**. No merge or deployment. Per Issue #7, no Astra re-test is requested until Don Sol reviews r3.

| Audit identity | Value |
|---|---|
| Task | [Issue #7](https://github.com/kevin121569/dean-don-sol-studio/issues/7), from the [Issue #6](https://github.com/kevin121569/dean-don-sol-studio/issues/6) re-test |
| Exact base / sole parent | `fix/harness-wdyt-redteam-r2` @ `1babcff446b7cb49630474df9d8b43857d9d135c` |
| Remediation branch | `fix/harness-wdyt-redteam-r3` |
| Fix revision | The commit containing this report (SHA in the Don Sol handoff) |
| Product change | `js/state.js` only |
| Scope | `games/harness-who-do-you-trust/` only (verified); `main` untouched at `b259244fd7b1391e139bf88e43a92049d8dfaa6d` |
| Runtime | Node.js `v24.18.0`, LF checkout, no dependencies; Chromium smoke test |
| Report date | 2026-10-04 UTC |

## Exact totals

| Run | Total | Pass | Fail |
|---|---:|---:|---:|
| Node suite, all files | **84** | **84** | 0 |
| ↳ prior (`engine` 17 + `episode-001` 14 + `redteam` 24 + `redteam-r2` 16), unmodified | 71 | 71 | 0 |
| ↳ new `redteam-r3.test.js` | 13 | 13 | 0 |
| Astra-style audit (28 prior + 1 r3) | **29** | **29** | 0 |
| **Before:** r3 tests on r2 `1babcff` | 13 | 3 controls | 10 expected |
| **Before:** audit on r2 `1babcff` | 29 | 28 | 1 (the r3 group) |

Skipped / cancelled / todo: 0 / 0 / 0. Suite duration ≈ 50 s. Almost all of it is the exhaustive differentials, about 350,000 real-engine saves restored.

## Before / after proof

Evidence: [r3-on-r2.tap](tests/results/r3-on-r2.tap) (before) and [node-test.tap](tests/results/node-test.tap) (after).

| r3 test | r2 `1babcff` | r3 |
|---|---|---|
| Fixtures are valid episodes (control) | pass | pass |
| Case 1 — Astra exact: unsatisfied `when.inspected` order forged | **FAIL (accepted)** | pass |
| Case 2 — `when.hybridUnlocked` order forged (+ stale re-consult control) | **FAIL** | pass |
| Case 3 — `when.consultedFewerThan` first-in order for an adviser consulted second | **FAIL** | pass |
| Case 4 — first-consultation order swapped on a re-consulted save | **FAIL** | pass |
| Case 5 — revealed item opened before the reveal's prerequisite | **FAIL** | pass |
| Case 6 — phantom: hidden item only an unsatisfied variant reveals | **FAIL** | pass |
| Stale advice on shipped episode (control) | pass | pass |
| Differential, tiny episode 1 (104,720 candidate saves) | **FAIL: 5,055 false accepts** | pass: 0 / 0 |
| Differential, tiny episode 2 (50,640 candidate saves) | **FAIL: 7,444 false accepts** | pass: 0 / 0 |
| Seeded mutations ×4 episodes (10,000; 1,566 impossible) | **FAIL** | pass |
| Every reachable Astra-fixture save restores (control, 194,852) | pass | pass |
| Performance bound | FAIL (`feasibleHistory` absent in r2) | pass |

Neither r2 nor r3 ever falsely **rejected** a reachable save. The r2 defect was purely false acceptance.

## Defect → code fix → regression

| Defect | Code fix | Regressions |
|---|---|---|
| **MEDIUM — conditional-reveal save reachability** (Issue #6). r2's `revealOrderReachable()` could pick a reveal variant whose `when` conditions were never true at the moment of any consultation in a history consistent with the save. | `js/state.js`: `revealOrderReachable()` is **replaced** by `feasibleHistory()`, a breadth-first search over engine histories (details below). Restore fails with `no feasible engine history …` when none exists. The canonical-visible-prefix gate and the r1 per-advice checks remain as fast necessary conditions. | `redteam-r3.test.js`: cases 1–6 with legitimate engine-produced controls; stale/re-consult controls; exact differential on two tiny episodes; seeded mutation differential on Astra/shipped/phantom/first-in fixtures; exhaustive no-false-rejection on the Astra fixture; performance bound. Audit group `r3 feasible history` (Astra exact case + all 87,142 reachable shipped saves restore). |

### How `feasibleHistory()` meets each Issue #7 requirement

| # | Requirement | Mechanism |
|---|---|---|
| 1 | Canonical initial visible order | Search starts at `createInitialState()`'s visible prefix; the prefix gate runs first |
| 2 | Monotonic inspection growth, feasible order | Opens follow the saved `inspectedSources` order, and an item may be opened only after it is discovered at that point in the history |
| 3 | Consultation order / re-consults | New advisers join only in saved first-consultation order; already-consulted advisers may be re-consulted at any point, any number of times |
| 4 | `selectAdvice()` first-match | Every consult calls the shared `selectAdvice()` on the state **at that moment** |
| 5 | `when.inspected` / `hybridUnlocked` / `consultedFewerThan` true when selected | Evaluated by `selectAdvice()` against the inspected prefix and consulted count at that moment |
| 6 | Reveal append + dedupe exactly as engine | `[...new Set(reveals)]`; already-discovered ids skipped; each new id must be the next saved id (discovery only appends) |
| 7 | Final `discoveredEvidence` order | Goal requires discovered length = saved length, and every step must stay a prefix of the saved order |
| 8 | Saved latest advice reachable, including stale | Goal requires each adviser's **last** selected advice to equal the saved line; stale lines arise naturally when a later inspection or consultation would select differently |

**Why the state space is small (exact, not approximate):** `selectAdvice(adviser)` reads only the inspected prefix and how many *other* advisers are consulted, never which advice they hold. So the search state is (opened count `i`, discovered length `d`, consulted count `k`, a match bitmask `m`), where bit `j` records whether adviser `j`'s current advice equals the saved line. The two-way exhaustive differential confirms the abstraction loses nothing.

## Performance bounds

| Quantity | Formula | Packet maximum (5 evidence, ≥1 visible, 4 advisers) | Measured worst-case shape* |
|---|---|---:|---:|
| Search states | (I+1)·(H+1)·Σ_{k=0..C} 2^k | 6·5·31 = **930** | max **128** explored |
| Successors per state | ≤ C+1 | 5 | — |
| `selectAdvice()` calls (memoized per adviser, i, k) | ≤ C·(I+1)·(C+1) | 4·6·5 = **120** | max **76** |
| Time per search (warmed) | — | — | p50 **0.010 ms**, p99 **0.17 ms**, p99.9 **0.50 ms**, max 4.6 ms (GC pause) |

\*157,158 searches: every reachable save of a 1-visible/4-hidden, all-`when`-keys episode, plus a forged variant of each.

The bound is **independent of how many advice variants an adviser has**, so content authors can't make restore slow. Restore runs once per page load. Across all 194,852 reachable Astra-fixture saves, full `restoreState()` averaged about 0.09 ms (r2: about 0.02 ms). There's no user-visible effect on web or Android.

## Preserved (re-run)

| Check | Result |
|---|---|
| All 11 original Astra reproducers / 7 Issue #2 fixes | `redteam.test.js` 24/24, unmodified |
| All 4 Issue #4 fixes | `redteam-r2.test.js` 16/16, unmodified (72/4/4 namespace pairs; 255 accepted / 292 rejected id sets; 60,000 states / 211 stale runs) |
| 120 evidence permutations / 360 BOY timings | audit pass |
| 24 adviser orders | audit pass |
| 32 subsets (28 locked / 4 unlocked), locked hybrid rejected | audit pass |
| 8 minimal/full outcome routes (engine + rendered) | audit pass |
| Reset / restore / reduced motion (4 combos) / local hosting (14 resources) | audit pass; Chromium: stale-advice save restored exactly after reload, full hybrid route, all resources same-origin, no console errors |
| `/missing-page/` | 5/5 byte-identical to `main` |

## Follow-ups (unchanged, not folded in)

- `tests/ui-harness.js` CRLF-sensitive import stripping (`\n` → `\r?\n`). All numbers here come from an LF checkout.
- Native browser, physical keyboard, touch, screen reader and Android WebView verification.

Ready for Don Sol's review. No Astra re-test requested; no merge, deployment, publishing or canon change.

---

## History — Issue #5 (r2) and Issue #3 (r1) reports, unchanged

## Harness Episode 001 — Issue #5 remediation r2 regression report

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

## History — Issue #3 (r1) report, unchanged

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
