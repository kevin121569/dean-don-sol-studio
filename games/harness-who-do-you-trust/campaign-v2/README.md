# HARNESS five-case campaign

This directory is the isolated expansion workspace for the five-case paid game.
It does **not** replace either verified playable source:

- Level 1 content source: `../data/episode-001.json`
- Level 2 frozen Android source: `../../../android/harness-who-do-you-trust/www/index.html`

The current production rule is simple: the verified sources stay untouched while
the campaign schema, new case content, progression rules, and tests are built
beside them. A playable build must not be promoted until Levels 1 and 2 pass
visual and behavioral regression on a phone-sized viewport. The Level 1 oracle
has a confirmed Case Review lockup in its appended campaign script; the new
runtime must fix that defect outside the oracle and record it as an intentional
regression delta.

Cases 1 and 2 now open through `app/case.html`, a single compatibility runner.
It fingerprints the approved monolith before execution, reads only the frozen
`HarnessV34` inspection surface, and mirrors minimal case state into the
campaign save namespace. Level 1's known self-triggering campaign observer is
removed in memory; the frozen file itself is never changed. Five original
Server 4 evidence illustrations replace the borrowed Harbor cards through the
same in-memory adapter.

Case 3 now has a data-driven internal renderer at
`app/play.html?case=episode-003&preview=1`. Its pure engine covers evidence,
conditional adviser reveals, the two-person trust judgment, decision locks,
all four outcomes, the postmortem, and fail-forward completion. The campaign
selector still leaves Cases 3-5 disconnected: Case 3 must receive production
art and phone-device approval before its launch route is enabled, and Cases 4-5
must prove their case-specific trust modes in the same shared engine.

## Intended launch scope

1. **Server 4** — reconcile conflicting clocks before an irreversible shutdown.
2. **The Missing Two** — contain unauthorized access while a human verifies a harbor warning.
3. **The Cold Mirror** — weigh sensor telemetry against physical checks during a shelter alarm.
4. **The Ledger's Weight** — balance statistical optimization against visible infrastructure risk.
5. **The Open Record** — assign accountability and design a limited emergency-warning process.

## Content contract

Each new case must provide:

- four to six visible evidence records and one or two adviser-revealed records;
- four advisers whose method can both help and create a blind spot;
- four defensible decisions with distinct tradeoffs;
- a visible trust judgment that changes what the player learns or how an outcome unfolds;
- outcome-specific adviser grades;
- complete text equivalents so sound is optional;
- a continuity beat supported by evidence in the current or an earlier case.

Prepare and run the campaign gates from this directory:

```bash
cd games/harness-who-do-you-trust/campaign-v2
npm test
npm run validate
```

The preparation step deterministically recreates the approved Level 1 monolith
from fingerprinted repository-history inputs. A shallow clone must fetch full
history before preparing the runtime.

The gate also checks the repository copies of the approved sources against
`frozen-sources.json`. A failed frozen-source hash is a release blocker, not a
warning to update the expected value.

## Current phase

This branch contains the campaign contract and complete content candidates for
Cases 3-5. It is intentionally **not an APK** and not yet a replacement game.
It now also contains the phone-first case selector, isolated v2 campaign
storage, fingerprint-locked playable routes for Cases 1 and 2, and the gated
Case 3 shared-renderer preview. Cases 3-5 stay disconnected from the selector
until their art and regression gates pass. The only Level 1 presentation deltas
are the explicitly allowlisted completion fix and original evidence art applied
in memory by the compatibility runner.

