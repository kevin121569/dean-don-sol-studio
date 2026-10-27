# HARNESS five-case implementation blueprint

## Decision

Ship a five-case first paid campaign, not a two-case paid build. The approved
Level 1 and v12 Level 2 files remain untouched regression oracles. Build the
campaign beside them, move presentation assumptions into case data, and promote
only after Levels 1 and 2 match the approved phone experience.

One verified exception is already known: the Level 1 oracle locks up when Case
Review opens. Its appended `MutationObserver` calls `enhance()`, which assigns
`.case-end.textContent` on every observed DOM change. That assignment creates a
new child-list mutation and schedules `enhance()` again indefinitely. The frozen
file remains untouched; the new campaign shell must replace this observer with
an explicit completion event and carry the difference in the Level 1 parity
allowlist.

Independent review agreed on the product direction:

- two cases feel like a strong pilot, not enough value for a normal paid game;
- five cases support roughly two hours of first-run play and a real finale;
- the existing investigate → consult → decide → outcome → review loop is worth
  preserving;
- later cases need advisers with real blind spots, a visible trust decision,
  non-identical outcome grades, and choices that are tradeoffs rather than one
  right answer plus three obviously wrong answers.

## Frozen-source boundary

| Source | Purpose | SHA-256 |
|---|---|---|
| Level 1 `level-1.html` | approved Level 1 monolith, stored outside this branch | `4fbe004e42c12af00a34006a939deed8dc14d74b74ae6c1d44bbd5c535ba4ccd` |
| Level 1 `episode-001.json` | repository case data | `743285383fd5ca17891c840feb41ea28bbdcb9d294d6503c874c8ec32d1f2819` |
| Level 2 Android `www/index.html` | approved Motorola v12 visual and behavior oracle | `83089e531ae5a88162f54d68cee96bb0146f2bf2fa0793333595c704a66d8b60` |

Never update a hash just to make a failure disappear. A changed hash requires a
deliberate source review and owner approval.

Direct comparison also confirms the Harness core, session wrapper, and audio
module are byte-identical between the two monoliths. Their extracted SHA-256
values are:

- Harness core: `75bbcb9074a94c1ea1bdeba81051b4bf29775485a7d7de66e150abda5adacc2e`
- session wrapper: `41392498876f3829d054a7a0cb0f7e3d86ca044f4c4e6abecea60d855349405f`
- audio module: `3e78e6836b7ad36bd3830e34e6a20c2b3053973ce82fc0b3149c198cc8e83403`

The Level 1 presentation is not production-complete art-wise: its evidence map
reuses Level 2 `ledger.jpg`, `hub.jpg`, and `audit.jpg` assets. The data remains
valid, but original Server 4 art is a release blocker rather than a reason to
keep borrowed harbor imagery.

## Product decisions for implementation

These choices are fixed for the campaign branch so engineering does not stall:

| Topic | Campaign decision |
|---|---|
| Naming | Use **Case 1-5** in campaign navigation. Preserve legacy wording only inside parity mode. |
| Advisers | BOY / Searcher, TOOTH / Fact-Checker, LUKE / Worst-Case Thinker, DON SOL / Team Lead. Keep internal ID `darth` for save compatibility. |
| Level 1 wording | Allowlist consistency fixes such as LUKE and Case naming in the new runtime; never edit the frozen oracle. |
| Progression | Fail forward: any completed ending unlocks the next case. Better endings affect review and achievement, not access. |
| Time | Fictional deadlines may create story stakes; no real countdown timer pressures the child. |
| Phone layout | Put the interactive investigation/decision board in the first viewport. Decorative assignment art must not block play or cover controls. |
| Art | Do not ship borrowed Level 2 images as Server 4 art. Empty semantic slots block release until approved art is supplied. |
| Trust | Cases 1-2 retain their tested interaction in parity mode. Cases 3-5 make the trust judgment visible and reflect it in the debrief. |

## Level 2 assumptions that must become case data

The v12 game core already reads the episode's evidence, advisers, decisions,
and postmortem. The following display logic is still written specifically for
The Missing Two and must be parameterized before another case is inserted.

