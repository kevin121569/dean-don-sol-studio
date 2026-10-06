# WEB PLAYBACK COMPATIBILITY ERRATUM V1

## Trigger
The Don Sol Mentor Entrance Module played correctly at first, then appeared to freeze near the 5-second mark in the inline/browser library with a “could not load library” error.

## Exact-file diagnosis
The user-supplied MP4 itself was not truncated or corrupt:
- duration: 10.433333 s
- video: H.264, 1280x720, 30 fps
- audio: AAC
- full decode completed without FFmpeg errors

However, the original delivery encode had an extremely long GOP / sparse-keyframe layout:
- keyframe 1: 0.000 s
- keyframe 2: 8.333 s

That layout is poor for progressive web playback, seeking, partial loading, and browser/library recovery.

## Corrective delivery encode
For browser-facing preview files, use:
- H.264 Constrained Baseline
- yuv420p-compatible delivery
- no B-frames
- keyframe interval: 1 second at 30 fps (`-g 30 -keyint_min 30 -sc_threshold 0`)
- AAC-LC, 48 kHz stereo
- `-movflags +faststart`

The repaired delivery file was verified to contain keyframes at every integer second from 0 through 10 seconds and to decode cleanly end-to-end.

## Production rule
Do not treat successful local decode as sufficient proof of web playback compatibility.

Every browser-facing animation preview must pass BOTH:
1. full-file decode check; and
2. delivery-layout check for faststart + frequent keyframes suitable for progressive playback.

This rule is additive to the existing visual compositing QA checks.
