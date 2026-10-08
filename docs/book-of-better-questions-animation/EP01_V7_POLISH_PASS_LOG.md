# Episode 1 V7 Polish Pass Log

Status: REVIEW CUT COMPLETE / USER REVIEW PENDING

## Objective
Address the two mechanical problems identified in BQ6 without changing story, canon, character designs, or educational logic:

1. abrupt pose / viseme jumps
2. rough stacked audio / transition interference

## Changes

- Johnny mouth rig now blends between neighboring viseme drawings during the last portion of each speech shape instead of hard-swapping every mouth pose.
- Don Sol mouth rig uses the same in-between blending treatment with a gentler settle and blink timing.
- Existing Luke + Tooth canonical acting beat retained because Tooth already reads closest to finished limited animation and Luke's body/ear/tail acting is structurally sound.
- Review assembly remains 854x480 for rapid iteration; high-resolution source character assets remain unchanged.
- Full audio pass rebuilt with de-click, high-pass / low-pass filtering, light FFT denoise, compression, and limiter treatment.
- Story/canon unchanged.
- Fact Wall teaching logic unchanged.

## QA

- Final review cut duration: 80.256 s.
- Full video/audio decode: PASS, zero decode errors.
- Audio integrated loudness: approximately -18.0 LUFS.
- True peak: approximately -2.1 dBFS.
- Visual spot-checks performed on Johnny, Tooth, Luke, Don, Fact Wall, payoff, and end section.

## Interpretation

This is not final animation. V7 is a mechanical polish rung demonstrating that smoother viseme transitions, gentler settles, and a cleaner dialogue-first audio pass improve the existing production system without redesigning the cast.

Current quality reference inside the cast remains Tooth, whose rigid-body / screen-face construction naturally fits the limited-animation pipeline.

## Next production rung

- continue replacing hard pose changes with anticipations / settles / short in-betweens
- improve Johnny jaw/cheek coordination around speech
- improve Don beard/jaw/mouth coordination and gesture anticipation
- convert Luke ear/tail motion from repeated wiggle to motivated anticipation-action-settle beats
- rebuild final dialogue stems after timing locks
