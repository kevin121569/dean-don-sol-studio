# Episode 01 — Benchmark Quality Proof BENCH3 V1

Status: PASS — two-character interaction benchmark

## Purpose

BENCH3 tests Johnny and Don Sol in the **same shot** so the animation cannot rely on cuts to hide timing problems.

Canonical dialogue:

- Johnny: “There’s a room back there.”
- Don Sol: “What do we actually know?”

## Quality target

- both characters remain visible
- approved faces/anatomy remain intact
- Johnny speaks while Don listens
- Johnny settles before Don takes the thought
- Don answers with restrained physical emphasis
- clean dry dialogue
- no inherited episode audio or visual layers

## Rejected intermediate

The first BENCH3 render used replacement mouth overlays.

It was rejected before user delivery because the mouth treatment looked pasted onto the approved faces and visibly degraded character integrity.

That method is prohibited for this shared-shot benchmark.

## Accepted method

- approved shared character art remains the visual source
- no replacement facial artwork
- speech uses subtle localized lower-face/jaw deformation
- whole-character micro-motion is coordinated through smooth local warps
- camera emphasis remains restrained and keeps both characters visible
- clean captions and clean dry dialogue are generated fresh

## Technical QA

- duration: ~5.50 seconds
- 1280×720 H.264/AAC
- full decode: PASS / zero errors
- anatomy/clipping check: PASS
- inherited subtitle/audio contamination: none

## Production meaning

BENCH3 establishes a safe shared-scene approach:

**preserve the approved face first; animate around it rather than repainting it.**

Do not integrate into the full episode automatically. User visual review remains the acceptance gate.
