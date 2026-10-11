# Librarian Reading Desk V4.1.1 — Studio QA Checkpoint
Date: 2026-10-11
Status: **UNLISTED REVIEW — DEPLOYED SOURCE / IN-ROOM LIVE QA STILL HOLD**
Preview: https://theidealabstudio.com/studio-entrance-preview-v4-1/

## Creative lock
- The original user-approved dark-haired, mustached cinematic Librarian actor and room are preserved EXACTLY; do NOT recast him as cartoon Don Sol.
- Kids World/Curley V2 animated assets, production homepage, original V1–V4 previews and all Harness source/builds remain untouched.
- Google Flow original eight-second source unchanged; approved web crop hides extra boots but does not clean master.
- Original British/English actor-recorded narration is NOT produced. Browser TTS remains an optional device-specific audition and is not lip-synced.
- No new media generation credits consumed.

## V4.1.1 release behavior
- In each adult-book pitch, prominent **Read here with the Librarian** button opens the in-room Reading Desk with current real sample path; **Open original sample** remains a normal link and works without scripts.
- At Bookshelves, **Read The Harness here** is a native button handled explicitly by reader JS, not an anchor susceptible to navigation; distinct **Open original chapter** anchor is the fallback.
- 8 existing original sample pages embedded from the same site in sandboxed, no-scripts iframe. No manuscript rewriting or copies staged.
- Reader shows actor, chapter heading, font resizing, progress, Return to Librarian; signals unavailable iframe body rather than falsely claiming progress.
- Reader remains a private experimental design.

## Verification and outstanding gates
- Both desktop 1440×900 and narrow 390×844 synthetic Chromium DOM integration checks PASS: selecting mood, entering Harness pitch, direct native reader control, opening iframe QA-only excerpt, A+, progress, close restores pitch/focus, direct original sample anchor, one-click shelf reader, kids portal, no JS errors.
- Direct local HTTP/file URLs are blocked by this environment's Chromium administrator, so **local DOM QA is not an actual live same-origin or physical-device test**.
- First V4 hosted automation https://agent.tinyfish.ai/runs/bb748677-208f-49d9-9cc8-3b129bec4573 reached pitch but failed at element-ID click before opening iframe; its 'feature absent' diagnosis contradicted deployed HTML.
- Initial V4.1 hosted automation https://agent.tinyfish.ai/runs/fd2d0395-7636-47fc-af89-6a2add3f7646 used the original demo ANCHOR and navigated to actual https://theidealabstudio.com/samples/harness.html, verifying the real chapter heading THE HARNESS and first paragraph 'Black.', but NOT the iframe reader. V4.1.1 replaces that shortcut with a dedicated JS button and separate fallback link.
- **After V4.1.1 button fix, in-page live iframe rendering / A+ / return still NOT independently retested or certified**. Do not stamp final production PASS until real browser evidence.
- Do not replace production homepage or change kids' assets before explicit go-ahead.

## Provenance and rollback
Complete verified ZIP `STUDIO_LIBRARIAN_READING_DESK_V4_1_1_2026-10-11.zip` archived privately under studio Google Drive `06_STUDIO_WEBSITE_AND_BRAND/STUDIO_LIBRARIAN_READING_DESK_V4_1_1_2026-10-11/`. Unlisted preview isolated under `studio-entrance-preview-v4-1/`; remove this directory only for rollback. No previous public version overwritten. Source snapshot held on this branch.
