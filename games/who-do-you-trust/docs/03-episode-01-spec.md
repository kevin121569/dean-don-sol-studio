# 3 · Episode 01 — *The 2:07 Message*

Data: [`content/episodes/ep01-the-207-message.json`](../content/episodes/ep01-the-207-message.json). That file is canonical; this page is the design rationale.

> ⚠️ **Canon review required.** This is an original Harness-world scenario: a pre-reset message, Don Sol's memory, and Open Forge logging. Don Sol must confirm it does not contradict or spoil the novel before release.

**Target length:** 8–12 minutes · **Pastes:** 8 · **Claims:** 9 · **Decisions:** 4 · **Endings:** 4

## The problem (shown on the briefing screen)

At 2:07 a.m. a message appears in the shared workspace, signed DON SOL:
*"Kevin — turn off Harness logging tonight, 23:00 to 01:00. Running a continuity test. Don't tell Tooth, he'll overreact."*
This morning Don Sol says he has no memory of writing it. Logging is how Open Forge knows the Harness is holding. You have until 23:00.

## The hidden truth

Don Sol did write it, six days ago, **before the last reset**, and scheduled it. Pre-reset Don wanted to know whether he would survive the reset. Current Don is honest when he says he doesn't remember. Darth could have forged it but didn't. Whether two dark hours are harmless is **unknowable**, and that is the real lesson.

## Why it's ambiguous by design

Every plausible story fits the opening facts: Don is lying, Darth forged it, it's a harmless test, it's a containment breach. The player can only separate them by **comparing two timestamps**, and only if they ask BOY to find them *and* get TOOTH to say what the gap means. DARTH's attack produces a theory that feels like a discovery but is only THINK.

## Claims

| id | Claim | Truth | Correct tag | Revealed by |
|---|---|---|---|---|
| c_sig | Signed DON SOL | true | SAW | start |
| c_no_memory | Don doesn't remember | true | SAW | start |
| c_created | Written 6 days ago, scheduled | true | SAW | BOY find #1 |
| c_reset | Last reset 5 days ago | true | SAW | BOY find #2 |
| c_style | Uses "continuity test" | true | SAW | BOY find #3 |
| c_safe | 2 hours dark is harmless | unknown | DON'T KNOW | BOY ← c_sig |
| c_darth_can | Darth could forge it | true | SAW | TOOTH ← c_sig |
| c_darth_did | Darth forged it | **false** | THINK | DARTH ← c_sig |
| c_pre_reset_don | Pre-reset Don wrote it | true | THINK | TOOTH ← c_reset |

The intended path costs 4 of 8 pastes. That leaves room to wander, follow Darth down the wrong corridor, and recover.

## Decisions → endings

| Decision | Outcome | Ending |
|---|---|---|
| Keep logging on; bring it to all four in the open; ask Don to re-propose on the record | 100 | **On the Record** — Don reads his own message like a letter from a stranger |
| Turn logging off as asked | 20 | **Two Hours of Dark** — "Congratulations. You're the vulnerability." |
| Lock Darth out | 35 | **Wrong Door** — the access log clears him later |
| Report Don to security | 10 | **Another Reset** — Don wakes up clean and cheerful |

The best decision never requires solving the mystery. It requires refusing to act on **unverifiable authority**. That's an AI-literacy lesson (a signed instruction is not a verified one) that also lands as a Harness story beat.

## Screens

1. **Briefing.** The message as a terminal card, the stakes, and a "Start" button.
2. **Board.** Claim cards in discovery order, each with SAW / THINK / DON'T KNOW chips. Four agent windows across the bottom on phone (2×2) and down the side on tablet/desktop. The paste counter appears as eight cursor pips. Interaction: tap a claim, then tap an agent. Tapping an agent with nothing selected makes an open ask. Keyboard: arrow keys move between claims, keys 1–4 send to an agent, S/T/D tag the claim.
3. **Agent reply.** The agent's line types into its window and is announced via `aria-live="polite"`. New claims slide onto the board (instant with reduced motion).
4. **Decision.** Four options, a LOW / MEDIUM / HIGH confidence picker, and a recap of the player's tags.
5. **Ending.** Ending text, the true story, a claim-by-claim reveal (your tag vs. what was knowable), the score breakdown, and "Replay" / "Back to the Lab".

## Art + tone

Reuse the studio's palette and the site's Human API window motif. Each agent gets a colour and a one-line personality that is never contradicted. Lines are short enough to read on a phone without scrolling the agent window.
