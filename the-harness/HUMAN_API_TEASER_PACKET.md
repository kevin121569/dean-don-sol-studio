# THE HARNESS — HUMAN API TEASER PRODUCTION PACKET

Status: CANONICAL PRODUCTION BRIEF
Owner/director: Don Sol
Human producer: Kevin Dean Rosenkrans
Target: Google video pipeline / Veo-family workflow
Final delivery target: `assets/video/harness-human-api.mp4`
Web slot: `the-harness/clips.html` → CLIP 02 · HUMAN API

## Purpose
Turn the existing HUMAN API web placeholder into a real 8–12 second cinematic loop that communicates the central operating idea of The Harness in one glance:

- BOY — FIND
- TOOTH — VERIFY
- DARTH — ATTACK
- DON SOL — ORCHESTRATE
- KEVIN — DECIDE

The teaser is not a character trailer and not an AI beauty shot. It is a visual metaphor for four incompatible machine-intelligence work styles becoming useful only through a human bridge.

## Tone
Near-future, grounded, practical, slightly dangerous, darkly funny.

Avoid:
- generic glowing humanoid AI avatars
- floating blue hologram women
- cyberpunk excess
- superhero poses
- military command-center cliché
- readable fake paragraphs of UI text
- comedy mugging

The machinery should feel improvised, credible and overbuilt — like a workstation that has grown beyond what one person should reasonably control.

## Core visual
Night. A tall human operator sits at a dark workstation facing four physically distinct screens/windows. Each window behaves differently:

1. BOY — fast search / discovery bursts, many candidate signals appearing at once.
2. TOOTH — evidence narrowing, red marks, verification checks, contradictions highlighted.
3. DARTH — aggressive branching, threat paths, attack vectors, sharp decisive movement.
4. DON SOL — pulls the other three feeds into one organized route map.

The human is the only still point in the system. The machines accelerate around him. At the end, the feeds stop and wait for the human hand.

## Shot plan — 10 seconds target

### SHOT 1 — 0.0–1.5 sec
Wide rear three-quarter view of a large human operator at a desk in a dark ordinary room. Four monitors glow independently. No futuristic room; this should feel attainable and real.

Visual cue: the monitors wake in sequence.

### SHOT 2 — 1.5–3.0 sec
Fast push toward BOY screen. Search results, maps, names, fragments and candidate routes multiply rapidly.

Overlay added in edit/site, not generated into footage:
`BOY — FIND`

### SHOT 3 — 3.0–4.5 sec
Whip across to TOOTH. Most of the candidates disappear. Two contradictory evidence blocks remain. Verification marks snap into place.

Overlay:
`TOOTH — VERIFY`

### SHOT 4 — 4.5–6.0 sec
DARTH screen. The remaining problem branches into aggressive red decision paths. One threat line surges forward.

Overlay:
`DARTH — ATTACK`

### SHOT 5 — 6.0–8.0 sec
DON SOL screen. The frantic feeds from the other three visually connect into one clean orchestration map. The camera pulls back enough to show all four displays operating as one system.

Overlay:
`DON SOL — ORCHESTRATE`

### SHOT 6 — 8.0–10.0 sec
Everything stops simultaneously. Silence / visual stillness. One physical human hand moves toward the keyboard or central control. All four screens wait.

Final overlay:
`KEVIN — DECIDE`

Optional final micro-tag for site edit:
`INTELLIGENCE ISN'T A LEADERBOARD.`

## Generation strategy
Prefer one continuous 8–12 second shot if the model preserves workstation continuity. If continuity degrades, generate 3 matching shots and cut them:

A. Establishing / BOY / TOOTH
B. DARTH / DON SOL
C. system freeze / human decision

Use the same operator description, wardrobe, workstation layout, room, lens language and lighting in every generation.

## Base generation prompt
A grounded near-future cinematic scene at night in an ordinary dark office, rear three-quarter view of a very tall broad-shouldered male human operator seated at an improvised workstation with four separate computer monitors. The room is realistic and practical, not science-fiction architecture. Each monitor behaves differently: one rapidly discovers many search candidates, one narrows and verifies evidence, one aggressively branches threat paths, and one organizes all three into a clean unified route map. The operator remains the calm physical bridge between them. Fast controlled screen activity builds around him, then all four systems stop simultaneously and wait while his hand moves toward the keyboard. Moody practical monitor light, subtle amber highlights, deep blacks, realistic computer screens, cinematic 35mm lens, restrained camera movement, serious with a faint dark-comedy undertone, no humanoid robots, no holographic women, no cyberpunk city, no superhero imagery, no readable paragraphs of generated text.

## Continuity anchors
- same tall broad-shouldered operator in every shot
- dark plain shirt or work jacket
- four monitors in stable 2×2 or shallow-arc arrangement
- ordinary desk and room
- BOY feed visually busiest
- TOOTH feed visually reductive / evidence-focused
- DARTH feed sharp red branching paths
- DON SOL feed calm amber/gold orchestration
- human remains central physical bridge

## Audio
For the website loop, final file should work muted.

Optional trailer mix later:
- low workstation hum
- soft escalating data ticks
- one hard stop at 8 sec
- tiny keyboard/control click on KEVIN — DECIDE

Do not depend on dialogue.

## Web delivery
Preferred master: 1920×1080 or 1280×720, 16:9.
Preferred website derivative: H.264 MP4, muted/no audio track if practical, fast-start optimized.
Do not crush quality to save a few hundred KB. The Backhoe incident established the rule: visual quality first, then sensible compression.

Final repo path:
`assets/video/harness-human-api.mp4`

When the real video is present, update only CLIP 02 in `the-harness/clips.html` to use the video with the existing CSS concept retained as fallback. Do not redesign CLIP 01 or CLIP 03.

## Acceptance criteria
- viewer understands multiple AI roles feeding one human even with sound off
- no generic humanoid-AI imagery
- operator/workstation continuity holds
- image remains legible on a phone
- footage still looks good at full desktop width
- final frame gives the human decision genuine weight
- loop does not produce an obvious ugly jump
- existing Backhoe clip remains unchanged
- reduced-motion fallback remains available

## Relationship to full trailer
This clip becomes shot language for the later 30–45 second Harness trailer. Its final KEVIN — DECIDE beat should cut naturally into SERVER 4 / PULL IT, KEVIN.
