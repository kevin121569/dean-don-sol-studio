# Don Sol Guided Bookstore — Story Room V3
Date: 2026-10-11
Status: **LIVE UNLISTED REVIEW / DESKTOP BROWSER QA PASS / ARTISTIC SIGN-OFF PENDING**

## What it is
An interactive staged **animatic**, not a finished full-body cartoon. It uses **existing studio-made assets**, a CSS scene, and a real approved silent Don Sol close-up. The character escorts readers to a book through the already-working V2 guide, appears in a small storytelling set, approaches a drawn chair, and then cuts to the approved facial-animation close-up. The copy shifts to four detailed, spoiler-free story beats.

Studio preview: https://theidealabstudio.com/guided-tour-preview-v3/

## User creative direction
- Don Sol is the lead bookstore host, warm, wise, humorous, and reflective.
- He should travel alongside readers, accompany them to a chosen book, sit down, and explain what makes the book compelling without revealing its surprises.
- Other guides (Curley, Percy, Luke, Tooth) will eventually serve specific audiences and properties. Keep their established identities; do not substitute a generic sun or worm.
- Google is the established animation pipeline; **do not spend Runway credits or use Runway**.
- Approved scenes/images should be reused before generating new material.

## V3 accomplishments
- Staged entry / arrival via canonical full-body *composite reference crop*, not a clean alpha-rig.
- Chair, lighting, books and set scenery authored with scoped CSS, not new generative art.
- Camera cut to the existing 10-second approved G1 Don Sol performance, silent, 640×360 web derivative.
- 4-beat story pitch for each of eight adult/general titles; unique hooks, deeper themes, target reader appeal, and reading invitations without revealing plot resolutions.
- Beat-by-beat Next / Previous, timed text progression, Replay entrance, and Skip to story. Reduced-motion visitors skip the entry effect and automatic progression.
- Existing sample/details/game/film links still available.
- Children's title is handled by Curley and does **not** show Don Sol's adult chair sequence.
- Existing V2 preview at /guided-tour-preview/ and public homepage remain unchanged.

## Source and reference provenance
- `experiments/guided-tour-v3/index.html`, `guide.js`, `guide.css`, `scene.js`, `scene.css`: complete V3 source snapshot.
- `experiments/guided-tour-v3/assets/don-sol-fullbody-composite-REFERENCE.png`: the unchanged full-body crop (283×464) from the user's studio material; **provisional composite with traces of other characters**, not a final isolated master. SHA256: `32aab26dd3a40cb151252bc3146a0af28eacb7335c8a4d8400b31ccfe778e007`.
- The same preview asset is served under `guided-tour-preview-v3/assets/`.
- G1 approved animation source: `Animated_mentor_smiling_and_nodding_20261010161133.mp4` in Google Drive `Better_Questions_Cartoon/Development_Cuts/`, original SHA256 `1a93dc792588098b2adb934dc05d58977b15ab2c6631fa6f9d415b5bb39f38ee`; unchanged, private.
- Self-hosted silent G1 web derivative: `/assets/video/don-sol-approved-closeup-web-v1.mp4`, 132,892 bytes, SHA256 `445e0a1b3b51d42e2e88424d77fc25e143ed4977494ea59e256d7f65eb0aaf0a`; previously developed and hosted for V2.
- Source fullbody crop is also duplicated, unchanged, into Studio Drive `06_STUDIO_WEBSITE_AND_BRAND/` for continuity. No source artwork overwritten.

## QA
- GitHub Pages deployment: https://github.com/kevin121569/dean-don-sol-studio/actions/runs/38148381922 — **success**.
- Live hosted browser QA: https://agent.tinyfish.ai/runs/c03b394d-6757-49a7-a6a5-f196757d61ad — **PASS** for V3 preview load, V2 guide and chooser, Harness stage entrance and chair-reference elements, real G1 video source, four-part prose controls Next/Previous/Replay, Distance Between Thoughts unique copy, Curley-only children's route, nine catalog cards and filters, sample/game/film links, and images.
- No console errors reported in QA.
- **LIMIT:** Hosted browser could verify the DOM class transition, sources and player indicator; it did not certify video currentTime/frame progression on a physical device or supply a complete visual artistic approval.
- **UNTESTED:** actual phone/mobile viewport, full keyboard and screen-reader audit, data/performance costs, actual lip sync, reliable voiced character narration, and true full-body animated walking/sitting.
- Existing optional browser speech synthesis may fail depending on device. Do not promise that a voice performance already exists.

## Next production gates (NOT COMPLETED)
1. Art approval for V3 room staging and rough 'enter, sit, camera cut' motion.
2. Google-based production of a clean isolated standing rig and one matching seated/walk-in performance with the true established character anatomy. Keep composite as temp reference only.
3. Voice identity approval: measured, wise older storyteller, naturally warm, humorous; record or generate via Google workflow only after budget check and approval.
4. Sync audio and subtitles to animation. Never infer lip-sync from silent G1 closeup.
5. Mobile, keyboard/screen-reader, reduced-motion, bandwidth and conversion QA.
6. Only after all agreed gates: decide whether to merge/update the main homepage. Preserve original and all historical previews.

## Release boundary
This branch is a draft preview. No official homepage replacement, no game APK release, no change to Curley's approved wormhole, no character redesign, no Runway usage.
