# 2 · State Model

Source of truth: [`src/engine/state.js`](../src/engine/state.js). This document explains it.

## Three kinds of state, never mixed

| Layer | Example | Mutable? | Persisted? | Owner |
|---|---|---|---|---|
| **Content** | claims, agent lines, decisions, endings | No, loaded once | Shipped as JSON | `content/episodes/*.json` |
| **Game state** | revealed claims, tags, pastes left, log, decision | Only via `reduce()` | Yes, on every change (debounced) | `engine/state.js` |
| **UI state** | selected claim, open agent panel, focus target, animation flags | Freely, by the view | **Never** | `ui/` |

Because game state only holds **ids** that point into content, a save is a few hundred bytes. Content text can be edited without corrupting saves; changing a claim *id* requires bumping the episode `version`.

## GameState

```js
{
  schema: 1,                    // save-format version → migrate()
  episodeId: 'ep01', episodeVersion: 1,
  phase: 'briefing' | 'investigate' | 'decide' | 'ending',
  turn: 0,
  pastesLeft: 8,                // the scarce resource; 0 forces 'decide'
  boyFinds: 0,                  // cursor into BOY's ordered discoveries
  revealed: ['c_sig', ...],     // ordered, so the board shows discovery order
  tags: { c_sig: 'saw' },       // the player's epistemic label per claim
  log: [{turn, agent, claimId, line, revealed}],  // full transcript → replay, recap screen, analytics-free debugging
  decision: null | {optionId, confidence},
  endingId: null | 'e_open',
  score: null | {outcome, calibration, total}
}
```

## Actions (the complete set)

| Action | Payload | Valid when | Effect |
|---|---|---|---|
| `BEGIN` | — | briefing | → investigate |
| `PASTE` | `agent`, `claimId \| null` | investigate, pastes > 0, claim revealed | −1 paste, append log, reveal claims, → decide at 0 |
| `TAG` | `claimId`, `tier` | not ending, claim revealed | set label (free, unlimited) |
| `OPEN_DECISION` | — | investigate | → decide (player may decide early) |
| `BACK_TO_BOARD` | — | decide, pastes > 0 | → investigate |
| `DECIDE` | `optionId`, `confidence` | decide | → ending, compute score |

An invalid action returns **the same object**. The store uses `next === prev` to skip re-render and save, and tests use it to assert a no-op.

`PASTE` with `claimId: null` means "open-ended ask": BOY searches, DON SOL suggests a next move. Pasting a claim to an agent looks up `agents[agent].responses[claimId]`, or falls back to the agent's default line. **No randomness in outcomes.** Agent reliability is authored, so every path is testable and every line is reviewed.

## Persistence

```
store.dispatch(action)
  → next = reduce(prev, action, episode)
  → if next !== prev: render(next, ui); debounce(300ms) storage.set('wdyt:save:ep01', next)
```

- `platform/storage.js` gives one async API: `localStorage` on web, `@capacitor/preferences` on Android. Android can kill a backgrounded WebView, so the store also saves immediately on `pause`.
- On load: `migrate(saved, episode)`. Same schema + episode version → resume. Anything else → `null` → fresh start. **We never guess at an old save's meaning.** When a real migration is needed, add an explicit `schema: 1 → 2` step there and cover it with a test.
- Completed episodes write a separate small record: `wdyt:done:ep01 = {endingId, score, at}`. This feeds episode select and survives replays.

## Scoring

- **Outcome** (0–100) is authored per decision in content.
- **Calibration** (0–100), in `scoring.js`, measures whether the player's tags and confidence matched what the evidence could support. Labelling Darth's forgery theory as THINK rather than SAW scores well; picking the right answer at HIGH confidence after one paste does not.
- **Total** = 60% outcome + 40% calibration. You can do the right thing for the wrong reasons, and the game says so.
