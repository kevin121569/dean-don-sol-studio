# Google Flow account access / Shot 01 QA checkpoint — 2026-10-11

**VERIFIED account:** signed in as kevin@goqsg.com through read-only TinyFish browser inspection; 50 Google Flow AI credits displayed. Two project tiles shown without readable names; we did not identify, open or alter a Librarian project. Model dropdown: **Omni 1.1 Flash**, Veo 3.1 Lite (default), Fast and Quality. The project Ingredients and voice-reference controls, as well as actual in-app generation price, were **not confirmed** during this read-only home/settings visit.

**Official Google documentation**: Omni Flash 1.1 supports Ingredients/References and 6s generations, and single-speaker voice references may be added under Ingredients where available. Published per-generation cost is **5 Flow credits for 6s 360p**, **10 credits for 6s 720p**, subject to actual latest in-app costs and eligibility:
- https://support.google.com/flow/answer/16352836
- https://support.google.com/flow/answer/16353334
- https://support.google.com/flow/answer/16526234

**New director's review room:** standalone HTML embeds the original approved portrait and original silent eight-second actor arrival byte-for-byte. Local candidate MP4/MOV/WebM side-by-side comparison, controlled scrub/play, captured PNG still, tech metadata, draft SHA-256 if supported, eight original-actor/dialogue/rights/UK-voice/caption gates, exported review JSON. All outputs remain draft; no automatic actor/voice approval, generation or public deployment.

**QA:** Chromium DOM test with complete self-contained HTML at **1440×900** and **390×844** PASS: embedded original assets loaded, 8s original silent reference, synthetic 6s **QA-only** video file loaded, player controls, draft PNG/JSON exports, incomplete gate blocked, no external requests/page exceptions/horizontal overflow. Sandbox policy blocks direct `file://` and localhost Chromium navigation; full offline double-click, real candidate SHA in a secure browser origin, real sound, physical phone and licensed voice audition remain **NOT VERIFIED**. Do not overstate these checks.

**Source/provenance:**
- Original seated portrait SHA256 `e6fadfcd8af63ebccf92f3cd238133283926f58716fab07aba168a2ca5d288aa`
- Original silent entrance SHA256 `8b4c316756da59abc7287a7c5500b5cdf5fa242ff58386060dea9a522aacfa2f`
- Review desk HTML SHA256 `b8367a1b2e14c295964303ef356d78373540d5ad77078770f21cac46591aa5da`

**Preserved Drive folder:** https://drive.google.com/drive/folders/1hUwCNvHpj4DTRLhSiyCkrL-hfE4fdo1q
Individual new files and archived ZIP verified there:
- `LIBRARIAN_FLOW_SHOT01_DIRECTORS_REVIEW_DESK_OFFLINE_V1_2026-10-11.html`
- `LIBRARIAN_FLOW_SHOT01_DIRECTOR_REVIEW_DESK_AND_QA_V1_2026-10-11.zip`
- `LIBRARIAN_FLOW_READINESS_AND_QA_GATE_2026-10-11.md`
- `LIBRARIAN_FLOW_DESK_QA_SCREENSHOT_1440.png` and `_390.png`

**GATE:** Google Flow generation NOT RUN; no Flow generation credits used. No live site, original footage, story scripts, Curley files, Harness game or official build was modified. Owner consent for spending Flow generation credits is separate from funding TinyFish browser automation; obtain an explicit single-shot cost authorization and verify actual in-app generation cost before submission. Draft PR remains unmerged.
