# Story Room V3.1 — QA from user screen recording
Date: 2026-10-11
Status: UNLISTED PREVIEW, DESKTOP BROWSER QA PASS FOR TARGETED FIX, MOBILE AND CURLEY V3.1 NOT TESTED

## Source evidence
User supplied a **51.400s screen recording of V3**, 1902×906, 30fps H.264/AAC stereo, 46,886,710 bytes, SHA-256 `7f6ab0a028e2e65128c1b1eb19c4224fd3ca55029fd1dbba32b48990244d8043`.
The recording was inspected locally. It has NOT been committed or uploaded to a public repository.

Observed problems from the actual user view:
- At the later pitch thoughts the left stage became mostly blank purple while scrolling. The approved portrait was pushed out of view instead of staying alongside the text.
- An oversized duplicated quote bubble entered the left frame near the bottom and overlapped the replay button.
- There were two different replay mechanisms at once: a large stage-level overlay and the talk-card replay.
- The written four-part beat advanced by timer independent of optional generic device narration. This may cause confusing mismatches.
- This was visibly an HTML/video animatic, **not** completed standing/sitting full-body performance or a canon voiced character.

## V3.1 resolution
Unlisted live preview: https://theidealabstudio.com/guided-tour-preview-v3-1/

- Sticky illustrated/video Don Sol stage remains beside the right-side pitch text while dialog scrolls at desktop widths.
- Compact sticky stage layout is CSS-staged for narrow viewports, **not yet phone QA certified**.
- Duplicate, truncated speech bubble and redundant large video replay control hidden in adult story room.
- Voice control hidden for adult scene until an approved synchronized voice source exists. Legacy optional device-voice code remains elsewhere but not used in adult V3.1 presentation.
- Text thought progression is visitor-controlled, not automatic; Next/Previous/Replay still function.
- CSS entrance and G1 real silent close-up preserved.
- Children's Curley route otherwise unchanged.
- `aria-hidden` removed from parent of focusable Skip-to-story button to avoid hiding a control from assistive tech.
- Original V3 preview, V2 preview, main homepage, frozen Harness game and approved Curley wormhole all preserved.

## Test
GitHub Pages deployment PASS: https://github.com/kevin121569/dean-don-sol-studio/actions/runs/38149512508
Hosted desktop QA PASS on target: https://agent.tinyfish.ai/runs/00123fd7-d5ee-4e45-b685-d836c56db6fd

Confirmed:
- Don Sol remains visible in left stage as reviewer scrolls the right text all the way to sample CTAs.
- No overlap from duplicate quote or standalone replay overlay.
- Four passages change ONLY on Next/Previous; scene replay works.
- The Harness entrance, books, sample/game/film links, imagery and approved silent video available.
- All 9 catalog cards still present and filters visible.
- **NOT TESTED** in this V3.1 run: full Curley children scene (browser test limit), mobile viewport/physical device, accessibility with screen reader, numeric video frame progress, production voice and lip sync.
- Earlier V3 browser QA covered Curley, but that does not certify V3.1.

## Budget and provenance
Reused existing studio animation and source artwork. No Google generative credit spent for this UI change. Runway not used. No public user screen-recording upload.
This is still a stage animatic/placeholder rig, not a finished true body-animation performance.

## Editorial next gate
Have the user review V3.1 visually before the studio invests further time in better full-body composite rigs, seating motion, or recorded character voice.
