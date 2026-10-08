# Episode 01 — Fact Wall Teaching Logic Fix V1

Status: PASS — corrected V5 assembly candidate

## Problem caught during QA

The first animated Fact Wall pass visually spread the three observation cards across multiple columns. That could incorrectly imply that:

- HALLWAY belonged under WHAT WE SAW,
- BLANK WALL belonged under WHAT WE THINK,
- GEOMETRY FEELS WEIRD belonged under WHAT WE DON'T KNOW.

That was pedagogically wrong.

## Correct rule

At this point in the story, all three are observations the characters actually made:

- HALLWAY
- BLANK WALL
- GEOMETRY FEELS WEIRD

Therefore all three must visibly sort under the blue **WHAT WE SAW** column.

The yellow **WHAT WE THINK** and red **WHAT WE DON'T KNOW** columns remain empty until the story explicitly moves into interpretation and uncertainty.

## Production correction

The corrected Fact Wall animation now:

1. wakes the three category panels,
2. rejects wishful/cool ideas as evidence,
3. physically stacks HALLWAY, BLANK WALL, and GEOMETRY FEELS WEIRD under WHAT WE SAW,
4. then cuts back to the character dialogue.

## QA

- Visual contact-sheet inspection: PASS
- Full MP4 decode: PASS, zero decode errors
- Delivery format: H.264 1280x720 yuv420p + AAC
- Runtime: 76.216 s
- Short review filename: `BQ1_V5C.mp4`

## Doctrine reinforced

Story mechanics must preserve the real learning function. If animation placement can teach the wrong concept, it is a production bug even when the shot looks attractive.

**symbol/concept → character → story → remembered action → real technical meaning**
