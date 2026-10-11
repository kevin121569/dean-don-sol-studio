# Librarian / The Distance Between Thoughts — Voice Scene V1
Date: 2026-10-11
Editorial source: existing `studio-entrance-preview-v4-1/entrance.js` distance.pitch
Status: **VOICE REHEARSAL ONLY — recorded performance and exact WebVTT still HOLD**
Release boundary: feature branch only. Public homepage and approved preview pages unchanged.

## Authoritative cast and design
Reuse the originally approved **realistic dark-haired, mustached, tweed-suited Librarian** in his established library, seated and quiet. Do not recast him, generate substitute faces, or make the eight-second silent entrance appear to speak. Adult and children's worlds remain separate. This rehearsal uses the existing `librarian-seated-close-v2.jpg` asset.

## Source-locked dialogue (verbatim)
> Ah, this one asks an unusually tender question. Suppose an artificial mind begins to remember not only events, but the people who gave them meaning. Would continuity become a kind of love? Aster is a curious companion for a story about what survives between thoughts. Do read the opening, and see what it awakens in you.

The on-page five sentence cues combine to this **exact** existing script. No original book sample is rewritten or reconstructed. Do not introduce unapproved spoiler or claims about the story.

## Editorial sentence beats — cue sheet, NOT timed captions
| Cue | Dialogue | Performance |
|---|---|---|
| 01 | Ah, this one asks an unusually tender question. | Warm recognition, slight private smile; do not perform as advertisement |
| 02 | Suppose an artificial mind begins to remember not only events, but the people who gave them meaning. | Gentle wonder, directness, preserve every word |
| 03 | Would continuity become a kind of love? | Momentary hush *after* the question; no overwrought whisper |
| 04 | Aster is a curious companion for a story about what survives between thoughts. | Affectionate and thoughtful, not condescending |
| 05 | Do read the opening, and see what it awakens in you. | Quiet invitation; finish cleanly, without announcer cadence |

These are paragraph/sentence cue IDs used to advance the on-screen dialogue when the **device audition** fires each phrase's onend event. They are not millisecond-exact captions of a final WAV.

## Casting and sound direction
Original fictional mature adult male English storyteller, natural Southern English/RP softened to conversation, intimate, lightly wry, not a celebrity impersonation. One voice only. Subtle smile at the beginning. Slight pause after the central question. No new words, faked laughter, background music, stingers or effects.

Audio goal once rights/costs are approved: standard PCM 48kHz WAV master, web-compressed derivative, documented generation or voice-performer license, cost record and script checksum. The eight-second silent actor entrance is **not** to be extended into false lip-sync. Keep the approved seated shot during spoken narration.

## Actual rehearsal features
- Unlisted/noindex development page: `librarian-distance-voice-rehearsal-v1/`; currently **not published to the public hosted site**.
- UK-only native `speechSynthesis`, started exclusively by user click. No fallback to US English. Five sentence-level visual highlights and persistent full transcript.
- Stop control; local WAV/MP3/OGG/M4A loading via `URL.createObjectURL` in browser only, with no file upload or recording rights claim.
- A local recording always displays the full written transcript but is explicitly **NOT synchronized to timed captions**. This is a deliberate release gate.
- Responsive and reduced-motion styling, accessible transcript, visible state/status, disabled autoplay.
- No tracking, cookies, localStorage, third-party generation, password/account use or voice imitation.

## Release QA gates
1. QA: actual original actor portrait loads; no replacements (branch Chromium).
2. QA: five scripted utterance events match the approved source verbatim; UK-only fallback (branch Chromium synthetic voice, **not actual auditory certification**).
3. QA: transcript, keyboard controls, local take and no external requests; desktop and mobile-sized browser, no overflow.
4. HOLD: obtain a commercially usable licensed human/Google TTS master with documented rights and **verified user authorization of any billing**. Do not spend credits without approval.
5. HOLD: professional audio audition; verify actual warm UK accent, pace and speaker identity, no omissions/clipping.
6. HOLD: align and validate WebVTT timecodes against approved audio and verify caption accuracy.
7. HOLD: physical Android/iPhone keyboard/screen-reader/audio and final studio creative approval.
8. HOLD: separately authorize preview publication or a production-site link; no merging into the homepage during casting.

## Cross-project preservation
All earlier versions of the Librarian, Reading Desk, original published sample pages, `Curley V2` and other children's projects, `The Harness` Android baseline and creative masters remain unchanged.

## Final V1 branch-browser QA checkpoint — PASS
**GitHub Actions run:** https://github.com/kevin121569/dean-don-sol-studio/actions/runs/38180868067
**Tested commit:** `c5564cad6e1da044488632ccbbd14ef80c64c993`
**Run result:** SUCCESS (Chromium, branch served on localhost; not a public HTTPS deployment).

Recorded console results:
- `PASS 1440x900: source lock, original actor, 5 scripted audio cues, local take, transcript, privacy, layout`
- `PASS 390x844: source lock, original actor, 5 scripted audio cues, local take, transcript, privacy, layout`
- `PASS no-English-UK fallback: full transcript visible, no accent substitution`

Four screenshots archived in GitHub Actions artifact `librarian-distance-voice-qa-screenshots`, including clean first-arrival desktop/mobile and post-audition local synthetic QA WAV; the latter **is not human voice audio**. Original actor image loaded, local file remains a `blob:` URL, no outgoing HTTP/HTTPS requests and no horizontal page overflow. Tests use synthetic in-memory on-device speech events to validate control flow. **No actual actor voice playback, accurate accent or final captions were certified.**

The first two CI attempts failed due to test-harness mistakes (unbound UK mock fixture and misclassifying a local `blob:` as external network); both were repaired. Final branch CI is PASS. These were not application defects. The main website remains untouched. DRAFT release gates remain active.
