# 5 · Regression Test Plan

Two goals: **(A)** adding the game must not change anything that already works on theidealabstudio.com, and **(B)** the game must be proven completable and accessible before anyone plays it.

## A · Studio site + existing games (run on every change to the repo)

### Automated: `node scripts/check-site.mjs` (exists, exit 1 on failure)

| Check | Catches |
|---|---|
| Every local `href`/`src` in every HTML page resolves | broken nav, missing samples/PDFs, moved covers |
| Every book has its page, cover, web sample, sample PDF, and homepage card link | catalog regressions |
| Harness teaser video exists and `clips.html` still references it | the teaser silently disappearing |
| Every page has a responsive viewport meta | mobile layout regressions |
| Launch-control status contract (Harness / Last Memory / Better Questions / Fight / Stardust) on data.js, homepage card, app.js override, book page, media kit | status drift coming back |
| FAIL: any "Published" title without a `retailUrl` | "Published" claims with no live listing |
| **Locked files:** SHA-256 of `missing-page/*` (line endings normalized) vs `scripts/locked-files.json` | any edit, intentional or not, to an existing game |

**Rule:** an existing game's files change only when someone deliberately updates its hash in `locked-files.json`, after the manual pass below. When Episode 001's certified `index.html` is uploaded to `adventures/episode-001/`, add its hash the same day.

### Manual pass (before any merge to `main`)

At 375 px, 768 px, and 1280 px:
- [ ] Homepage: menu open/close, shelf filters (count text updates), Ask Don Sol concierge (open, pick each option, Esc closes, focus returns), Tooth button, Human API windows, idea spinner.
- [ ] Each book page: cover loads, "Read sample" opens, sample PDF downloads.
- [ ] `/the-harness/clips.html`: video autoplays muted and loops inline on iOS Safari and Android Chrome.
- [ ] `/missing-page/`: start a case, make progress, reload (progress persists), all three casebook PDFs open.
- [ ] No console errors on any page.
- [ ] After deploy: hard-refresh the live site and confirm `data.js?v=` / `app.js?v=` serve the new version.

## B · Who Do You Trust?

### Automated

| Suite | File | Proves |
|---|---|---|
| Engine | `tests/engine.test.mjs` ✅ | Reducer transitions, budget enforcement, invalid actions are no-ops, save migration rejects unknowns |
| Content | `tests/engine.test.mjs` ✅ | Every claim id resolves, every claim is revealable within budget, every decision has an ending, every ending is reachable and terminal |
| Golden paths | `tests/engine.test.mjs` ✅ | The intended investigation reaches the best ending; add one golden path per ending as content stabilises |
| Offline | `tests/offline.test.mjs` | Every file in `asset-manifest.json` exists, and every asset the code references is in the manifest |
| E2E smoke | `tests/e2e/` (Playwright, dev-only) | Full playthrough by touch emulation and by keyboard only, at 375/768/1280, with no console errors |

The content suite already paid for itself: on its first run it found that claim `c_safe` (the claim the whole decision turns on) was unreachable.

### Manual

- [ ] **Keyboard-only** full playthrough: visible focus ring at every step, no traps, Esc closes panels.
- [ ] **Screen reader:** NVDA + Firefox, VoiceOver + Safari, TalkBack + Chrome. Agent replies are announced, and claim tags are read as state ("Tagged: think").
- [ ] **Reduced motion:** no typing or slide animations; content appears instantly.
- [ ] **Offline (web):** load once, go offline, hard-reload, play to an ending.
- [ ] **Save/restore:** quit mid-investigation, reopen, same board. On Android, also test kill from recents.
- [ ] **Text scale 200%:** no clipped agent lines or overlapping buttons.
- [ ] **Touch targets** ≥ 44×44 px.

## Release gates

| Gate | Requires |
|---|---|
| Merge game code to `main` | A-automated + B-automated green, game unlinked from site |
| Unlinked public test URL | A-manual + B-manual, Don Sol packet review complete |
| Link from studio site | Explicit sign-off; a site change goes through A again |
| Play internal track | All of the above + Android device matrix ([04](04-android-capacitor-plan.md)) |
| Play production | Closed-test requirement met, store checklist complete |
