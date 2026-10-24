# The Librarian — live visitor walkthrough, seamless handoff PASS
Date: 2026-10-11
Original 75.567s user-provided desktop video: SHA256 `e0061aad203b4ccce9ff49ac9a95545bca22ec45f8af34872e49410d6dbae6b1`.
Private studio Drive: `06_STUDIO_WEBSITE_AND_BRAND/LIBRARIAN_WALKTHROUGH_QA_2026-10-11/` holds original full recording, contact sheet, frame evidence, and detailed report.

## User's actual screen-recording findings
- Real original cinematic actor walks and sits in the First Words welcome (0–11s).
- Welcome → adult Reading Room transition initially replayed the same eight-second walking sequence (12–18s), breaking a continuous-visit illusion. This is an **editorial continuity issue**, not a source-media failure.
- English (UK) **device voice audition** visibly starts in Reading Room, **not** a professional British voice recording (17s). Audio stream present in recording, but the actual accent and speech clarity are **not certified** by this visual inspection.
- Visitor chooses **Challenge my mind**, opens *The Distance Between Thoughts*, reads its real excerpt *inside* the Reading Desk, returns to the book introduction, then visits an external book/details page. Later the *What God Could Not Know* introduction renders correctly.
- This capture does not test the children's branch or a physical phone.

## Reversible single-entrance correction
- First Words link now: `/studio-entrance-preview-v4-1/?arrival=seated#adult`.
- Reading Room looks for **this explicit one-time URL flag**, holds the original approved seated portrait instead of replaying his arrival, and keeps the same book recommendations, samples, scripts and kids' assets.
- Direct visitors going to `/#adult` still get the original film. Anyone may explicitly use **Watch his entrance** to replay.
- No cookies, analytics, persistent storage, generation cost, voice cloning, actor recasting, or public homepage replacement. This stays in the **unlisted** review pages.

## Production verification
- GitHub Pages deployment: **SUCCESS** https://github.com/kevin121569/dean-don-sol-studio/actions/runs/38171877882
- Repeatable **live HTTPS Chromium test**: **SUCCESS**, attempt 2 https://github.com/kevin121569/dean-don-sol-studio/actions/runs/38171849631
- Test results:
  - `PASS 1440x900: one arrival, seated carryover, replay enabled, original Harness excerpt, direct-entrance film preserved`
  - `PASS 390x844: one arrival, seated carryover, replay enabled, original Harness excerpt, direct-entrance film preserved`
- Attempt 1 ran before Pages published, saw the stale original link and failed. It was correctly rerun after Pages SUCCESS. Real test now passing.
- Narrator casting, captions, final mobile physical-device and screen-reader reviews still HOLD. Preserve all studio masters and previous historical version checkpoints.