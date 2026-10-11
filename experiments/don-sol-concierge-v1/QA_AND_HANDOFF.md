# Animated Don Sol Studio Host — V1 checkpoint
Date: 2026-10-11

## Objective
A delightful animated, accessible sales-oriented concierge for The Idea Lab Studio. Visitors choose Books, Games, Films, or Animation and receive a verified relevant studio destination. This is a separate next creative increment **after** Curley Worlds V2 received creative approval. It does not redesign or modify Curley V2.

## Implementation
- Main source: `experiments/don-sol-concierge-v1/index.html` in branch `feature/don-sol-concierge-v1-2026-10-11`.
- Public-but-unlisted review copy: `/don-sol-preview/index.html` on main, with `noindex,nofollow`.
- Responsive two-column animated sunset-stage with Don Sol's ray halo, sunglasses tilt, mouth expressions, and reactive talk bubble.
- Selection buttons: books / games / films / animation.
- Dynamic accurate feature title, status, copy, cover asset, CTA and related-story link per selection.
- Meet Don Sol (text-only welcome), Surprise Me (deterministic cycling), and direct links that work even without JS.
- No audio autoplay, no external analytics, no large animation framework.
- Reduced-motion media query; keyboard focus rings and live region for dialogue.

## Boundaries
- Approved Curley V2 remains accessible and unmodified at `/worlds-preview-v2/`.
- `/worlds-preview/` V1 remains preserved.
- No changes to the main homepage, official games, APKs, book source files, or other live published pages.
- Google Play release not claimed; development browser game appropriately labeled.
- Future integration into home page is an optional follow-up after creative review and visual/mobile QA. No rule prevents improving site.

## Initial code verification
- JavaScript syntax PASS.
- Four choices all update the targeted card title, CTA destination, recommendation copy and selected pressed state in independent DOM simulation.
- Meet Don Sol greeting and Surprise Me rotating suggestions PASS in simulated events.
- Existing linked repository files/directories checked; no missing real relative destinations.
- Remote browser smoke test, mobile screenshot QA, screen reader/keyboard and color contrast are additional gates.

## Explicit release gates
- [ ] Confirm hosted `/don-sol-preview/` via deployed HTTP and GitHub Pages success.
- [ ] Browser click smoke tests all four choices + Meet + Surprise.
- [ ] Check responsive at 390px/768px/desktop.
- [ ] Screen-reader/keyboard traversal and reduced-motion real-browser pass.
- [ ] Confirm character art aligns with the studio's visual identity.
- [ ] Review copy and CTA conversion hierarchy.
- [ ] Production deployment request / release sign-off.

## Rollback
Delete only the new `don-sol-preview/` directory preview and/or revert associated unlisted-preview commit. Do not revert existing site content.
