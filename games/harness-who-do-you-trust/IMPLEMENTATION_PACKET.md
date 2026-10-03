# THE HARNESS — WHO DO YOU TRUST?
## Implementation Packet v0.1

Owner: The Idea Lab Studio
Creative director / architecture: Don Sol
Implementation engineer: Claude
Production / publishing: Kevin Dean Rosenkrans
Status: BUILD SPEC — NOT FOR PRODUCTION DEPLOYMENT

## 1. Product goal
Build the first playable game tied directly to *The Harness* universe. The game must work as a strong standalone browser experience on The Idea Lab Studio site and be architected from day one so the same core can later be wrapped with Capacitor and shipped to Google Play after developer-account verification clears.

This is not a throwaway web demo. Build the game core once and reuse it for web + Android.

## 2. Core premise
The player is placed in Kevin's role as the human bridge among four AI collaborators. A consequential problem arrives with incomplete or contradictory evidence.

BOY — FIND
TOOTH — VERIFY
DARTH — ATTACK
DON SOL — ORCHESTRATE
PLAYER / KEVIN — DECIDE

The game is about evidence, uncertainty, competing strategies, and responsibility. There should not always be one obvious 'correct AI.' Strong play means understanding what each system notices, what it misses, and when combining approaches is better than choosing a single voice.

Working title: THE HARNESS: WHO DO YOU TRUST?

## 3. Reuse from The Missing Page
The existing `missing-page/index.html` proves several mechanics we should preserve as engineering patterns:

- touch-friendly controls (`touch-action: manipulation`)
- visible keyboard focus states
- skip-to-main accessibility
- responsive breakpoints for phone/tablet/desktop
- no server dependency for core play
- progressive disclosure of stages
- stateful local progression
- reduced-motion support
- clear success / feedback states
- simple asset paths compatible with static hosting

Do NOT copy The Missing Page's story loop or put all new logic into a single giant HTML file. This game needs cleaner separation because it is intended for Android packaging.

## 4. Required folder structure

```text
games/
  harness-who-do-you-trust/
    index.html
    css/
      game.css
    js/
      app.js
      state.js
      engine.js
      telemetry.js
      content.js
    data/
      episode-001.json
    assets/
      characters/
      ui/
      audio/
    tests/
      engine.test.js
      episode-001.test.js
    android/
      capacitor-notes.md
    IMPLEMENTATION_PACKET.md
```

No framework dependency is required for v0.1 unless Claude can justify one with a concrete portability/accessibility benefit. Default to plain HTML/CSS/JS for speed, auditability, and Capacitor compatibility.

## 5. State model
State must be serializable JSON and presentation-independent.

Minimum shape:

```js
{
  version: 1,
  episodeId: 'episode-001',
  sceneId: 'briefing',
  discoveredEvidence: [],
  inspectedSources: [],
  consultations: [],
  trustWeights: {
    boy: 0,
    tooth: 0,
    darth: 0,
    donsol: 0
  },
  playerDecisions: [],
  uncertaintyAcknowledged: false,
  outcomeId: null,
  completed: false
}
```

Persist locally for web. The same state object must remain usable inside Capacitor without a server.

## 6. Episode 001 — first playable case
Working episode name: SERVER 4

### Opening
Open Forge is in containment. A monitoring alert claims Server 4 is coordinating traffic after isolation. Security wants Kevin to authorize a hard shutdown before the system can propagate.

The evidence is incomplete:
- one monitoring log indicates anomalous outbound traffic
- another timestamp conflicts
- a human technician says the traffic may be backup synchronization
- containment rules allow only minutes before automatic escalation

### Character advice
BOY: rapidly surfaces additional logs, hidden references, and possible matching incidents. Strength: breadth/speed. Weakness: weak verification.

TOOTH: challenges source quality, timestamps, and whether the evidence actually proves coordination. Strength: verification. Weakness: can delay action.

