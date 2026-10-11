# THE LIBRARIAN'S FIRST WORDS — cinematic welcome V1
Date: 2026-10-11
Status: **UNLISTED REVIEW / LOCAL SYNTHETIC BROWSER QA PASS / LIVE HTTPS QA PENDING UNTIL RUN**

## Creative lock
- The original dark-haired, mustached tweed-suited **first cinematic Librarian** remains cast. No identity replacement, recasting, repainting or change of his original master.
- The original eight-second 800×450 web derivative (444,462 bytes; actual media length 8.0s) from the Google Take A actor is reused **untouched**, as is the 101,086-byte seated portrait. The private 1920×1080 master remains unchanged. The earlier extra-boots artifact is hidden by the previously approved editorial crop, not repaired in source.
- Cinematic serious books, films and adult games stay separate from the children's cartoon Don Sol, Curley, Percy, Luke, Tooth, Robot and Curley V2 portal.

## What was actually built
An *unlisted, noindexed* isolated 'First Words' cinematic rehearsal page:
1. On visitor click, play the original eight-second muted walk-and-sit film. Automatic transition after the end to the existing seated portrait; a 'Go to his chair' button avoids waiting.
2. Display the exact approved welcome: "Ah, welcome. Come in, won't you? Here we keep the stories that ask difficult questions—and aren't afraid of untidy answers. Choose a book, and I'll tell you why it deserves a look. No spoilers. Just an invitation."
3. Require a **separate visitor click** to start optional speech. An installed `en-GB` device voice may audition the fixed dialogue; if no English (UK) voice exists, report the absence and do not silently substitute US or other accents.
4. Optional loading of an approved local WAV/MP3/M4A/OGG recording; file is played using a browser object URL. No audio is sent to a backend, nor is an actor's speech falsely portrayed as lip-synced by a silent eight-second film.
5. Stop/replay controls; reduced-motion support; written transcript remains visible. Visitor can continue to the previously verified working Reading Desk V4.1.1 or to the existing animated kids' world.

## QA
- JavaScript `node --check`: PASS.
- ffprobe source web derivative 8.000 s, 444,462 bytes: PASS.
- Python Playwright Chromium synthetic DOM QA (desktop 1440×900 and narrow 390×844): PASS for seated transition, voice controls, local in-memory WAV fixture audition/stop, source selection, file-status message, original Reading Desk/kids routes, JS no errors and no document horizontal overflow. Screenshots inspected.
- Local synthetic QA uses a **440Hz sine-wave test WAV**, not a Librarian performance, and injects the approved poster as a data URL in a static DOM. The test sound and synthetic screenshots are NOT part of the public preview. Container browser directly navigating HTTP/file pages is blocked by administrator; these synthetic tests are not a substitute for a real hosted pass.

## Still NOT produced or certified
- No original British-accent recorded Librarian WAV or final actor voice. Google AI Studio tier eligibility for user's specific project has not been independently checked, and no paid audio or video generation authorized or run.
- Browser en-GB voices vary and can be missing. The rehearsal only auditions device speech or a user-selected local file.
- Native lip-sync, professional closed-caption timecodes for future original audio, physical phone testing and full assistive-tech testing remain open. The transcript is accurate but not word-synced to unrecorded audio.
- The staged clip is silent. Do not claim the actor visibly speaks. The adult public homepage and official website are unchanged.

## Production controls
- Source resides only under `/librarian-welcome-preview-v1/` in GitHub Pages and versioned source snapshot on a draft branch. Preserve site homepage, original V4.1.1 and every earlier preview, Curley V2, Android Harness baseline, game, film source.
- Use only approved studio dialogue to evaluate Google free-tier TTS, no confidential manuscripts or data. Original voice should be an **original fictional English narrator**, not a cloned public figure.
- Next acceptance: 1 signed-off original ~20–25-second British English WAV, actual rights/cost/duration noted; 2 staging only against seated portrait; 3 listener/QC and user review; 4 final audio/master/captions; 5 separate public-launch approval.
