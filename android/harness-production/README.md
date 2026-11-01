# HARNESS Android production preparation

This wrapper is the isolated production-preparation path for **HARNESS: Who Do You Trust?**.

## Google Play production identity

- Android application ID: `com.theidealabstudio.harness.whodoyoutrust`
- App name: **HARNESS: Who Do You Trust?**
- Source baseline: H3, PR #84
- H3 independent Claude review: PASS
- H3 browser regression: PASS
- H3 Android emulator Back test: PASS
- H3 physical-phone gate: PASS

The production wrapper is intentionally separate from `android/harness-campaign-qa`.
Protected QA packages and their debug artifacts must remain untouched.

## What this wrapper does

`npm run build:web`:

1. prepares the approved campaign runtime;
2. stages Cases 1–5 without a QA banner or QA package identity;
3. keeps the approved Case 2 monolith local to the package;
4. routes the Capacitor root to the campaign selector with `location.replace`,
   so the selector remains at an `index.html` URL without a stale launcher history entry;
5. validates frozen Case 1/2 hashes, Case 3–5 art hashes, sequential fresh-start state,
   absence of QA markers, and absence of external HTTP/WebSocket destinations.

## Deliberate release gates

This branch is **production preparation, not production authorization**.

Do not create or upload a signed Play bundle until all of these are explicitly cleared:

- [x] Permanent app ID approved: `com.theidealabstudio.harness.whodoyoutrust`
- [x] Backup/data-extraction policy approved and applied to generated Android manifest
- [x] Privacy-policy content/URL approved; in-app link staged; public source published at `https://theidealabstudio.com/harness-privacy/` (live HTTPS reachability confirmed and URL saved in Play Console)
- [x] Final native/SDK/permission/network audit passed on generated release candidate
- [x] Signing strategy approved: Google Play-managed app-signing key + separate developer-held upload key
- [ ] Store assets, price/countries and Play declarations completed
- [ ] Closed-testing gate satisfied
- [ ] Final production release authorization

No signing secrets belong in this repository.


## Automated preflight

The branch workflow `.github/workflows/harness-production-preflight.yml` runs the full H3 campaign regression gate plus the production staging validator. It does not generate signing keys, sign a bundle, or interact with Google Play.


## Signing boundary

The upload keystore and its passwords must never be committed to this repository or stored in GitHub Actions source files. Production AAB generation in CI remains unsigned; upload signing happens outside the repository with the developer-held upload key.
