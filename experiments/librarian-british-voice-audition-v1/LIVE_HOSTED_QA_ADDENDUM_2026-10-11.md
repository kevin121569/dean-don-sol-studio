# Librarian Original Voice Casting Room — Live HTTPS QA
Date: 2026-10-11
Status: **PREVIEW DEPLOYMENT PASS / LIVE AUDITION UI PASS / RECORDING NOT YET GENERATED**

## URLs
- Unlisted casting room: https://theidealabstudio.com/librarian-voice-audition-v1/
- GitHub Pages successful deploy: https://github.com/kevin121569/dean-don-sol-studio/actions/runs/38168762031
- GitHub Actions hosted browser QA success: https://github.com/kevin121569/dean-don-sol-studio/actions/runs/38168889829
- Studio draft: https://github.com/kevin121569/dean-don-sol-studio/pull/43

## Evidence
Node syntax PASS, checksum-verified ZIP PASS, local synthetic DOM Chromium PASS (1440x900 / 390x844), and **real hosted Chromium on published HTTPS URL** PASS at both viewports.
GitHub runner logs:
- PASS live 1440x900: real actor image, scripts, local test WAV playback, separate audition slots, no upload
- PASS live 390x844: real actor image, scripts, local test WAV playback, separate audition slots, no upload

The test WAV is an in-memory **synthetic test tone**, not original narrator audio. There is NO generated narrator audio, recorded UK-English actor voice, or lip-sync in the booth. Both original spoken welcome and Harness scripts remain locked. Files selected into the local WAV/MP3/OGG/M4A inputs stay in visitors' browsers. There is no remote upload.

## Remaining gates
- Verify account/project **Google AI Studio Free Tier** before Gemini 3.8 Flash TTS Run. Google's official pricing is free for model input and output on Free Tier, but a paid project may incur charges. Connected browser agent wallet nearly depleted. No Google Run, no generated audio or credits spent.
- Download one genuine original British male storyteller WAV; audition with our seated actor and QA accent, pacing, charm, exact wording, clean signal, usage rights, and actual duration.
- User approval, commercial rights, mastered audio and subtitles required for release.
- Real phone testing and assistive technology beyond viewport emulation still open.

## Preservation
First chosen cinematic Librarian actor and original silent footage unchanged. Existing homepage, Reading Desk V4.1.1, original cartoon Don Sol and Curley V2, Harness development sources and masters remain untouched. Review-only noindex preview.
