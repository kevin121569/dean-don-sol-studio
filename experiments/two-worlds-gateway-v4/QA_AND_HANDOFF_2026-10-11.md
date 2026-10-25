# TWO WORLDS V4 — THE LIBRARIAN'S READING DESK
Date: 2026-10-11
Status: ISOLATED, UNLISTED REVIEW / SOURCE+INTERACTION QA PASS / HOSTED & PHYSICAL-DEVICE GATES AS DOCUMENTED

## Creative outcome
Preserves the user's beloved FIRST dark-haired, mustached, tweed-suited cinematic Librarian and his warm realistic library. His original 8-second walk-and-chair Google Flow master is untouched. The V2 editorial crop of that master and seated poster are reused unchanged. Children remain in the fully separate approved cartoon world of Curley and cartoon Don Sol, Percy, Luke, Tooth and Robot; their production assets and Curley V2 portal are untouched.

V3 introduced five hand-authored moods -> two real books each. V4 adds an **in-Library Reading Desk**: instead of immediately navigating away from the room, every adult-book sample link from the 8-book catalog, the 5-mood recommendations, and the book-pitch dialog opens the original same-origin published HTML sample in a modal reading surface. The Librarian's portrait remains in the toolbar. Close returns to the same point, including back to an already-open book pitch. Readers can adjust type size, see reading-progress percentage, and open the original full sample in a separate tab. Existing hrefs remain intact as no-JS fallback. Only the eight adult sample paths are intercepted, never the children's sample.

## Security, rights and privacy
- V4 does NOT duplicate, paraphrase, transform or generate any book chapter. It shows the EXISTING site's original `/samples/*.html` excerpt in a same-origin sandboxed iframe (`allow-same-origin allow-popups`, no `allow-scripts`, forms or top-navigation).
- On-screen text-size CSS is transient and only affects the iframe view, not the archived chapter; progress is computed from reading position in the iframe. Nothing is stored or sent to analytics, AI/voice APIs, Google or any third party.
- Inline sample navigation links open in separate tabs instead of changing the reading iframe. Plain unmodified click is intercepted, all other navigation (Ctrl-click, middle click, no JS) follows original link conventions.
- Native `<dialog>` with explicit close/back, Escape and focus restoration. The Reader can be placed over the original pitch modal, so closing reveals the unchanged context. Narration is stopped while reading.
- NO new audio generation, billing enrollment, media generation, narrator impersonation, Runway usage, or Google Flow charges. Google Speech preflight remains incomplete for account-specific billing. Browser-only optional UK voice audition (if installed) remains as clearly labeled from V3. No recorded actor speaking or lip-sync claimed.

## Source checks
- Node `--check`: PASS for `entrance.js`, `consultation.js`, `reading-desk.js`.
- Synthetic Chromium Playwright (desktop 1440×900 and narrow 390×844, reduced motion): PASS for eight catalog cards, moods, recommendation -> pitch -> sample nested dialogs, original sample iframe shape (local QA-only mock text), accessible book titles/URL, A+ adjustment, progress, return to same pitch, recommendation sample direct open and focus return, kids-only original Curley link, no page JS exception or page horizontal overflow.
- The QA mock sample content is test-only; it was NEVER staged/published or inserted into source package. Live V4 uses original site HTML at `/samples/harness.html` etc. Local QA screenshots omit remotely hosted cover/actor imagery because local browser cannot fetch outside assets.

## Honest remaining gates
- Live hosted browser check of real sample iframe on HTTPS after deploying V4 — **pending until run**.
- Real HTML sample rendering/performance and progress on physical mobile browser; keyboard + assistive-technology audit — NOT YET CERTIFIED.
- Recorded human-quality British actor voice, audio usage approval, actual voice duration and closed-caption sync — NOT produced.
- This V4 in-room reader is an experiment, not final conversion of retail title pages or production homepage.
- The original private Google Flow Take A master still shows duplicated boot artifacts outside the web editorial crop; no retouching or regeneration.

## Rollback and boundary
Unlisted V4 only at `/studio-entrance-preview-v4/`. Existing official homepage, Two Worlds V1-V3, older guided tours, Kids/Curley V2, Harness Android APK/baseline and private masters unchanged. Deleting just V4 folder reverts experiment. Versioned full source & checksum ZIP stored in studio Drive. No merging official homepage without explicit approval.
