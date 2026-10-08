# Don Mentor Entrance Module V1.1 Bugfix Log

Status: FIXED / PASS

The user reported a visible bug in `Book_of_Better_Questions_Don_Mentor_Entrance_Module_V1`.

## Root causes found

1. **Duplicate Don in entrance wide**
   - The Idea Lab background already contained Don in the right foreground.
   - A second full-body Don was composited over the same shot.

2. **Stray oversized Don hand in Fact Wall wide**
   - The close-up Don hand layer survived into the wide Fact Wall section.
   - This created an impossible giant-hand composite over the group shot.

3. **Subtitle overlap / inherited production overlays**
   - Embedded captions from source frames were combined with newly-added caption layers.
   - This created stacked / garbled dialogue text and leftover production labels.

## V1.1 corrective action

The module visuals were rebuilt as three clean shots while preserving the existing audio/timing:

1. **Single Don entrance** — background cropped to remove the pre-existing Don before compositing the approved full-body Don.
2. **Clean question close-up** — embedded subtitle area removed; one clean caption layer added.
3. **Clean Fact Wall wide** — no close-up hand overlay; one clean caption layer only.

## Pipeline rule added

Before compositing a reusable character module into a production shot:

- verify the background does not already contain that character;
- reset all foreground overlays at every shot boundary;
- strip inherited subtitles / timecodes / production labels from source stills before adding current captions;
- contact-sheet-check each scene transition before marking PASS.

## Verdict

**PASS — V1.1 replaces V1 for future assembly.**
