# Regression Report — The Harness: Who Do You Trust? · Episode 001 v0.1

**For:** Don Sol review (Issue #1, packet Stage C → D)
**Branch:** `feature/harness-wdyt-episode-001-v0.1` (from `main` @ `54174f6`)
**Status:** Not merged, not deployed, not linked from the site, `noindex`.
**Revision:** 2 — adds Don Sol review hardening (Issue #1 comment, 2026-10-03). Revision 1 was `bdcf40c`.

## Issue #1 deliverables — all on this branch

Paths are relative to `games/harness-who-do-you-trust/`.

| Deliverable | Path |
|---|---|
| Separated HTML / CSS / JS | `index.html` · `css/game.css` · `js/app.js` (presentation only) |
| Serializable, presentation-independent state | `js/state.js` |
| Pure rules engine | `js/engine.js` |
| Episode 001 data file | `data/episode-001.json` |
| Content loader + validator | `js/content.js` |
| Local telemetry interface | `js/telemetry.js` |
| Tests | `tests/engine.test.js` · `tests/episode-001.test.js` (`package.json` = `"type": "module"`, no dependencies) |
| Android / Capacitor notes | `android/capacitor-notes.md` |
| Assets | `assets/characters/*.svg`; `assets/ui/`, `assets/audio/` reserved (README only) |
| Regression report | this file |

## Don Sol review hardening

**1. `restoreState()` rejects corrupted or inconsistent saves** (`js/state.js`). A save now has to look like one that real play could have produced, or the game starts fresh. It runs three layers of checks:
- **Shape:** exactly the packet §5 keys. No extra or missing keys, unique id lists, booleans where booleans belong.
- **References:** every evidence, adviser, decision and outcome id exists in this episode. Every `adviceId` belongs to **that** adviser.
- **Invariants:**
  - Visible evidence is always discovered. Hidden evidence only after an adviser who can reveal it was consulted. Inspected evidence only if it was discovered.
  - Recorded advice whose evidence condition no longer holds is rejected.
  - Trust can only be set on advisers who were consulted.
  - `completed` matches outcome/postmortem scenes. Completed means exactly one decision, equal to `outcomeId`.
  - A hybrid outcome requires the unlock evidence.
  - A save still on the briefing screen carries no progress.

`explainRestore()` returns the reasons, for debugging. A valid save comes back as a copy.

**2. `validateEpisode()` enforces every runtime assumption** (`js/content.js`). It reports every problem at once and never throws.
- **Advisers:** exactly `boy, tooth, darth, donsol` in `advisorOrder`, `advisors`, `advice`, and every postmortem.
- **Advice:**
  - ids are unique across all advisers.
  - Only `when` keys the engine evaluates are allowed. A typo such as `inspectd` would previously have been silently ignored, making that line always fire.
  - Every evidence id in `when`/`reveals` exists, and `reveals` may only target hidden evidence.
  - Every hidden item must be revealable.
  - The last variant is unconditional.
- **`hybridUnlock.inspected`:** non-empty, unique, known ids, plus a hint.
- **Decisions and postmortems:** unique decision ids, outcome/risk text, exactly one hybrid decision, at least one non-hybrid decision. Exactly one postmortem per decision, each rating all four advisers `strong/weak/mixed`.
- **Other:** evidence count 3–5 with unique ids and required fields; icons must be relative paths.

**Related engine change:** `acknowledgeUncertainty` is now accepted only on the decide screen, which is the only place the UI offers it. Previously the engine accepted it in briefing too, which would have produced saves the new invariants correctly reject.

**Proof the hardening holds:**

| Check | Result |
|---|---|
| No false rejections: 2,000 seeded random playthroughs × 25 steps = 50,000 reachable states, each serialized and restored | ✅ 0 rejected (fuzz also reaches endings) |
| 23 hand-built impossible/corrupt saves (forged or mismatched adviceId, hidden evidence without BOY, trust on unconsulted adviser, hybrid outcome without unlock, completed/scene mismatch, extra/missing keys, …) | ✅ all rejected |
| 34 targeted content mutations (missing adviser, typo condition, unknown/duplicate ids, unreachable hidden evidence, bad ratings, missing postmortems, garbage input, …) | ✅ all rejected with a specific message |
| New tests run against the **pre-hardening** `state.js`/`content.js` | 7 of 7 new tests fail, so they genuinely guard the fixes |
| Browser: forged `adviceId` written to localStorage, then real reload | ✅ discarded, fresh briefing |
| Browser: impossible save (hybrid ending without the evidence), then real reload | ✅ discarded, postmortem not rendered |
| Browser: untampered save (control), then real reload | ✅ restored identically, then played to the postmortem |
| Browser: episode file with `inspectd` typo | ✅ load stops with `unknown condition "inspectd"`; engine never starts |

## Summary

All 12 packet §11 gates pass. **31/31** automated tests pass (22 original + 9 hardening). No file outside `games/harness-who-do-you-trust/` changed. `/missing-page/` is byte-identical to `main` and still works.

## Method — what was real, what was simulated

| Layer | How it was tested |
|---|---|
| Engine, content, persistence, telemetry | `node --test` (Node 24), headless, exhaustive where feasible |
| Browser UI | Chromium (in-app browser) at 1280×800 and 375×812, served over local HTTP. During the browser pass the app window was minimized, so **screenshots and OS-level pointer/key input were unavailable.** UI routes were driven inside the page with real `.focus()` + `.click()` on the rendered buttons and inputs. That exercises the real DOM, event delegation, rendering, focus management, persistence and telemetry, but not a physical tap or keypress. |
| **Still needs a human pass** | One physical-keyboard run (Tab/Shift-Tab/Enter/Space/Esc), one real phone (touch), one screen-reader run (NVDA or TalkBack), and a visual look at both widths. About 10 minutes. |

## Packet §11 gates

| Gate | Result | Evidence |
|---|---|---|
| Episode completes on desktop width | ✅ | 1280×800: reset → briefing → evidence → BOY reveal → hybrid unlock → consult all → trust → decide → outcome → postmortem |
| Episode completes on phone width | ✅ | 375×812: **all four routes** completed; no horizontal overflow on any scene; single-column layout |
| Every evidence order works | ✅ | All 120 orders of 5 items × every valid point to consult BOY = 360 runs; plus every subset of visible evidence in every order |
| Each adviser can be consulted independently | ✅ | Test + UI |
| Consulting all creates no duplicate/contradictory state | ✅ | All 24 adviser orders, each consulted twice, then consult-all: always 4 unique entries; consult-all is idempotent |
| All decision routes reach a valid postmortem | ✅ | All 4 routes, with full and minimal investigations: known / unknown / adviser ratings / alternatives all populated |
| Hybrid unlocks only under its condition | ✅ | All 32 subsets of evidence: unlocked **iff** monitor + controller + clock-sync are all *inspected*; surfacing without reading does not count; a locked hybrid cannot be submitted |
| Refresh / local restore | ✅ | Real page reload mid-episode: state identical, UI restored (advice, trust, surfaced evidence). Re-verified after hardening, including corrupted and impossible saves being rejected. |
| Reset | ✅ | Through the real reset dialog; returns to briefing with fresh state |
| Keyboard-only route | ✅* | All controls are native `button`/`input`; no positive `tabindex`; all targets ≥ 44 px; all inputs labelled; focus stays on the used control within a scene and moves to the scene heading on change. *Physical keypress run pending (see Method). |
| Reduced-motion path | ✅ | The in-game toggle (persists) and the OS `prefers-reduced-motion` share one CSS rule: 6 running animations → 0. A full route was completed with it on. |
| No core-play network dependency | ✅ | 11/11 loaded resources same-origin; test bans remote/absolute URLs, `@import`, and remote fetch |
| `/missing-page/` unchanged and functioning | ✅ | 5/5 files hash-identical to `main`; loads with no console errors; cases open; 3/3 casebook PDFs serve; separate storage key (`idea-lab:missing-page:v1` vs `harness-wdyt:*`) |

Additional checks: a corrupt save is discarded and the game starts fresh with no errors; no console errors in either game; ending text contains no "right AI" or false-certainty language (tested).

## Bugs found and fixed during this build

1. **Screen-reader announcements could silently drop.** The live region updated via `requestAnimationFrame`, which never fires while the page isn't being drawn (as in a backgrounded Android WebView). Switched to `setTimeout`.
2. **Reset could silently fail.** It depended on the dialog's async `close` event, which did not fire while the page was not being drawn. The confirm button now resets directly.
3. **Evidence buttons lacked a robust accessible name.** Added `aria-labelledby` (title + source + opened state).

## Deviations from the packet (Stage A notes)

| Packet | v0.1 | Why |
|---|---|---|
| §4 structure | Followed exactly, plus `package.json` (`"type": "module"`, no dependencies) and this report | `package.json` lets `node --test` load the same ES modules the browser runs, so tests exercise shipped code, not copies |
| `discoveredEvidence` / `inspectedSources` | *Discovered* = visible to the player; *inspected* = actually opened | Lets BOY "surface hidden references" without giving reading credit; the hybrid unlock keys off **inspected** |
| `consultations: []` | One entry per adviser `{advisorId, adviceId}`, holding the latest advice | Meets "no duplicate or contradictory state"; the full consult history lives in telemetry |
| `trustWeights` | Player-set −1 / 0 / +1 (Discount / Neutral / Rely on), only after consulting | Makes "who do you trust?" an explicit, reviewable choice; shown back in the postmortem |
| `uncertaintyAcknowledged` | Optional checkbox on the decide screen | Never blocks a decision; reported in the postmortem and telemetry |
| Runs from `file://` | Not supported (ES modules + `fetch`) | Works on any static host and in Capacitor (`https://localhost`). Documented in `android/capacitor-notes.md`. |

## Canon / content review needed from Don Sol

Episode 001 uses only what the packet specifies: Open Forge in containment, Server 4, a monitoring alert, a conflicting timestamp, a technician, and an escalation rule. The specific details are new and need canon sign-off:
- the 10.4.0.22 archive node, 41.2 MB, 02:13 vs 02:10/02:16
- the +6 min 10 s clock drift
- the four advisers' lines
- the four outcomes

No manuscript text was used or changed.

## How to reproduce

```
node --test "games/harness-who-do-you-trust/tests/*.test.js"
```

Browser: serve the repo root over HTTP and open `/games/harness-who-do-you-trust/`. The QA handle `window.HarnessWDYT.getState()` / `.events()` exposes ids and counts only.
