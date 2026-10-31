# HARNESS Android production preparation

This wrapper is the isolated production-preparation path for **HARNESS: Who Do You Trust?**.

## Approved permanent identity

- Android application ID: `com.theidealabstudio.harness`
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

- [x] Permanent app ID approved: `com.theidealabstudio.harness`
- [ ] Backup/data-extraction policy approved and applied to generated Android manifest
- [ ] Public HTTPS privacy-policy URL approved and included in app + Play Console
- [ ] Final native/SDK/permission/network audit on generated release candidate
- [ ] Release-signing / Play App Signing procedure approved
- [ ] Store assets, price/countries and Play declarations completed
- [ ] Closed-testing gate satisfied
- [ ] Final production release authorization

No signing secrets belong in this repository.
