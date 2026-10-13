# THE IDEA LAB STUDIO — TWO WORLDS V2 REVIEW
Date: 2026-10-11
Preview path: https://theidealabstudio.com/studio-entrance-preview-v2/
Status: Local interactive QA PASS (desktop+narrow), media crop visually checked, hosted QA pending.

## Canon
- **The Librarian** is the original brown-haired, moustached, waistcoat-and-tie, charismatic cinematic book host from the user's beloved first Google Flow Take A. **Do not recast** him as white-haired cartoon Don Sol. His signature library, brown leather chair, deliberate walk and seated gaze remain central to the adult experience.
- Adult Library: 8 existing adult/general titles with spoiler-free original introductions, real samples and details, real Harness dev browser game and film preview links.
- Kids World: separate accepted cartoon cast (Curley, cartoon Don Sol, Percy, Luke, Tooth and Robot), already-approved Curley V2 portal and development previews; no production kids game invention.
- UK English voice is still just the optional browser-device audition; **no actor-recorded speaking voice or lip-sync yet**. No automatic narration.

## V2 improvements
1. **Editorial zoom:** re-edit 8.000-second source as full-width walking shot at beginning, smooth camera push-in 1.25–1.79 seconds, tighter medium-shot as actor turns/sits. This keeps duplicate boots out of the review frame from the moment they would become visible. The boots are **not removed from the original source** and this is not newly generated animation. Technically an FFmpeg Zoompan framing edit; retains source movement. Full editorial cut: 960x540, 24fps, 8s, 1,177,734 bytes, no audio. Web copy: 800x450, 24fps, 8s, 444,462 bytes, silent H.264. Preserve these as derivatives of the original 1920x1080 Google Flow master.
2. **New still poster** from the editorial cut around 7.4s; actor seated in library, no duplicate boots visible because final poster composition ends above floor region.
3. **Book pitch redesign:** When adult selects a book, seated Librarian remains clearly visible at left, with a small inset of the selected book cover, and accurate, spoiler-free written pitch at right. The browser's optional en-GB voice audition state is shown **within** the book dialog. Page retains genuine sample/details links, escape/close and focus return.
4. **Video stage cues** are brief onscreen literary prompts, explicitly written captions, NOT transcribed or lip-synced speech: 'Come in. Take a seat.' -> 'Make yourself comfortable.' -> 'Now, shall we find you a story?'.
5. Explicit quiet mobile layout and reduced-motion support; neither replaces formal physical-device QA.
6. All changes are isolated within V2 preview path. Existing homepage, V1 gateway, V3.2 tour, Curley approved wormhole and Android Harness original stay untouched.

## Testing and limitations
- Node syntax check on V2 entrance.js: PASS.
- HTML parse IDs unique, key dialog/voice/frame elements present: PASS.
- Chromium synthetic DOM interaction at 1440x900 and 390x844, reduced motion: PASS. Test opens Adult, confirms 8 titles, opens Harness accurate AI-thriller pitch, verifies sample URL, seated-actor UI, closes modal, opens Kids, verifies Curley URL. No JS page errors; no page horizontal overflow. **Synthetic DOM test does not certify remote media loading.**
- Original Take A video and edited contact sheet visually inspected: the web frame avoids extra boots by ending frame above them. No new video credits spent.
- Remaining: actual hosted video decoding/time progression, full physical phone test, browser en-GB installed voice, screen reader, captions synced to a proper actor-recorded performance (not yet produced), production QA of actor artifact-removal for wider future shots.

## Provenance
- Original untouched Google Flow video: `Character_walking_and_sitting_in…_20261011125555.mp4`, 8s, 1920x1080 at 24fps, SHA256: `e4b7532e74ceba47afc1803a825ac9d7fc39e4d1b324209072b3ea97b963ec41`; private original in studio Drive.
- Same actor and room as explicitly approved by user. No Runway or new Google Flow media generations.

## SHA256
`index.html` 2abdf8b6c4bc912613e98aeba5faff0de40003704282a248e9d7ecddb7799738
`entrance.css` 42cd4df79943082d61bcad99f8e943d204113c8c297c67dcf8de5d3e74e24028
`entrance.js` e29add9e4a0b055f43ed79f65a8c853c4efb26fcf27336527be03aa8ed273734
`librarian-arrive-and-sit-framed-cut-v2.mp4` 67288bc2fb0f3e8141ff44116903bb0f06604647f229c564329d4cd2c1deda30
`librarian-arrive-and-sit-framed-web-v2.mp4` 8b4c316756da59abc7287a7c5500b5cdf5fa242ff58386060dea9a522aacfa2f
`librarian-seated-close-v2.jpg` e6fadfcd8af63ebccf92f3cd238133283926f58716fab07aba168a2ca5d288aa
`edited_contact.jpg` 04829b9a66e57e33cdfb4e7686d82a5ca1f761e554c4ff4a68820f7d44052d09
