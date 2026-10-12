# THE LIBRARIAN — THE DISTANCE BETWEEN THOUGHTS
## Voice casting, QA and manual caption desk V1
Date: 2026-10-11
Repository branch: `feature/librarian-distance-voice-rehearsal-v1-2026-10-11`
Draft PR: https://github.com/kevin121569/dean-don-sol-studio/pull/49

### Editorial direction
Preserve the original accepted realistic Librarian (dark-haired, mustached, tweed suit, seated in the library). Use the exact five-sentence `distance.pitch` from `studio-entrance-preview-v4-1/entrance.js` without altering story text. Maintain the silent eight-second arrival footage unaltered. No automatic voice impersonation or simulated lip-sync.

### New development checkpoint
- `librarian-distance-voice-rehearsal-v1/casting-desk.html`: an isolated A/B voice-review and caption-timing interface with the original approved actor image
- `casting-desk.css`: dark, responsive accessible layout
- `casting-desk.js`: load two local WAV/MP3/M4A/OGG takes (75 MB limit), listen separately, compute actual file SHA-256 in browser, mark each of five sentence boundaries by the selected audio's currentTime or direct numeric entry, validate non-overlapping ordered ranges inside audio duration, download structurally valid **DRAFT** WebVTT and downloadable **DRAFT** JSON review manifest
- Take A/B timing, rights checkboxes and reviewer notes remain independent and exist only within that page visit; no storage, API, file upload or tracking
- A checked rights box is a human self-attestation, not an external license verification; the generated report hardcodes `voice_rights_and_synced_captions_verified_by_studio: false`; no automatic release, publishing, approval, charging or master-audio export

### Verified real browser QA — PASS
GitHub Actions: https://github.com/kevin121569/dean-don-sol-studio/actions/runs/38186330817
Feature-branch static files served on localhost in GitHub CI, Chromium tested at 1440×900 and 390×844. Both completed successfully:
- Original actor image loaded
- Exactly five sentence cue paragraphs match `distance.pitch` character-for-character after joining
- Synthetic SILENT six-second WAV tests verify local A playback metadata and SHA-256 identity; synthetic WAV is **NOT** the Librarian's voice
- Invalid overlapping captions blocked; five valid ranges produced real downloadable WebVTT; downloaded bytes read back
- Switching to B has blank cue marks and independent checkbox state; returning to A preserves timings and notes
- JSON report downloaded and read back: 64-hex SHA256, explicit DRAFT status, nonrelease flag, incomplete human review
- No external HTTP(S) calls, JS exceptions or horizontal overflow
- Screenshots archived to GitHub Actions artifact `librarian-casting-desk-branch-screenshots`

### Release / production HOLD
1. No verified usable final original mature British narrator WAV/MP3 was located in the checked studio voice archives. Search does not guarantee none exists elsewhere.
2. Obtain licensed audio using **confirmed no-cost capacity** or explicit billing approval. Never charge or invoke Google/Runway paid generation by implication.
3. Human vocal-quality audition and documentation of performer or model license/commercial-use rights.
4. Reviewer must time and aurally certify all five WebVTT sentences to selected final file (not merely pass structural timing checks); checksum must match accepted master.
5. Physical iPhone/Android, accessibility and real sound tests; verify no dropped words and no unauthorized autoplay.
6. Owner's creative signoff, then separate authorization to stage/deploy. Branch and draft PR stay unmerged, public homepage and earlier previews intact.
7. Preserve Curley V2, children's world, all novel sample sources, Harness game source and Android builds.

**Verdict:** PASS for the feature-branch voice-production tool and browser testing; HOLD for actual recorded/approved narration, captions certification, live stage deployment and production release.