| Current assumption in v12 | Data-driven replacement |
|---|---|
| Save key contains `episode-002` and the v12 build name | derive the case save key from campaign ID, schema version, and case ID |
| `img` and `short` maps know six Level 2 evidence IDs | evidence `shortTitle`, `art`, optional interaction, and voice-line fields |
| Masthead says “Episode 2 Investigation / The Harbor Protocol” | `presentation.caseLabel`, `title`, and header art/alt text |
| Assignment card hard-codes the harbor hero, Missing Two copy, four tasks, and map | `presentation.assignmentTitle`, `summary`, `tasks`, `artSlots`, and optional reference panel |
| Board always swaps two visible cards for `e_clocksync` and `e_harbor` | ordered evidence slots and reveal rules |
| Adviser display roles conflict with episode roles | use the canonical adviser `name`, `verb`, strength, and weakness everywhere |
| Glossary, plain-language explanation, “ponder” prompts, and helper copy key off Level 2 IDs | evidence-level help blocks plus case glossary |
| Record panel has special selectors only for `e_clocksync` and `e_harbor` | optional evidence interactions described by data; default panel works without one |
| Hidden-record voice controls know only the two Level 2 IDs | optional voice line on any evidence record |
| Decision unlock assumes one `requiresHybrid` choice | general `requires.evidence` and `requires.trustedAdvisors` rules |
| Outcome schematic models route, records, and harbor warning | optional per-case outcome status rows and illustration slot |
| Investigator scoring awards points for Level 2 evidence IDs and `d_hybrid` | case-provided scoring tags or a case-neutral scoring rubric |
| Share card and text say Harbor Protocol | case title, campaign title, result profile, and safe share copy |
| Map contains lighthouse, lower pier, and model hub | optional case reference panel with case-provided places |
| Debrief always advertises an unreleased cartoon | campaign-level promotion flag; hidden unless an approved destination exists |
| Audio map is one embedded Level 2 object | per-case audio manifest; text remains complete when clips are absent |

## Canonical character contract

Use one role set in every case and every screen:

| ID | Display name | Role | Useful method | Known blind spot |
|---|---|---|---|---|
| `boy` | BOY | Searcher | finds leads quickly | may surface an unverified or weak match |
| `tooth` | TOOTH | Fact-Checker | compares sources, clocks, and independent measurements | verification costs time and may cover only part of the system |
| `darth` | LUKE | Worst-Case Thinker | finds consequences and missing safeguards | can treat possibility as probability |
| `donsol` | DON SOL | Team Lead | combines methods into a reversible plan | cannot repair evidence nobody gathered |

The internal `darth` ID remains for save compatibility; the player-facing name
is LUKE.

## Reusable case contract

`schema/case.schema.json` defines the full contract. Each new case includes:

1. briefing, mission, and learning goal;
2. canonical adviser profiles and ordered, conditional responses;
3. five to eight evidence records, including explicit “proves” and “does not
   prove” statements;
4. adviser-revealed records and an explicit trust judgment;
5. exactly four defensible decisions, optional unlock requirements, and
   adviser-specific outcome reflections;
6. outcome-specific postmortem grades;
7. presentation tasks, semantic art slots, glossary, and progression.

The three new cases are content-complete candidates:

- Case 3, **The Cold Mirror** — disputed air-quality alert; independent physical
  measurement and reversible relocation.
- Case 4, **The Ledger's Weight** — city budget model versus concentrated field
  risk; phased funding with a public checkpoint.
- Case 5, **The Open Record** — the season's final authority decision; narrow
  automation, named human responsibility, transparency, and appeal.

No new art or voice asset is represented as finished. Art fields are semantic
slots for the later production pass.

## Safest migration sequence

1. **Freeze and fingerprint.** Keep the approved monoliths unchanged and run
   `validate-campaign.mjs` on every change.
2. **Record the Level 1 blocker.** Add a regression test proving the frozen
   observer locks Case Review. Fix completion only in the new shell with an
   explicit event; never patch the oracle.
