# Librarian Reading Journey — review handoff V1
Date: 2026-10-11
Branch: `feature/librarian-reading-journey-continuity-v1-2026-10-11`
Public homepage: UNCHANGED. Unlisted V4.1 existing production preview: UNCHANGED.
Status: DRAFT / code-level checks PASS / full browser QA HOLD.

## Intent
After a visitor opens one of the eight *actual* published adult-book excerpts in the existing Reading Desk, the Librarian may offer one crafted spoiler-free next-book introduction. No claim that the visitor finished or liked the sample. A same-tab, in-memory Set avoids re-pitching an excerpt already opened.

## Source changes (on review branch only)
- `studio-entrance-preview-v4-1/reading-journey.js` — new optional, in-memory return-note component; reads the existing desk's approved sample href when the desk closes; waits for any still-open book pitch to close; offers existing introduction via the established `librarian:open-book` event; clear dismissal.
- `studio-entrance-preview-v4-1/reading-journey.css` — responsive, reduced-distraction and accessible non-modal presentation.
- `studio-entrance-preview-v4-1/index.html` — adds references to these two files **only on the same separate preview variant**.
- No changes to the existing first-words welcome, entrance film, original UK voice audition, original eight book sample files, children/Curley pages, Harness Android game, or public home.

## Editorially paired openings
- The Distance Between Thoughts → What God Could Not Know
- What God Could Not Know → The Distance Between Thoughts
- The Harness → Forty Bales
- Forty Bales → The Harness
- The Last Memory → Stardust
- Stardust → The Last Memory
- Fight Your Way Through → When Fighting Stops Working
- When Fighting Stops Working → Fight Your Way Through

Each has custom spoiler-free, preauthored bridging prose (not a generated summary or a chatbot). If the paired sample has already been opened during this page visit, the Librarian does not pitch it again.

## Privacy / accuracy
No cookies, local/session storage, analytics, API calls, login, AI model, network write, new audio/video or generation cost. Data vanishes on page reload; the component does not claim genuine human-like memory across visits, know whether a chapter was read, or record the visitor's identity.

## Checks completed
- Source fetched back from review branch and V8 JavaScript syntax compilation: PASS.
- Script/CSS linked in review HTML: PASS.
- Synthetic DOM event checks: direct-reader close shows a note; recommendation opens the existing book-introduction event; nested pitch defers until its close; dismiss works; eight catalogue IDs resolve; kids' sample ignored; already-opened pair is not re-pitched: PASS.
- No actual browser/keyboard/screenreader/physical mobile regression test or hosted QA for this new branch yet: HOLD.
- GitHub draft PR remains review-only. Must run live desktop and mobile browser QA and obtain studio release approval before any merge/promotion.

## Suggested final live QA
1. Enter First Words → seated Room; make sure the 8-second entrance does not repeat.
2. Choose Challenge my mind → The Distance Between Thoughts → Read here → close Reader → close introduction → see What God Could Not Know note.
3. Open next intro; open its sample; return. Confirm already-opened Distance is **not** pitched again.
4. Open The Harness directly from shelf; Reader close produces Forty Bales suggestion. Test Not now.
5. Repeat at narrow mobile widths, keyboard tab/Escape and English UK device narration; confirm no film or speech autoplay.
