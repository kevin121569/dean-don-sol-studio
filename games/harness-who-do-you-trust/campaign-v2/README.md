# HARNESS five-case campaign

This directory is the isolated expansion workspace for the five-case paid game.
It does **not** replace either verified playable source:

- Level 1 content source: `../data/episode-001.json`
- Level 2 frozen Android source: `../../../android/harness-who-do-you-trust/www/index.html`

The current production rule is simple: the verified sources stay untouched while
the campaign schema, new case content, progression rules, and tests are built
beside them. A playable build must not be promoted until Levels 1 and 2 pass
visual and behavioral regression on a phone-sized viewport.

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

Run the content gate from the repository root:

```bash
node games/harness-who-do-you-trust/campaign-v2/scripts/validate-campaign.mjs
```

The gate also checks the repository copies of the approved sources against
`frozen-sources.json`. A failed frozen-source hash is a release blocker, not a
warning to update the expected value.

## Current phase

This branch contains the campaign contract and complete content candidates for
Cases 3-5. It is intentionally **not an APK** and not yet a replacement game.
The next implementation slice is the reusable shell plus Case 3 behind a case
selector. Cases 1 and 2 remain regression oracles until the extracted shell can
match their approved phone experience.

