# The Librarian’s First Words — V1.1 Live HTTPS QA PASS
Date: 2026-10-11
Status: **UNLISTED PREVIEW — LIVE CHROMIUM INTERACTION PASS; VOICE CASTING HOLD**

## Live hosted evidence
Unlisted preview: https://theidealabstudio.com/librarian-welcome-preview-v1/
GitHub Pages deployment (revised WebM + H.264 source): https://github.com/kevin121569/dean-don-sol-studio/actions/runs/38170654064 — SUCCESS.
Live browser test: https://github.com/kevin121569/dean-don-sol-studio/actions/runs/38170764075 — SUCCESS, Chromium on actual hosted HTTPS page, not a mock.
Source branch: feature/librarian-first-words-cinematic-rehearsal-v1-2026-10-11
Draft review: https://github.com/kevin121569/dean-don-sol-studio/pull/44

Verified console evidence:
- `PASS REAL HTTPS 1440x900: original actor poster, real 8s video progression, original welcome, local test-WAV play/stop, English voice fallback, destinations`
- `PASS REAL HTTPS 390x844: original actor poster, seated shortcut, original welcome, local test-WAV play/stop, English voice fallback, destinations`

## Result / interpretation
- Original user-approved dark-haired, mustached tweed-suited **first cinematic Librarian** and warm book-lined set PRESERVED.
- Eight-second silent **original approved film advances and transitions** to the approved seated portrait at desktop test width. 390px viewport validated the **skip-to-chair** alternative, not eight-second automatic film playback at narrow width.
- Original locked welcome text displayed correctly.
- Explicit visitor-triggered speech controls work with a **local in-memory sine-wave QA tone** and report no EN-GB voice installed if appropriate. THIS TONE IS NOT AN ACTOR/NARRATOR RECORDING AND WAS NOT PUBLISHED.
- No local audio upload API; file stays on visitor's device. Links to working adult Reading Desk and separate Curley/cartoon kids portal preserved.
- No uncaught page JS errors or horizontal document overflow found.
- Media compatibility fixed by adding an 8-second VP9/WebM derived from approved video first in the source list; H.264 MP4 remains unchanged second option for Safari/iOS. Same framing, character and story performance; no generative video remake or credits.
- Two earlier CI runs failed because test assertions expected the hidden portrait before the film and checked a not-yet-loaded image immediately. A subsequent playback check failed because H.264 did not progress in that test environment. These caused corrected test assertions and VP9 WebM fallback; final real HTTPS CI PASS is decisive for the checked Chromium environment.

## Release holds
This is **NOT** final narrator voice or a lip-synced performance. Neither Google-generated original British narration nor an approved actor-recorded WAV has been produced. Browser device en-GB voice is optional and dependent on the reader's installed voices.
Not yet certified: physical Android/iPhone on-device QA, multiple real-world browsers beyond Chromium, assistive technology/screen reader, complete caption timing and voice/video mastery. The silent original Google Flow master remains protected and still contains the isolated stray-boot artifact outside the web editorial crop.

## Archive / boundaries
- Original first V1 checkpoint ZIP retained; corrected V1.1 ZIP `LIBRARIAN_FIRST_WORDS_CINEMATIC_REHEARSAL_V1_1_2026-10-11.zip` checksum verified in private studio Drive at `06_STUDIO_WEBSITE_AND_BRAND/LIBRARIAN_FIRST_WORDS_CINEMATIC_REHEARSAL_V1_1_2026-10-11/`.
- The official public homepage, previous Library V4.1.1, original kids Curley V2, cartoons, Harness game and film masters unchanged.
- No new Google generation, Runway, or paid external browser automation authorized or used for this V1.1 step.
- Keep this preview unlisted until voice, physical QA, accessibility and creative release approval.
