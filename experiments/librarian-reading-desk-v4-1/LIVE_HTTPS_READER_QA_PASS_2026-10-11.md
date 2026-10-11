# The Librarian — V4.1.1 live HTTPS reading-room certification
Date: 2026-10-11
Status: **REAL BROWSER WEB E2E PASS (DESKTOP + MOBILE-SIZED EMULATION)**

## Evidence
- Original unlisted preview: https://theidealabstudio.com/studio-entrance-preview-v4-1/
- Verified GitHub Actions run: https://github.com/kevin121569/dean-don-sol-studio/actions/runs/38167289406
- Runner: ubuntu-latest, Playwright Chromium (actual public HTTPS; **not a mocked site or sample**).
- Fully automated script: `tests/librarian-live-reader-e2e.cjs`
- Job conclusion: SUCCESS; original on-run console lines:
  - `PASS 1440x900: chapter Black. loaded, A+ 19->21, nested pitch return, kids link`
  - `PASS 390x844: chapter Black. loaded, A+ 19->21, nested pitch return, kids link`

## Exactly what the test exercised
1. Visit the actual GitHub Pages custom domain `/studio-entrance-preview-v4-1/`.
2. Enter The Library. The book-reading demonstration is a native button, not an off-site anchor.
3. Click **Read The Harness here**: a native Reading Desk modal opens.
4. Read inside the iframe the REAL published `/samples/harness.html` excerpt, including the first paragraph `Black.` and chapter title `GOOD LUCK WITH THAT`.
5. Press A+ and independently measure an actual paragraph's computed CSS font-size increasing from **19px to 21px**.
6. Close the Reader; verify the native dialog is closed.
7. Choose mood **Give me danger**; choose The Harness **His introduction**; verify true AI-thriller pitch.
8. Click **Read here with the Librarian** from inside that pitch; verify original chapter again in iframe; close the Reader and confirm the original pitch remains open.
9. Close book pitch, switch to **Kids' World**, and confirm original animated portal link `/worlds-preview-v2/` remains intact.
10. Assert no uncaught page JavaScript exceptions at either 1440×900 or 390×844 emulated viewport.

## Release significance
**PASS — the specific real-website interaction previously blocked in V4/V4.1 now works in actual independent browsers, including reading content within the Library.** The preceding metered browser agent's original failures were inability to activate an element and an anchor that navigated away, not proof that the live in-room reader had irreparable issues.

## Holds and safety
- This verifies Chromium **phone-sized viewport emulation**, not physical iPhone, Android handset or assistive tech.
- Production homepage unchanged. All previous V1–V4 variants and chosen original cinematic actor unchanged.
- Live EN-GB recorded actor audio, 25–40 second spoken performance and caption sync are **NOT produced yet**; existing device speech audition is not lip-synced.
- Final acceptance for public homepage replacement remains separate; no merge or release implied.
- No browser automation wallet, video-creation credits or paid TTS audio consumed by this QA run. Hosted CI itself uses normal GitHub Actions capacity.
- Keep the updated reading-desk site as an **unlisted** preview until creative and mobile/accessibility release gates.
