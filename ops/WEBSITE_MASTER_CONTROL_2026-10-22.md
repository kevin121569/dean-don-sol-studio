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

| Agent | Lane | Status | Master Control action when report arrives |
|---|---|---|---|
| Dot | Integration QA / dispatch | WAITING ON REPORT | Triage route/status defects; assign only uncovered repairs |
| Tooth | UX / copy red-team | WAITING ON REPORT | Accept/reject copy changes; prevent scope creep |
| Boy | Link / content inventory | WAITING ON REPORT | Repair broken links/assets; capture exact retailer URLs |
| Astra | Visual / brand pass | WAITING ON REPORT | Approve targeted visual fixes; preserve canonical art |
| 006 | Technical regression / security | WAITING ON REPORT | Fix reproducible defects first; security/accessibility outrank polish |
| Don Sol | Master Control / integration | ACTIVE | Merge findings, deconflict lanes, update main, issue next tasks |

**Reporting rule:** Kevin may relay each agent's output directly to Don Sol in chat. Master Control will determine disposition, merge order, and follow-up. Kevin does not need to coordinate agents manually.

## Audit disposition — 2026-10-22 evening

Received combined DOT / TOOTH / BOY / ASTRA / 006 read-only audit.

### Accepted and acted on
- Public Librarian route promoted to `/library/reading-room/`.
- Public Kids World route promoted to `/kids/world/`.
- Library hub no longer exposes internal QA wording.
- Homepage first-visit copy clarified.
- Homepage release-status legend added.
- New public routes added to sitemap.
- Fight Your Way Through uses verified direct Google Play product URL.
- Stardust dead-end search CTA removed while direct store URL propagates.

### Rejected as stale / already fixed before audit
- “9 book projects” / missing The Ones We Kept.
- Missing `/library/`, `/kids/`, `/games/`, `/film/`, `/animation/` routes.
- Fight Your Way Through shown as “Preparing for release”.
- Ask Don Sol missing focus trap / aria-expanded.
- Reading Desk iframe missing sandbox.
- Better Questions public SHA/EPUBCheck technical copy.
- Stale downloads HOLD language.

### Still open
- Replace current 240×360 The Ones We Kept web JPG with higher-resolution approved raster at same path.
- Visible-browser mobile/keyboard visual QA still needed.
- Capture Stardust exact public Google Play product URL once exposed.
- Recompress heavy social `og-image.png` when doing performance polish.

Master Control rule: do not reopen rejected stale findings without fresh reproduction against current live/source state.

## Librarian closeout — PR #59 / #60

Status: **CLOSED / PASS**

Verified merged:
- PR #59 — Finish the public Librarian experience — merged as `539edfc67434f33d3dbda5e31619cb141c9ce672`
- PR #60 — Correct Librarian sample availability copy — merged as `fefd36e7b0d7aa4b72b65cc9b64005cd4ea10646`

Accepted state:
- Public robot/device voice controls removed.
- All nine adult/general titles represented.
- Eight real samples preserved.
- The Ones We Kept does not claim a sample that does not exist.
- Librarian voice performance pack committed for future human recording.
- Library/dialog/sample/homepage/script regression reported PASS.

Next Librarian upgrade is optional production polish: recorded human performance. It is **not** a website launch blocker.