3. **Extract without redesigning.** Copy the v12 renderer into a new campaign
   shell. Replace one hard-coded Level 2 value at a time with case data while
   comparing the rendered Level 2 screen after each change.
4. **Add campaign saves.** Store completion separately from per-case sessions.
   Never reuse the v12 key or write campaign state into an approved source.
5. **Add case select.** Case 1 is open. Each completed case unlocks the next.
   Completed cases remain replayable. A case reset never erases season progress.
6. **Port Level 1 as a compatibility adapter.** Preserve its evidence and rules;
   translate only the shape required by the new renderer. Apply only allowlisted
   completion, naming, role, phone-layout, and approved-art deltas.
7. **Port Level 2 as a compatibility adapter.** Match the v12 source before
   enabling Case 3.
8. **Make Case 3 playable.** Use semantic art placeholders only during internal
   development; do not distribute an APK until approved art and phone layout
   replace them.
9. **Add Cases 4 and 5.** Reuse the same shell. Do not fork another one-off HTML
   build per case.
10. **Regression and device gate.** Test Android offline, fresh install, upgrade,
   rotation, back navigation, sound off, and the target Motorola viewport.
11. **Package once.** Generate a signed test APK only after the campaign gate,
    regression gate, and device gate all pass.

## Acceptance tests

### Campaign and saves

- A new install shows five cases; only Case 1 is playable.
- Completing Case 1 unlocks Case 2. The chain continues through Case 5.
- Replaying a completed case does not relock later cases.
- Resetting one case clears only that case's evidence, advisers, trust choice,
  decision, and outcome.
- Fresh install, upgrade from v12, and malformed-save recovery all land in a
  valid state without importing Level 2 evidence into another case.
- Two cases can be in progress independently and restore to their own screen,
  scroll position, selected evidence, trust decision, and sound preference.

### Approved-level regression

- Repository frozen-source hashes pass.
- Level 1 story text, evidence, advice, locks, four decisions, and outcomes
  remain unchanged.
- The frozen Level 1 file reproduces the known Case Review lockup; the new shell
  remains responsive and records the fix as an intentional parity delta.
- Level 2 v12 masthead, illustrated board, adviser avatars, evidence panels,
  decision flow, outcome, back behavior, and Motorola scrolling match the
  approved source.
- The old oversized blank/static entry area and obscured decision controls do
  not return.
- No campaign screen labels Level 1 as Episode 2 or mixes Harbor art into a
  non-harbor case.

### Mobile and accessibility

- At 360×640, 393×873, and 412×915 CSS pixels, primary content begins without a
  decorative screen-height obstruction.
- All body and card text remains readable without pinch zoom; interactive
  targets are at least 44×44 CSS pixels.
- Bottom controls do not cover evidence, choice text, or the send-order button.
- Android Back closes a detail panel first, returns to the prior campaign screen
  second, and never silently resets case progress.
- Sound-off play is complete: every cue has full text and no step depends on
  audio.

### Offline Android

- Airplane-mode launch works after install.
- The selector, all five case data files, fonts, approved art, core code, and
  any enabled audio load from the package with zero network requests.
- Missing optional audio shows readable text and no repeated “Voice
  unavailable” clutter.
- Process death and relaunch restore the correct case without cross-case state.

### Story and trust

- Each trust choice is visible, required by the configured rule, and reflected
  in the outcome/debrief wording.
- Every hidden clue has a reachable adviser path.
- Every decision has a distinct consequence and outcome-specific adviser
  grades.
- No case asserts unsupported facts about an earlier case. Continuity beats
  describe lessons and policy consequences that the player actually observed.

## Release blockers

- any frozen-source hash change;
- the Level 1 Case Review lockup appearing in the new runtime;
- a Case 1 or 2 visual/behavior mismatch on the target phone;
- a case save appearing in another case;
- an unreachable hidden clue or decision;
- missing text when sound is off;
- clipped or obscured controls;
- unapproved placeholder art/audio in a distributed APK;
- borrowed Level 2 harbor art appearing as finished Server 4 art;
- fewer than five playable cases in a normally priced paid release.