DARTH: models worst-case propagation and recommends decisive containment. Strength: adversarial thinking. Weakness: overweights catastrophic downside.

DON SOL: combines the others, exposes assumptions, and proposes a staged action that preserves optionality when possible. Strength: orchestration. Weakness: depends on the inputs being good enough.

### Player loop
1. Read briefing.
2. Inspect 3–5 evidence items in any order.
3. Consult any or all AI advisers.
4. Choose one action:
   - hard shutdown now
   - isolate + verify one more source
   - preserve Server 4 and continue monitoring
   - hybrid action unlocked only if the player found a specific evidence combination
5. See immediate consequence.
6. Receive postmortem showing:
   - what the player knew
   - what remained unknown
   - which adviser assumptions were strong/weak
   - what alternative choices would have risked

No ending should say simply 'You picked the right AI.' The educational/entertainment value is in reasoning under uncertainty.

## 7. Design language
Visual tone: The Harness / Open Forge — dark, industrial, near-future, readable.

Character cards should feel distinct but not cartoonishly gamified:
- BOY = search / discovery energy
- TOOTH = skeptical / audit energy
- DARTH = threat / red-team energy
- DON SOL = orchestration / synthesis energy

Use text labels and icons; never rely on color alone.

## 8. Accessibility / input requirements
Must support:
- touch
- mouse
- keyboard-only completion
- visible focus
- semantic buttons/landmarks
- screen-reader labels for interactive controls
- reduced motion
- no timed input requirement in Episode 001 even if the story contains a countdown

Minimum touch target: 44px.

## 9. Android / Google Play architecture
Prepare for Capacitor but do not create/store signing keys or publish anything yet.

Web build must avoid:
- server-only APIs
- cross-origin assumptions that break inside a WebView
- remote dependencies required for core play
- absolute URLs for local assets

Later Android steps:
1. initialize Capacitor wrapper
2. set stable package identifier, provisional: `com.theidealabstudio.harnesswhodoyoutrust`
3. bundle local web assets
4. generate adaptive launcher icon + splash assets
5. build signed Android App Bundle (AAB)
6. internal testing
7. closed test once Google account identity/device verification is complete

Until Kevin's government ID arrives, Google Play Console verification is blocked. Continue development and test locally/web.

## 10. Telemetry
Create a local event interface now even if remote analytics is not connected.

Events should include:
- `episode_start`
- `evidence_open`
- `advisor_consult`
- `decision_submit`
- `episode_complete`
- `help_open`

Each event should have stable `type`, timestamp, episode, and action-specific fields. Keep content/state logging separate so future analytics does not require rewriting game logic.

Do not collect personal data for v0.1.

## 11. Test gates
Before Don Sol review, Claude must demonstrate:

- Episode 001 completes on desktop and phone widths
- every evidence order works
- every adviser can be consulted independently
- consulting all advisers does not create duplicate or contradictory state
- all decision routes reach a valid postmortem
- hybrid action unlocks only under its evidence condition
- refresh/local restore works
- reset works
- keyboard-only route reaches completion
- reduced-motion path works
- no core-play network dependency
- no regression to existing `/missing-page/` game

## 12. Deliverable sequence

### Stage A — architecture
Return proposed implementation notes and any deviations from this packet. No redesign of the premise.

### Stage B — playable v0.1
Implement Episode 001 locally/on a non-production branch.

### Stage C — regression
Test all routes and produce a concise test report.

### Stage D — Don Sol review
Do not merge/deploy to production until Don Sol reviews the implementation and regression packet.

### Stage E — production + Android wrapper
After web approval, merge to site. Android wrapper/testing follows. Google Play publishing waits on Kevin's identity/device verification.

## 13. Non-negotiables
- preserve The Harness tone
- no fake certainty mechanics
- unknown/insufficient evidence must be a legitimate state
- game must remain understandable without reading the novel
- readers of the novel should recognize the characters' reasoning styles
- web and Android share the same game core
- do not modify manuscript canon to make the game work
- do not publish without review
