# Adult Catalog Wormhole v1 — Production Design Lock

Status: **PRODUCTION DESIGN LOCKED / NOT YET LIVE-INTEGRATED**

Tracked by GitHub Issue #17.

## Locked concept

**Wormhole / Optical Refraction Node**

Primary line: **“Go in straight. Come out bent.”**

The visual metaphor is one continuous thought/object entering straight, crossing a restrained brass refraction seam, and emerging subtly bent. The effect belongs to transitional/background structure only. Book covers, titles, prices, reading controls, and purchase CTAs remain undistorted.

## Canonical files

- `01_Wormhole_Motion_Proof.html`
  - one-shot 3.5s refraction
  - static left/right clips in one 640px coordinate system
  - right-side bend isolated in `.bend-space`
  - seam pivot at `(320px, 120px)`
  - explicit Replay control outside the semantic `role="img"`
  - reduced-motion settled fallback
- `02_Wormhole_Reduced_Motion.html`
  - static straight → seam → bent representation
- `03_Desktop_MindBending_Shelf.html`
  - adult-catalog desktop placement proof
  - Protected Commerce Zone — no optical distortion
- `04_Mobile_MindBending_Shelf.html`
  - official 375×812 mobile placement proof
  - no intended horizontal scroll
  - 48px minimum purchase target

## SHA-256 fingerprints

- `01_Wormhole_Motion_Proof.html`
  - `888072585103a9a0c8ff32f021a8588aaeb628d3c3f00d6063b881efbcc00ddc`
- `02_Wormhole_Reduced_Motion.html`
  - `93d0cb74bfd56db11a5f018e894251d0802207bed86a67ed253591d1bef01219`
- `03_Desktop_MindBending_Shelf.html`
  - `bf6f0931e6783eb8bf6ae0ee7d1d4e1abb6398ce6693cac0d431fd4929221473`
- `04_Mobile_MindBending_Shelf.html`
  - `658fb7ab53649b896154fc1a43413da2cecbf6c2ac6e6add847aac6ec0b39db8`

## Lock rules

Do not redesign v1 during integration.

Keep locked:

- Wormhole / Optical Refraction Node metaphor
- restrained brass seam
- off-white / graphite / indigo treatment
- continuous same-object transformation
- zero intentional seam jump
- one-shot motion; no perpetual live-site loop
- explicit semantic Replay control where replay exists
- reduced-motion static transformation
- no glow, particles, fog, sci-fi portal imagery, or ornamental VFX
- no distortion of book covers, titles, prices, synopsis/reading controls, or commerce CTAs
- commerce/readability outrank the effect

## Evidence policy

The supplied final QA matrix reports 60 FPS, 0 CLS, 0 long tasks, 0px seam displacement, and no 375×812 horizontal overflow for the tested contexts. These values are preserved as the producer-reported QA record. Chromium behavior was independently sanity-checked during design review. Safari/iOS-specific profiler measurements remain producer-reported unless independent Safari evidence is attached later.

## Deployment boundary

This directory is a canonical **design-lock archive**, not a live-site implementation.

Any production integration must use a separate branch/PR and must run fresh page-level regression QA against the actual site before merge.
