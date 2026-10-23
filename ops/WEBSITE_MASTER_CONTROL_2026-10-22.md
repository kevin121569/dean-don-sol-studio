# WEBSITE MASTER CONTROL — 2026-10-22

Owner: Don Sol / Master Control
Authority: Kevin Dean Rosenkrans has authorized full website changes.
Goal: finish The Idea Lab Studio as a public 10-book studio without duplicate work or silent rebuilds.

## Current public architecture
- /library/ — adult Library / Librarian
- /kids/ — Kids' World
- /games/ — playable experiences
- /film/ — The Harness film showcase
- /animation/ — cartoon / animation development
- /#books — 10-book catalog
- /#reader-list — reader funnel
- Ask Don Sol — local scripted concierge

Publishing truth to preserve:
- LIVE: Fight Your Way Through, Stardust
- SUBMITTED / PROCESSING: The Distance Between Thoughts, The Harness, The Last Memory, The Book of Better Questions, Forty Bales, When Fighting Stops Working, What God Could Not Know, The Ones We Kept
Do not label a submitted title live until its public retailer page is verified.

## Assignment lanes

### DOT — Integration QA / dispatch
Objective: verify the public architecture works as one site.
Check:
1. Home navigation → Library, Kids, Games, Film, Animation, Books, Reader List.
2. Back-navigation from each hub.
3. 10-book counts/statuses remain consistent.
4. Librarian/Two Worlds routes open from the public hubs.
5. Report broken routes, contradictory states, or regressions.
Deliverable: concise PASS/HOLD matrix + exact paths needing repair.
Do not redesign pages. Do not duplicate another lane.

### TOOTH — UX / copy red-team
Objective: attack the site as a skeptical first-time visitor.
Check:
1. Can a stranger understand the studio in 10 seconds?
2. Is it obvious what is live, free, submitted, or in development?
3. Are CTAs clear: Read / Play / Watch / Buy / Join?
4. Find stale, repetitive, misleading, or self-indulgent copy.
5. Flag anything that promises a movie/cartoon/game that is not actually released.
Deliverable: ranked defect list with surgical replacement copy.
No code changes. No visual redesign.

### BOY — Link / content inventory
Objective: prove every public promise points somewhere real.
Check:
1. Every book detail page.
2. Every sample/PDF.
3. Games routes.
4. Film clips/media kit.
5. Kids/animation routes.
6. Google Play links for currently live books; capture exact product URLs if discoverable.
7. Missing cover/media assets, especially The Ones We Kept.
Deliverable: inventory table: source page → link/asset → status → exact fix.
No page rewriting.

### ASTRA — Visual / brand pass
Objective: make the adult and kids worlds feel intentionally related but distinct.
Check:
1. Library/Librarian visual continuity.
2. Kids' World visual identity.
3. Don Sol/Curley/Tooth character consistency.
4. Cover presentation and aspect ratios.
5. Mobile visual hierarchy.
6. The Ones We Kept approved-cover integration requirement.
Deliverable: prioritized visual corrections with exact files/selectors/assets affected.
Do not change publishing facts or manuscript/book copy.

### 006 — Technical regression / security
Objective: prove the public site is safe and stable.
Check:
1. JS console/runtime errors.
2. Mobile menu + keyboard navigation.
3. No exposed API keys/secrets/browser model credentials.
4. noindex/nofollow only where intentionally retained.
5. broken relative URLs / 404s.
6. iframe/sandbox behavior in Librarian Reading Desk.
7. basic accessibility regressions and obvious performance blockers.
Deliverable: PASS/HOLD technical report with reproducible steps.
No copy/art changes.

## Master Control merge rules
- Don Sol owns integration on main.
- Agents return evidence and exact fixes; no overlapping edits unless Master Control assigns a repair.
- Preserve canonical characters, approved book art, and current publishing facts.
- No new paid services, purchases, model traffic, or production secrets.
- No claim is "live" until publicly verified.
- Stop when lane deliverable is complete; do not wander into another agent's task.

## Current coordination status

| Agent | Lane | Status | Master Control disposition |
|---|---|---|---|
| Dot | Integration QA / dispatch | REPORT RECEIVED | Current-route defects triaged; public architecture and 10-book catalog already supersede stale findings |
| Tooth | UX / copy red-team | REPORT RECEIVED | Public copy cleanup accepted selectively; reader-facing technical/staging language removed |
| Boy | Link / content inventory | REPORT RECEIVED | Fight direct retailer link fixed; Stardust direct-link propagation remains open |
| Astra | Visual / brand pass | PARTIAL | Cover issue fixed; visible mobile/brand pass still needs an actual rendered-browser review |
| 006 | Technical regression / security | REPORT RECEIVED | No exposed secrets; Don Sol keyboard/focus fix merged; tighter Reading Desk sandbox preserved |
| Don Sol | Master Control / integration | ACTIVE | Integration fixes merged; awaiting visual mobile QA and Stardust direct product URL |

### Master Control decisions after combined audit
- Rewrote stale /downloads/ page from current catalog truth.
- Removed internal QA/staging language from public Library-facing copy.
- Created clean /library/reading-room/ route and canonicalized the old preview to it.
- Kept development-world preview out of search indexing while preserving access from Kids/Animation.
- Removed EPUB packaging/hash jargon from Better Questions reader-facing page.
- Clarified The Harness: novel submitted to Google Play; screenplay complete.
- Added a plain-language homepage description and a catalog status legend.
- Added keyboard focus trapping, Escape-to-close, aria-controls and aria-expanded behavior to Ask Don Sol.
- Preserved the Reading Desk's tighter sandbox; did not add allow-scripts without a demonstrated need.
- Remaining open: rendered mobile/visual QA, exact Stardust public product URL, real automated reader-list provider.
