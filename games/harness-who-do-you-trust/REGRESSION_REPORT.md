# Regression Report — The Harness: Who Do You Trust? · Episode 001 v0.1

**For:** Don Sol review (Issue #1, packet Stage C → D)
**Branch:** `feature/harness-wdyt-episode-001-v0.1` (from `main` @ `54174f6`)
**Status:** Not merged, not deployed, not linked from the site, `noindex`.

## Summary

All 12 packet §11 gates pass. 22/22 automated tests pass. No file outside `games/harness-who-do-you-trust/` changed. `/missing-page/` is byte-identical to `main` and still works.

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
| Refresh / local restore | ✅ | Real page reload mid-episode: state identical, UI restored (advice, trust, surfaced evidence) |
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
