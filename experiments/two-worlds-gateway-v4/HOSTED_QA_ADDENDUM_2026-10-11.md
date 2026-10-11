# V4 hosted QA addendum — partial browser automation failure, not proven site absence
Date: 2026-10-11
Review: https://theidealabstudio.com/studio-entrance-preview-v4/
Deployment: https://github.com/kevin121569/dean-don-sol-studio/actions/runs/38165203737 — SUCCESS

## Verified
- V4 original source and cached-independent unlisted GitHub Pages directory committed successfully. Main public homepage and all prior review paths preserved.
- GitHub source `studio-entrance-preview-v4/index.html` **does contain** `#readingDesk`, `#readerFrame`, and includes both `reading-desk.css?v=4` and `reading-desk.js?v=4` in the page.
- Deployed `reading-desk.js` source handles same-origin original samples, both catalog and recommendation links and also `#pitchSample` in the existing book dialog; it calls native `desk.showModal()` and points the iframe to the exact original published excerpt path.
- Independent local Chromium synthetic DOM interaction tests PASS at 1440x900 and 390x844 for nested dialog, A+ type sizing, scrollbar progress, original href, return focus, and child portal retention. The **mock excerpt is test-only** and NOT hosted.
- Original first actor and V3 consultation untouched, no new generated audio or video.

## Hosted browser runner result — INCOMPLETE
Run https://agent.tinyfish.ai/runs/bb748677-208f-49d9-9cc8-3b129bec4573 (read-only):
- PASS gateway, adult Library, 'Give me danger', The Harness recommendation, opening original pitch/dialog and sample href existence.
- FAIL to trigger `#pitchSample`: runner encountered an element-ID lookup error and STOPPED at pitch. It **never opened the Reader's Desk**.
- Runner subsequently reported the Reader's Desk and iframe 'not present' in contradiction to independently verified deployed HTML/source; likely inspecting only visible elements of the closed `dialog`. **Do NOT call this a proven application regression or production PASS.**
- **True state: LIVE END-TO-END READER RENDERING NOT VERIFIED YET**. Retest later with direct actual click by human or reliable browser automation. No further paid browser passes attempted at this checkpoint.

## Pending release gate
Human opens the unlisted V4 link, goes Library -> Give me danger -> Harness -> His introduction -> Read free sample; sees the original excerpt text 'Black.' from /samples/harness.html in Reading Desk; exercises A+, scroll progress, and Return, remains in original pitch. Test adult direct recommendation sample path and narrow physical device. Browser fallback remains the original navigable sample href if JavaScript unavailable. Continue holding production homepage and narrator audio.
