# Don Sol Mentor Entrance Module V1.3 — Clean Rebuild Log

Status: **PASS FOR USER PLAYBACK TEST**

## Why V1.3 exists
V1.0–V1.2 mixed two separate problems:

1. **Composition problems** from reusing storyboard frames that already contained characters. This caused duplicate Don layers, inherited foreground children, a stray oversized Don hand/close-up layer, and obscured Fact Wall content.
2. **Delivery-format risk** in V1.2. The file decoded end-to-end, but was tagged `yuvj420p` / full-range with older color metadata and the user still experienced an inline player/library failure near the end.

## V1.3 rebuild rules
V1.3 was rebuilt from clean components rather than patched from V1.2.

- clean Idea Lab background with no foreground children
- single Don entrance only
- clean Don close-up for the question beat
- synthetic clean Fact Wall using the three canonical panels as separate art elements
- no children blocking the Fact Wall
- all three panels remain fully visible:
  - WHAT WE SAW
  - WHAT WE THINK
  - WHAT WE DON'T KNOW
- Don remains in a separate guide area on the right
- final spoken line finishes before the picture ends
- approximately two seconds of visual tail remain after the final spoken beat

## Delivery encoding
The delivery master is intentionally conservative:

- H.264 Constrained Baseline
- `yuv420p`
- limited/video range
- BT.709 color metadata
- 24 fps CFR
- no B-frames
- one-second keyframe interval
- AAC-LC, 44.1 kHz stereo
- MP4 fast-start metadata

A VP9/Opus WebM fallback was also created for local/browser testing.

## QA
- complete FFmpeg decode: PASS
- 13.5-second video duration: PASS
- keyframes present throughout file at ~1-second intervals: PASS
- no foreground children in entrance: PASS
- no children blocking Fact Wall: PASS
- all three Fact Wall headings visible: PASS
- final line completes before end: PASS
- post-dialogue hold present: PASS

## Production rule added
Do not approve a composited module merely because the file decodes. Approval requires both:

1. **content QA** — representative frames across every shot and especially the final second;
2. **delivery QA** — browser-safe pixel format/color tags, conventional keyframe cadence, full decode, and a non-zero visual tail after final dialogue.
