# Don Sol + Curley Character Selling — LIVE checkpoint
Date: 2026-10-11

## User correction
Earlier homepage had illustrated faces and static book descriptions, but not meaningful character-led selling. The requested experience: Don Sol as a recognizable recurring character pitches books, Curley slithers to the children's-book cover and gives kids a lively invitation; make characters findable on the **actual homepage**, not only separate previews.

## Now actually live
- https://theidealabstudio.com/ — live public homepage.
- Don Sol hero CTA "Let Don Sol pitch The Harness".
- In the Books section, prominent new "THE BOOKSTORE HAS CHARACTERS" showroom with Don Sol and the actual Curley vector beside the children's book.
- All nine cards include character pitch controls, each with an original persuasive story-specific pitch, book details, sample CTA, and existing cross-media links.
- Curley visibly crawls on the children's-book experience; animations are reduced-motion aware and all normal links remain usable.
- Native dialog provides proper close control and captive focus according to browser dialog model.
- Optional speech synthesis is device-dependent, **not** reliable recorded character voice: voice playback failed in the QA browser. A readable pitch remains available at all times; audio never autoplays. Do not claim a voiced cinematic film/presentation.
- Official existing Kate Harness browser game and Android APK unchanged; original approved Curley portal V2 untouched.
- This is the first animated *scripted* sales stage, not full expressive character animation or custom voiceover.
- Desktop hosted browse test PASS. Physical/mobile device and screen reader QA UNTESTED.

## Source
- `studio-sales-stage.js`
- `studio-sales-stage.css`
- `index.html` references the staged assets (?v=3)
- Prior book guide in `studio-book-guide.js/css` preserved.
- Deployed commit: `61945c56ff71eee8e81db979c92b8ad83a6ecd0a`.
- Hosted smoke test: https://agent.tinyfish.ai/runs/619bed85-3bb4-4a6e-b0a5-6c0f5987416d (PASS on main homepage).
- Prior preview TTS test: https://agent.tinyfish.ai/runs/f6f1059d-6b4e-4041-803c-c38190a6de3a (PASS visual/routes, FAIL device speech audio).

## Next improvement if requested
Professional, user-approved recorded character voices and face/lip animation; actual director-approved canonical Curley art; stronger transitions making Don physically step out or sit in chair; test on actual mobile device; production performance/accessibility QA; improve conversion based on visitor feedback. Don't invent live buy links before retailer release.
