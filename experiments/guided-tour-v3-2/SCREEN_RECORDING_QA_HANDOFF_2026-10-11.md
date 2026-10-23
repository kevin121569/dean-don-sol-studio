# DON SOL STORY ROOM V3.2 — second-user-screen-recording fix
Date: 2026-10-11
Status: UNLISTED REVIEW / CORE DESKTOP SCROLL REGRESSION VERIFIED PASS / ART POLISH & MOBILE PENDING

## Trigger
User supplied the second actual website review recording, `20261011-1518-46.7034615.mp4`, 57.0333s, 1914×828, ~47.997 MB. SHA256 `7f99e0a66a2334f2b3016a8a6e16b76fb5c6468df833f8e54400928f63e17fd3`.
**Private user video was NOT committed, published, or uploaded to public site.**
The screen recording exposed a defect missed by V3.1 automated browser QA:
- At about 15–22 seconds, while right pitch text scrolled, the portrait moved up/out of view and left half turned purple.
- The portrait returned when user scrolled upward or replayed entrance. Hence CSS `position:sticky` alone failed in that browser.
- The last scroll appeared to require repeatedly repositioning the page to see Don Sol and the text together.

## Structural fix
- Created a separate review https://theidealabstudio.com/guided-tour-preview-v3-2/ (noindex).
- `layout.css` changes the adult-only presentation to a **fixed-height, overflow-hidden outer dialog**.
- The two-column `sg-dialog-shell` has fixed 100% height; `sg-stage` remains stationary and only `sg-story` scrolls internally.
- Close control anchored to the dialog top-right, not drifting with scroll.
- Narrow-screen layout provided as a fixed character strip above an independently scrolling story text pane (not physically phone-tested).
- Don Sol's genuine approved silent G1 close-up remains in character area; no new Google or Runway rendering/credits.
- After the first targeted browser test, added decorative chair/bookshelf/book-cover set **behind** the real portrait to reduce dead empty space; this aesthetic follow-up was deployed but not separately browser-certified.
- These adult layout changes are scoped to `.sg-dialog.v3-adult` and do not change Curley's presentation, approved wormhole, the Android game or the public homepage.

## Test record
- Targeted live browser regression: https://agent.tinyfish.ai/runs/6ec17a05-ddfa-4e5a-88fd-b86559c59681
- **PASS**: Don Sol portrait/video remained fully visible on left at the third story thought and after right panel scrolling. Browser described `.sg-story` independently scrolling; `.sg-stage` fixed. Close button did not overlap controls. No disappearing character.
- **LIMIT**: This targeted test did NOT find the free sample CTA at the perceived bottom of the scrollable region; original guided presentation code retains it in `.sg-links` but its V3.2 direct click path was not independently reverified.
- **LIMIT**: Decor chair aesthetic CSS added after that browser test; human visual signoff pending.
- **NOT TESTED**: Actual mobile phone, screen reader, keyboard-only focus travel, Curley route V3.2, physical playback timing, real voice/lip-sync, completed standing-to-seated animation.
- **No release authorization** implied by these results.

## Repo and rollback
- Complete source in `experiments/guided-tour-v3-2/` on branch `feature/don-sol-v3-2-fixed-stage-2026-10-11`, includes saved fullbody reference copy.
- Live unlisted review `guided-tour-preview-v3-2/`.
- Original V3, V3.1 and V2 preview folders remain unchanged; public homepage unchanged.
- Prior user recording revealed the true regression; do NOT mark V3.1 as complete based on earlier QA.
- Existing silent approved G1 MP4 hosted as `/assets/video/don-sol-approved-closeup-web-v1.mp4`, studio master private in Google Drive, unchanged.
- No Runway. No generation charges.

## Next gate
1. Author to visually check V3.2 at recorded desktop resolution and phone screen.
2. Ensure sample link is reachable in right scroll pane and actionable on all widths.
3. Curley regression in V3.2.
4. Obtain clean established full-body animation, proper seated performance and approved wise voice from Google-based production workflow, after budget/creative approval.
