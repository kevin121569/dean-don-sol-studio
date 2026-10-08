# Johnny Viseme Rig Proof V1

Status: PASS — reusable mouth-animation direction validated.

## Goal

Replace crude amplitude-driven open/close mouth motion with discrete speech shapes that correspond to different classes of sounds.

## Proof line

> There’s a hidden room behind that wall.

## Mouth set used

- REST — neutral closed/resting mouth
- MBP — closed-lip consonants
- E — wide vowel
- AI — wider/open vowel
- O — rounded vowel
- UW — small rounded/puckered mouth
- TH — tongue/teeth articulation
- L — tongue articulation
- N — narrower open consonant/vowel transition

## Acting layered with the mouth rig

- two natural blink beats
- subtle camera push / head-performance feel
- return to resting mouth after dialogue
- no whole-face distortion

## Production rule

Dialogue animation should use **discrete reusable viseme shapes selected from speech timing**, not a single mouth merely scaled by audio volume.

The mouth system is a performance layer. It should be combined with eyes, head motion, hands, body poses, and pauses rather than expected to carry the entire acting beat by itself.

## Current limitations

- placeholder synthetic voice only
- timing is hand-authored for this proof line, not yet automated from phoneme timestamps
- mouth artwork is production-prototype quality; final character-specific mouth sets should be redrawn to match each locked face perfectly

## Next production step

Build reusable character-specific viseme packs and propagate them into Episode 1 dialogue shots, beginning with Johnny and Don Sol, then Tooth’s screen-mouth equivalent and Luke’s simpler canine mouth set.
