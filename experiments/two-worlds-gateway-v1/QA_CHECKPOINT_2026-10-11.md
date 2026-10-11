# TWO WORLDS GATEWAY V1 — DEPLOYMENT & QA
**Date:** 2026-10-11 | **Phase:** Separate unlisted staging preview

**Preview:** https://theidealabstudio.com/studio-entrance-preview/
**Public homepage:** https://theidealabstudio.com/ — preserved, not replaced.

## Built
1. New studio doorway with two intentionally different visual worlds.
2. Adult Library: accepted first cinematic actor in a warm realistic study. Web-optimized muted eight-second first take, seated portrait, replay, spoiler-free introduction and **optional** browser English (UK) voice audition. Voice is not a synchronized or recorded performance. Eight adult/general book pitch dialogs, all eight current sample links, accurate individual book detail links. Film teaser link and Harness browser development-game link.
3. Kids’ World: children's cover art, canonical cartoon Don Sol SVG, links to original Curley V2 portal, Better Questions opening, and clearly labeled children's game/cartoon **development previews**, not fictional finished games.
4. Adult host is now **The Librarian**, separate from cartoon Don Sol. The original actor is accepted. Preserve both identities rather than forcing the actor to match the cartoon.
5. Source assets are versioned, with no edits to production homepage, Curley's approved original V2 portal, or existing Harness game packages.

## Video and source provenance
- **Private original Google Flow Take A**: `Character_walking_and_sitting_in…_20261011125555.mp4` (8 s; 1920×1080; 24fps), SHA256 `e4b7532e74ceba47afc1803a825ac9d7fc39e4d1b324209072b3ea97b963ec41`; preserved privately in studio Google Drive and untouched by this gateway.
- **Derivative web preview**: `studio-entrance-preview/assets/library-host-walk-chair-muted-v1.mp4`, 8 s, 960×540, 18fps, **muted**, SHA256 `bc25931c54533094fa16b23ff61ef1a3f446de3b43e3b8263ff849eb3f19206f`. 330,845 bytes, from original take, no new generation.
- **Seated poster**: `studio-entrance-preview/assets/library-host-seated-poster-v1.jpg`, 960×540, SHA256 `af0519f094dc267428812f84f1d60ada883592e030e777fddb70a67d7d098369`. 134,425 bytes.
- Original website / Curley assets hotlinked from existing site, not duplicated or altered.
- The prototype's review asset URLs are internet-accessible as any published Github Pages asset. **Do not place private original video on web.**

## Verification
- `node --check` on `entrance.js`: **PASS**.
- `BeautifulSoup` HTML parse: **PASS**, no duplicate element IDs, core links and page structural ids present.
- **Hosted browser review**: https://agent.tinyfish.ai/runs/510ef80f-1f8c-46f7-a8f1-dcd278b95b41. Observed two entrances, original actor poster and video element, eight adult titles, Harness pitch modal and links, game and film link presence, UK voice audition control, separate kids portal and development links. Browser runner reported some content unrelated to actual Harness pitch; treat that paragraph in its report as inaccurate. The deployed script was inspected and contains the correct **AI thriller** pitch, not the mistaken 'lone prospector' narrative.
- **Independent local Chromium/Playwright DOM interaction smoke test**, desktop 1440×900 and narrow 390×844: **PASS** for choosing adult/kids, eight book cards, accurate Harness pitch, sample href, modal close, three kids panels, and home return; no JS page exceptions in these DOM tests. Local screenshots do not include remote book/actor assets because it is an isolated test document. Therefore this is **not** a certified physical-device/mobile visual QA pass.
- Deployed video and poster browser-rendered in hosted test. Autoplay success, actual English accent voice playback and full eight-second media progression are **not** certified; the original source has been independently reviewed in the earlier Take A QA.

## Known limitations / HOLD before official homepage release
- Original first actor test take includes **extra boots** on the rug near armchair. Actor and cinematic look approved; shot artifact **not approved for final production**.
- No original recorded English-voice performance, actor lip-sync or production captions synced to a final voice track. Voice audition uses installed browser `en-GB` TTS only when available; may be unavailable for some users.
- Kids game pages link to an in-development portal, not a production game.
- Browser DevTools console and physical-device mobile QA pending; reduced-motion and keyboard/screen-reader need formal independent review.
- Do not claim the actor is a real human employee or identify real persons. This is a fictional cinematic studio presenter.

## Recommended next gates
1. Artistic sign-off of the **two separate branded worlds**, not a forced shared character design.
2. Produce a corrected take **with the same actor**, remove duplicate boots while preserving bookshop, chair, smile and gait, using Google only and a separately approved budget.
3. Record/approve UK-accented original storyteller voice; implement video/voice sync, closed captions, pause/replay/mute control. Ensure pitch remains accurate and spoiler-free.
4. Conduct physical mobile testing, keyboard/screen-reader checks, video bandwidth test and kids-area QA. Then consider replacing the live homepage after explicit studio approval.

## Rollback
Preview is an isolated `studio-entrance-preview/` folder. Remove or revert that folder's commits to roll back without affecting current homepage, V3.2, Curley V2 or game builds.
