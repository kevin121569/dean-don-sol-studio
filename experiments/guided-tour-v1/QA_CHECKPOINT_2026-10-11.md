# Don Sol Guided Book Tour — V1 Review Checkpoint
Date: 2026-10-11
Status: STAGED REVIEW, NOT MAIN HOMEPAGE

## Preview
https://theidealabstudio.com/guided-tour-preview/

## Implemented
- Uses the actual site's catalog and existing character-led pitch framework.
- A floating Don Sol companion appears near the bottom-right, on a subtle cloud.
- Existing 'Ask Don Sol' control summons a chooser with all 9 book titles instead of the old generic recommendations.
- 'Take me there' changes the character's state, scrolls to the selected book, highlights it, and opens the character pitch scene.
- *The Harness* links its free sample, film teaser and playable game.
- *The Book of Better Questions* opens the separate playful Curley bookworm pitch.
- Existing normal book links remain available; route animation is reduced-motion aware.
- Review control inside the book stage lets authorized staff watch the approved G1 close-up in private Google Drive, on demand.

## Verified video source
Drive master: `Animated_mentor_smiling_and_nodding_20261010161133.mp4`
Drive ID: `1VV3aabtxnr9s-jUn62fiG_tjim9dH0fL`
Known SHA-256 (local upload compared against QA checkpoint): `1a93dc792588098b2adb934dc05d58977b15ab2c6631fa6f9d415b5bb39f38ee`
10 seconds, H.264 1920x1080, 24 fps, AAC existing audio **not yet approved as final audio**.
Preserved original source untouched in studio Drive.
The source is PRIVATE. This preview embeds its Drive viewer only when asked; it is not a distributable public video component. A direct repository transfer hit a size/protocol limit. Public web-ready hosting remains BLOCKED until a reviewed derivative can be uploaded properly.

## QA
- GitHub Pages deployment for isolated preview: successful, `https://github.com/kevin121569/dean-don-sol-studio/actions/runs/38143004661`
- Browser live QA: `https://agent.tinyfish.ai/runs/d6af3986-138d-4de8-a3b9-ccb94e62ade7`
- PASS: main-page load; floating character; chooser with nine titles; Harness escort and pitch; approved-video *viewer opens* and closes (this does **not** verify private video playback); close/resume catalog; Better Questions route to Curley presentation.
- NOT TESTED: actual video playback without Drive sign-in; physical phone/mobile viewport; screen reader; actual AI voice performance; complete 3D body/real seated walk cycle.
- No other private Google Drive assets or previously approved Curley animations changed.
- Kate's frozen Harness game build not changed.

## Next artistic+technical stage
1. Stage a silent compressed, self-hosted clip derivative while retaining full-HD source and soundtrack securely private.
2. Composite the clip within the sit-down pitch, with the website's text remaining synchronized; don't claim lip sync or speech yet.
3. Produce approved voiced lines and character movements from established animation library, NOT substitute sun mascot.
4. Accessibility, mobile QA, visual sign-off before main homepage integration.


## V2 update — 2026-10-11, approved performance self-hosted
- **Approved G1 master left unchanged and private:** `Animated_mentor_smiling_and_nodding_20261010161133.mp4`, 3,402,552 bytes, SHA-256 `1a93dc792588098b2adb934dc05d58977b15ab2c6631fa6f9d415b5bb39f38ee`.
- **Web derivative:** `don-sol-approved-closeup-web-v1.mp4`, 132,892 bytes, SHA-256 `445e0a1b3b51d42e2e88424d77fc25e143ed4977494ea59e256d7f65eb0aaf0a`. H.264 640×360, 16 fps, duration 10.000 s, **no audio stream**.
- Source web derivative stored in the studio Drive `06_STUDIO_WEBSITE_AND_BRAND/` (Drive file ID `1vzBsEZtKnEWdfXd1CtTscfCMQZGU2bbp`) and published as `/assets/video/don-sol-approved-closeup-web-v1.mp4`. Git blob SHA `392a55871281a84bf702bba5533accdb936c630e`.
- Guided preview updated at `https://theidealabstudio.com/guided-tour-preview/`, using source files `guided-tour-preview/guide.js`, `guide.css`, and `index.html` (version V2).
- Don Sol's approved silent cartoon performance now appears **inside** the book-selling presentation, and as a subtle companion animation after visitor interaction. Video replays on demand. Curley remains the guide in the children's route, and the Don Sol clip is hidden there. Reduced-motion preferences retain the image fallback.
- The private Drive iframe was removed entirely from V2; no permission exposure or third-party embed required. Voice remains distinct and pending; this clip is **not lip-synced spoken sales dialogue, not full-body walking, and not a seated cinematic shot**. No new generated imagery or video; Runway not used.
- Deployment success: `https://github.com/kevin121569/dean-don-sol-studio/actions/runs/38147183975`
- Hosted browser test: `https://agent.tinyfish.ai/runs/95fc502f-1d7f-42b3-b02c-fd10d3316210`
- **PASS:** self-hosted MP4 returns HTTP 200, correct video element and source integrated, Harness guided route, Curley kid route, no private Drive iframe, stage replay UI, all nine cards and filters intact.
- **UNVERIFIED:** low-level playback progression metrics (`videoWidth`, `videoHeight`, `readyState`, `currentTime`) were not available in the browser inspection, despite the in-page `playing` event indicator. Actual physical-device QA, mobile layout, screen reader, full animation choreography and approved character voice remain follow-up gates.
- The **public homepage remains on its prior design**; no production launch of the guided companion V2 is authorized yet. Preserve the approved Curley V2 portal and frozen Harness Android QA baseline.
