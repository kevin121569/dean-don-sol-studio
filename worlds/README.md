# Idea Lab Studio — Worlds Hub (development branch)

**Status:** REVIEW ONLY. Not approved for production. No changes to The Harness game, its Episode 1 original, the official Android APK, existing book catalog, film pages, or Google Play listings.

## Intent

Make the current creative ecosystem discoverable through one additional responsive site page, without rebuilding the established homepage. This first pass groups **Games**, **Books**, **Films**, and **Animation** and differentiates playable / completed / preparing / concept work.

### Changed files
- `worlds/index.html`: new standalone linked hub in current site's typographic/color family, using existing approved cover assets and real site destinations.
- `index.html`: desktop and mobile navigation gain a **Games** link to `/worlds/#games`; all other homepage source preserved.

### Verified link targets against main repository tree (Oct 10, 2026)
- `harness-play/dev-ep2-v2/cases.html` (two-level development preview, not Play Store)
- `missing-page/index.html` (existing free reading mystery)
- `the-harness/index.html`, `the-harness/clips.html`, `the-harness/media-kit.html`
- `forty-bales/index.html`, `the-distance-between-thoughts/index.html`, `the-book-of-better-questions/index.html`
- Existing cover images, `base.css`, and `favicon.svg`

## Guardrails
- Main branch stays untouched until explicit approval. Do not publish from this branch automatically.
- `worlds/index.html` has `noindex,nofollow` for review; remove that only as part of approved launch.
- No invented Google Play listing link, installed app claim, animation release claim, or book storefront purchase link.
- Do not merge into main before checking branch preview visual QA, keyboard/mobile navigation, small-screen display, image sizes, and site deployment behavior.
- Do not modify The Harness V2 in response to website work before Kate's Monday Philippines Motorola field test. Record reported issues separately.
- Existing Curley/Mind-Bending brief remains independent; do not overwrite or preempt that production.
- Existing approved graphics and branding are intentionally reused; dedicated game splash and cinematic graphics integration is future art/UX work.

## Required before signoff
- [ ] Browser screenshot inspection at 390px, 768px and 1440px.
- [ ] Keyboard focus and reduced-motion review.
- [ ] Links / media / console errors checked on actual candidate preview deployment.
- [ ] Owner creative review for all project labels and art.
- [ ] Confirm that Games navigation does not overcrowd narrow mobile header.
- [ ] Approve removal of development meta robots tag at live launch, if appropriate.
- [ ] Confirm production rollback (revert homepage nav addition and remove hub route).

## Next increment after Kate's test
Unify approved cinematic game artwork and title treatment across The Harness game intro, world page, and future Play Store listing art; display a Google Play badge only after actual listing approval. Extend films/animation cards when concrete assets and release stages are verified.
