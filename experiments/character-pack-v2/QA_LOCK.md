# Website Character Pack v2 — Proof QA Lock

Status: **PROOF PACKAGE PASS / NOT PRODUCTION INTEGRATED**

Date: 2026-10-05
Tracked by Issue #15 and PR #16.

## Scope tested

- Hue the Highlighter functional proof
- Ruler functional proof
- Sticky Note functional proof
- Cursor functional proof
- v2 Family Board
- desktop + 375×812 placement proof
- Mobi AI interface proof
- narrative doctrine consistency

## Browser interaction results

| Proof | Result | Verified behavior |
| --- | --- | --- |
| Hue | PASS | Remains visibly a highlighter; activation emphasizes only `evidence`; status updates; semantic button remains keyboard focusable. |
| Ruler | PASS | Reports deterministic 60 px difference between 120 px and 180 px bars; bars use explicit `role="img"` labels; status updates. |
| Sticky Note | PASS | Reminder is not exposed before activation; reveals exactly `Check the evidence before deciding.` after activation; status updates. |
| Cursor | PASS | Draft / Verify / Publish begin `aria-pressed="false"`; selection is exclusive; decorative cursor follows without replacing or blocking the semantic buttons. |
| Family Board | PASS | Hue, Ruler, Sticky Note, Cursor, and Mobi remain recognizable as their physical/system forms. |
| Placement | PASS | Protected commerce remains first; desktop BUY NOW and mobile ADD TO CART remain unobstructed; learning objects stay below commerce; Mobi remains full-width beneath the four tools. |
| Mobi | PASS | Answer is semantically hidden before Ask Mobi; appears only after activation; returned text explicitly preserves uncertainty rather than inventing certainty. |

## 375×812 mobile correction

Initial browser QA identified page-level horizontal overflow because the combined desktop/mobile proof retained the 760 px desktop mockup at narrow viewport widths.

The proof was corrected so that at `max-width:600px`:

- body horizontal padding is removed,
- desktop mockup is hidden,
- mobile frame is constrained to `375px` / `100%`,
- the mobile frame uses `overflow-x:hidden`,
- vertical scrolling inside the 812 px frame remains allowed.

Re-test: **PASS — no page-level horizontal scrollbar detected.** Vertical frame scrolling is expected and is not treated as horizontal overflow.

## Accessibility corrections made during QA

1. **Mobi:** answer content now uses the `hidden` attribute before activation instead of opacity-only hiding, so assistive technology does not encounter an answer before the user asks.
2. **Sticky Note:** readable reminder content is no longer nested inside a `role="img"` container; the deterministic reminder becomes normal readable content when revealed.
3. **Ruler:** Line A and Line B measurement bars now use explicit `role="img"` + `aria-label` semantics.
4. **Cursor:** native buttons remain the controls; the cursor glyph stays `aria-hidden` and non-interactive.

## Reduced-motion verification

Reduced-motion behavior was verified from the actual source rules and functional state logic:

- Hue: highlighter and highlight transitions disabled.
- Ruler: ruler and measure-line transitions disabled.
- Sticky Note: note transition disabled.
- Cursor: pointer transition disabled.
- Mobi: answer transition disabled.

In each case the same semantic button still applies the deterministic final state; only interpolation/motion is removed.

## Runtime / telemetry provenance

This proof review records **observed browser behavior and source-backed implementation facts only**.

Verified:

- no external runtime libraries are required by these proof files,
- no perpetual idle animations are present,
- essential actions are click/keyboard semantic controls rather than hover-only behavior,
- 375×812 proof has no horizontal overflow after correction,
- no object overlaps the protected commerce zone in the placement proof.

Not claimed here:

- FPS,
- CPU utilization,
- memory use,
- CLS,
- long-task timing,
- Safari/iOS profiler numbers.

Those metrics must be measured against any future integrated production implementation rather than invented from isolated proofs.

## Narrative lock carried with the package

- ordinary functions become extraordinary only when the moment requires them,
- Hue focuses attention rather than merely being colorful,
- Mobi may answer, qualify, say unknown, or ask for more evidence; Mobi is not an oracle,
- Clipper is the story name for Paper Clip and working canon makes Clipper Percy’s grandpa,
- Percy contains/protects relationships while Clipper fastens pieces that already belong together,
- Percy retains the containment role; no competing Brackets character is introduced.

## Verdict

**CHARACTER PACK v2 PROOF PACKAGE: PASS**

This authorizes archival/merge of the proof package only. It does **not** authorize live Character Pack v2 deployment. Production integration requires a separate branch/PR and fresh page-level accessibility, responsive, regression, and measured runtime-performance QA.
