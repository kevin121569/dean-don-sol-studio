# The Idea Lab — Animated Studio Entrance V1
**Oct 10, 2026 — draft branch; not deployed**

## What actually exists
- Responsive Worlds hub containing Books, Games, Films and Animation, each with grounded content and navigational routes.
- Homepage nav and relevant cards connect books ↔ browser game ↔ film teasers and animation concepts (branch only).
- Character stage: illustrated Don Sol as a sun in sunglasses, friendly Curley snake, and Percy the paired-parentheses character (Parenthesis Princess).
- Optional "Get Your Mind Bent" sequence: choose Books / Games / Films / Animation; a straight illustrated pen visually transitions into Curley; context-specific guide copy and a real destination link appear.
- Controls: Skip effects, Replay, and direct anchors. Motion only after click; no sound or telemetry.
- Existing novel samples and approved book artwork reused; no fictional public purchase or Play Store links.

## Source
- worlds/index.html
- worlds/guide.css
- worlds/guide.js
- index.html (homepage CTA/nav and factual cross-links only)
- the-harness/index.html (links to browser game and Worlds hub)

## Current QA evidence
- PASS: GitHub readback of committed sources on feature/studio-worlds-hub-2026-10-10
- PASS: JavaScript syntax compilation check
- PASS: 4 destination choices, functional DOM selectors and anchors present
- PASS: all 23 local site links/assets in the Worlds page resolve to existing repository files/directories
- PASS: reduced-motion CSS override and non-animated direct navigation present
- PASS: live main-branch homepage has not been replaced
- PASS: The Harness V2 game files untouched
- NOT TESTED: real interactive browser QA of this new branch, actual small-phone layout, assistive technologies, iOS Safari, production performance and visual creative sign-off
- No audio autoplay (there is no audio element)

## Design/canon
- Percy remains a single *pair of parentheses*, matching locked character-pack semantics; the new scene uses an illustration and does not overwrite canonical SVGs.
- Curley is a friendly snake; the pen-to-snake guided entrance is a separate creative experience and does not replace the earlier protected optical-refraction catalog proof.
- Character illustrations here are vector-first placeholders for the full art pass; original approved graphics should be brought in after art alignment.

## Next release gates
- Compare the 390px, 768px and desktop viewport layouts; fix overflow or tap target issues.
- Test keyboard navigation and screen reader labels.
- Check click-to-portal flow, Skip, Replay, direct routes and prefers-reduced-motion in actual browsers.
- Verify final copy and featured art status, preserve rollback commits.
- Remove noindex,nofollow from Worlds page only when intentionally publishing it.
- Make homepage/Worlds coherent under the public custom domain after QA.
- Do NOT disrupt the frozen Kate Monday Motorola test build or original official APK.

## Future product presentation
1. Replace draft actor illustrations with finished assets and subtle original animation when approved.
2. Add store buttons only on verified public retailer listings; until then prefer excerpts, demos and release-updates paths.
3. Extend the same cross-links to every title with a real verified adaptation.
4. Iterate to improve appeal and sales; this is **not** a permanent website freeze.
