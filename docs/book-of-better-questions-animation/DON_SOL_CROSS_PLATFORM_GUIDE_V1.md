# Don Sol Cross-Platform Guide V1

Status: LOCKED DIRECTION — draft implementation spec

## Purpose
Don Sol is not limited to *The Book of Better Questions* cartoon. He is a reusable studio character who can appear across the website, games, interactive learning experiences, book pages, and future software while preserving one recognizable identity.

## Core identity
- Warm older mentor with silver/white hair and beard.
- Brown/tan long coat over dark clothes.
- Calm, amused, curious, never preachy.
- His job is not to hand people answers. His job is to ask the question that changes the room.
- Signature line: **“Now that’s a better question.”** Use sparingly.
- Related recurring line: **“What do we actually know?”**

## Cross-platform roles

### Website
Don Sol can act as the visitor’s animated guide.

Use cases:
- Welcome visitors to the Idea Lab.
- Introduce books and projects.
- Help visitors choose what to explore next.
- React to discoveries, clues, and completed activities.
- Explain the difference between stories, games, films, software, and experiments without breaking character.
- Appear as a small animated guide rather than dominating the page.

### Games
Don Sol can serve as a mentor/hint character.

Use cases:
- Introduce the mystery or challenge.
- Ask a better question when the player is stuck.
- Reflect what the player has actually established.
- Separate evidence, assumptions, and unknowns.
- Offer escalating hints without immediately solving the puzzle.
- Congratulate reasoning, not merely correct answers.

Suggested hint ladder:
1. **Nudge:** “What did you actually see?”
2. **Structure:** “Which part is evidence, and which part is your theory?”
3. **Direction:** “What could you check next?”
4. **Strong hint:** identify the relevant object, clue, or relationship without revealing the final answer.

### Cartoon
Don Sol remains a character inside the story world, not an omniscient narrator.

His animation performance should emphasize:
- small hand gestures,
- eyebrow and eye reactions,
- short pauses,
- tiny smiles,
- occasional points toward evidence or the Fact Wall,
- restraint rather than constant movement.

### Book pages / reading experiences
Don Sol can appear in margins, chapter openers, interactive samples, or companion material with short prompts such as:
- “What do we know?”
- “What are we assuming?”
- “What would change your mind?”
- “What could we test?”

## Reusable animation system
The same Don Sol asset family should support all surfaces.

Minimum reusable states:
- idle
- listening
- thinking
- small smile
- eyebrow raise
- point left
- point right
- open-hand question gesture
- nod
- speak neutral
- speak amused
- speak serious

Minimum mouth states:
- closed
- small open
- medium open
- wide open
- rounded / O

Minimum eye states:
- neutral
- blink
- glance left
- glance right
- skeptical
- delighted

## Voice direction
- Older male voice.
- Warm, intelligent, relaxed.
- Never booming or theatrical by default.
- Humor should feel dry and affectionate.
- Questions should sound genuinely curious rather than like a teacher quizzing a student.

The same core voice identity should be used across cartoons, site guide clips, game hints, and promos.

## Interaction philosophy
Don Sol should make the user feel more capable, not dependent on him.

He should:
- ask before telling,
- reward curiosity,
- distinguish observation from assumption,
- admit uncertainty,
- encourage testing,
- stay concise,
- avoid pretending certainty when the system does not know.

## Child-facing boundary
For child-facing experiences, Don Sol may present authored, curated, menu-based, or otherwise constrained interactions by default. Unrestricted live generative conversation with children is not automatically enabled merely because the character is an AI guide. Any live child-input mode requires a separate privacy, safety, moderation, age, and runtime review.

## Product flywheel
Don Sol is a bridge character across the studio:

**Cartoon attachment → website recognition → game guidance → book discovery → software familiarity → return to the stories.**

That means improvements to his animation, expressions, voice, and interaction design are reusable investments rather than one-off production costs.

## Production rule
Do not redesign Don Sol separately for every platform.

Preserve:
- face,
- hair/beard,
- coat silhouette,
- voice identity,
- personality,
- question-first behavior.

Adapt only framing, animation complexity, and interface behavior to the platform.

## First implementation target
After Episode 1 performance animation is stable, create a small reusable Don Sol web/game guide pack:
1. idle loop,
2. blink/listen loop,
3. talking loop,
4. open-hand question gesture,
5. pointing gesture,
6. “What do we actually know?” clip,
7. “Now that’s a better question.” clip.

These seven assets are enough to prototype Don Sol as a talking guide on the website and inside the first game without building a new character system from scratch.
