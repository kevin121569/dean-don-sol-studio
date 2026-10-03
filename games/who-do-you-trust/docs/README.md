# HARNESS GAME #1 — WHO DO YOU TRUST? · Implementation Packet

**Status:** Architecture + engine core. **Not linked from the site. Not for production until Don Sol signs off.**

| # | Document | What it decides |
|---|---|---|
| 1 | [Folder structure](01-folder-structure.md) | Where code, content, assets, and tests live; what ships to web vs. Android |
| 2 | [State model](02-state-model.md) | Content vs. runtime vs. UI state; the action set; saves and migration |
| 3 | [Episode 01 spec](03-episode-01-spec.md) | *The 2:07 Message*: problem, claims, agents, decisions, endings |
| 4 | [Android / Capacitor plan](04-android-capacitor-plan.md) | Wrapping the same web build for Google Play |
| 5 | [Regression test plan](05-regression-test-plan.md) | Protecting the studio site and existing games; testing this one |

## What exists in code today

- `src/engine/state.js` — the full state model and pure reducer (working, tested)
- `src/engine/scoring.js` — calibration scoring (one function pending)
- `content/episodes/ep01-the-207-message.json` — Episode 01 as data
- `tests/engine.test.mjs` — content integrity, reachability, golden path, save migration

Run: `node --test games/who-do-you-trust/tests/engine.test.mjs`

## Premise

The player gets an ambiguous problem and a fixed number of **pastes**. Each paste carries one claim to one agent.

| Agent | Verb | Strength | Failure mode |
|---|---|---|---|
| BOY | finds | Fast discovery, surfaces new claims | Offers comforting assumptions as if they were facts |
| TOOTH | verifies | Says exactly what the evidence proves | Literal; a badly framed question gets a true but useless answer |
| DARTH | attacks | Finds the real weakness | Argues the worst case persuasively, even when it's wrong |
| DON SOL | orchestrates | Points to the next useful move | In Episode 01, he is part of the mystery |
| KEVIN / player | decides | — | — |

The player labels each claim **SAW / THINK / DON'T KNOW YET** and then commits to a decision and a confidence level. The score rewards both the outcome and how well the player's confidence matched the evidence.

## Review gate

1. Don Sol reviews this packet, including the canon note on Episode 01.
2. Build the UI layer against the engine as it stands.
3. Pass all of [05](05-regression-test-plan.md).
4. Publish at an unlinked, `noindex` path for a test pass.
5. Link the game from the site only after explicit sign-off.
