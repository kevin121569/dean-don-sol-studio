# BQ11 Regression Hold V1

Status: REJECTED / DO NOT BUILD FORWARD FROM BQ11

## User-observed failures

- No clear visual improvement over BQ10.
- Visible character integrity regression, including clipping / incomplete-head appearance.
- Audio sounded broken / degraded.

## Independent review

BQ11 is not accepted as a forward production step.

The whole-actor micro-transform approach introduced enough compositing risk that its small intended gains do not justify the regressions.

The audio was also re-encoded during the BQ11 export path, so it should not have been described as functionally unchanged for review purposes.

## Baseline rollback

**BQ10 remains the current accepted full-episode review baseline.**

BQ11 must not be used as a source for subsequent episode assemblies.

## Revised production rule

Do not full-episode integrate speculative rig changes.

For Johnny / Don / Luke improvements:

1. Build one short isolated benchmark shot.
2. Compare directly against the accepted prior version.
3. Reject immediately if anatomy, silhouette, face integrity, continuity, or audio regresses.
4. Integrate into the episode only after the isolated shot is visibly better.
5. Preserve audio bit-for-bit during visual-only review whenever possible.

## Review expectations

Allowed in an animation-development proof:
- limited motion
- placeholder voices
- rough lip sync
- stiff timing
- incomplete polish

Not allowed even in a proof:
- missing / clipped body or head parts
- broken compositing
- degraded or interrupted audio
- contradictory captions
- changes that are not visibly better than the accepted baseline

## Next target

Create a short Johnny/Don benchmark scene that demonstrates the intended finished-animation direction with clean anatomy, stable silhouettes, coordinated acting, and clean audio before replacing any more full-episode footage.
