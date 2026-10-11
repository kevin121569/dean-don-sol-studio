# Curley Studio Entrance — V2 checkpoint
**Date:** 2026-10-11. **Status:** UNLISTED, REVIEW / NO RELEASE APPROVAL.

- Version 1 remains available: https://theidealabstudio.com/worlds-preview/
- Version 2 live preview: https://theidealabstudio.com/worlds-preview-v2/
- Google Pages deployment succeeded for commit `132fc58dead0e826717da80e60444323f67c7810`.
- Source on isolated draft branch: `worlds-v2/index.html`, `worlds-v2/guide.js`, `worlds-v2/guide.css`. Actual preview copies live under `worlds-preview-v2/` on main, noindex.
- Full existing studio homepage has not changed; Kate's Harness browser game/official APK remain untouched.

## Improvement
One actual SVG stroke (shared `data-morph-main` plus shadow/highlight) interpolates from a straight pen to Curley's bent snake body in 2400 ms. The nib/eraser disappear as the head, facial features and tongue emerge at that *same endpoint*. Four depth rings animate in the background. One-shot, only after gesture. Skip, Watch again, destination options, direct no-motion links and CSS reduced-motion handling retained.

## Verification
- **PASS:** GitHub branch JS syntax and static HTML presence.
- **PASS:** Hosted `/worlds-preview-v2/` available, page title and V2 text confirmed.
- **PASS:** Independent headless logical DOM-mock test: path initial `M30 156...` → midpoint curved at 50% → final `M38 196 C12 126...`; `data-progress=100`, theater `data-state=complete`, Explore Books links to `#books`, and selected explanatory dialogue matches.
- **PASS with limitations:** Remote live browser could click Read, Play, Skip and Watch again, and validate destination anchors. It couldn't capture or inspect in-flight SVG frames (reported no SVG attributes, despite them being present in verified source), and did not actually resize to a mobile viewport. Treat it as an interaction smoke test, NOT independent visual/animation certification.
- **NOT YET:** True phone-width browser screenshots, Android device QA, screen-reader and keyboard navigation, frame pacing measurement, final graphics/polish, actual sales conversions.

## Creative objectives still open
Bring premium character illustration assets into the hero, add cohesive storefront/product pages and real buy/Play links when releases exist, improve the guided tour's humor while keeping CTA clarity.

**No broad rule prohibits future website improvement.** Maintain versioned rollout and rollback so experiments never erase what works.