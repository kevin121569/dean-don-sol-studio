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

### Portability completion — OFFLINE CHROMIUM PASS
The same branch now includes `tests/librarian-casting-desk-portable.cjs`, which packages the review desk HTML, CSS, JavaScript and **original approved portrait bytes** into one portable, self-contained `LIBRARIAN_DISTANCE_VOICE_CASTING_DESK_OFFLINE_V1.html` with no external dependencies.

Final verified CI: https://github.com/kevin121569/dean-don-sol-studio/actions/runs/38186546520
Results: A/B source-branch QA PASS at 1440×900 and 390×844; **offline `file://` Chromium PASS** at both resolutions; original embedded actor image loads; five real script cues visible; no external HTTP(S) calls or JS errors. Artifact name `librarian-casting-desk-portable-offline-html` downloadable in GitHub Actions. Source output size **159,141 bytes**; SHA-256 verified after download to model workspace **81dcb6ec836ce3579e15040ad7ec26dc89c942ba0437374d22ba28b4669fce38**.

Use: download HTML, double-click to open locally in a desktop browser, load WAV/MP3/OGG/M4A via Take A/B to audition and manually time captions. No voice file is bundled, generated or sent over the network. A physical phone or owner-performance signoff is not implied by Chromium testing.

The initial offline build failed because its inlined script executed in the `<head>` before the document's controls existed. This packaging issue was fixed by placing it before `</body>`; the final run is green. No deployed files or previous voice scene work changed.

### Studio platform correction — Google Flow only
Owner confirmed **Google Flow, not Runway**, is the approved cinematic production platform for The Librarian and our studio motion work. Do not submit to Runway, use Runway voices/assets, suggest a platform switch, or incur Runway credits. Preserve original approved Librarian actor and official Google Flow master/shot framing. Existing offline voice casting desk is platform-neutral and does not call any inference service or use credits.

Before running any Flow scene or Google-affiliated speech generation, verify the selected workspace's capabilities, sound/voice support, permission and projected credit charge; do not assume Flow can synthesize approved British dialogue or guarantee lip sync. Keep a written exact-script, silent-footage and caption/recording ledger. No charge or generation without explicit cost permission where required. Do not publish or merge until separate editorial and release approval.
