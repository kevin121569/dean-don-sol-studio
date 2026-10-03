# 1 · Folder Structure

The game is a self-contained static folder. GitHub Pages serves it as-is (no build step, which matches the rest of the repo), and Capacitor copies the same folder into the Android app. Nothing in it imports from the studio site or from other games.

```
games/who-do-you-trust/
├── index.html                  App shell: one <main>, one live region, <script type="module" src="src/main.js">
├── manifest.webmanifest        Own scope (/games/who-do-you-trust/), own icons — separate from the studio PWA
├── sw.js                       Service worker: precaches everything in asset-manifest.json (web only)
├── asset-manifest.json         Versioned list of every file needed offline (generated, checked in)
├── version.json                {"game":"0.1.0","content":{"ep01":1}} — single source for cache keys + Android versionName
│
├── src/
│   ├── main.js                 Bootstrap: load content → restore save → mount UI → register SW (web only)
│   ├── engine/                 PURE. No DOM, no storage, no platform. Runs under node --test.
│   │   ├── state.js            Types, initialState, reduce(), selectors, migrate()      ← exists
│   │   └── scoring.js          Outcome + calibration                                    ← exists
│   ├── content/
│   │   ├── loader.js           fetch() episode JSON; offline-safe via SW / bundled in Capacitor
│   │   └── validate.js         Same checks as tests, run at load in dev builds
│   ├── platform/               The ONLY place that knows about web vs. Android
│   │   ├── index.js            isNative = !!window.Capacitor?.isNativePlatform?.()
│   │   ├── storage.js          get/set/remove: localStorage on web, @capacitor/preferences on Android
│   │   ├── haptics.js          no-op on web, @capacitor/haptics on Android
│   │   └── lifecycle.js        pause/resume/back button → dispatches engine actions or UI nav
│   ├── store.js                Holds state, runs reduce(), notifies view, debounced save
│   └── ui/
│       ├── view.js             render(state, ui) → DOM. Never mutates state.
│       ├── screens/            briefing.js · board.js · agents.js · decision.js · ending.js
│       ├── input.js            Pointer + keyboard → actions. Tap-to-select, tap-to-paste (no drag required)
│       └── a11y.js             announce(), focus management, reduced-motion flag
│
├── styles/
│   ├── tokens.css              Colours/spacing, light+dark, matches studio palette (--sun, --mint, …)
│   ├── layout.css              Phone-first grid; tablet/desktop breakpoints; safe-area insets
│   └── components.css
│
├── content/
│   ├── agents.json             Names, roles, colours, portrait paths (shared by all episodes)
│   └── episodes/
│       └── ep01-the-207-message.json                                                   ← exists
│
├── assets/
│   ├── img/agents/             boy.webp tooth.webp darth.webp don.webp (+ SVG fallbacks)
│   ├── img/ui/                 icons as SVG sprites
│   └── audio/                  optional; every sound has a mute toggle and a visual equivalent
│
├── tests/
│   ├── engine.test.mjs         Reducer, content integrity, reachability, golden paths   ← exists
│   ├── offline.test.mjs        Every file in asset-manifest.json exists; nothing referenced is missing
│   └── e2e/                    Playwright smoke at 375 / 768 / 1280 (dev-only, not shipped)
│
└── docs/                       This packet. Not shipped to Android.
```

## Boundaries that keep this from being a throwaway demo

| Rule | Why |
|---|---|
| `engine/` imports nothing outside `engine/` | It can be tested headless, reused by later episodes, and ported if needed |
| Episodes are JSON, not code | Writers (Don Sol, Kevin) can author episodes without touching JS; tests prove each one is completable |
| `platform/` is the only Capacitor-aware code | The web build has zero native dependencies; the Android build swaps adapters, not logic |
| UI state (selected claim, open panel, focus) never goes in `GameState` | Saves stay small and stable when the UI is redesigned |
| `version.json` drives cache keys | One bump invalidates the SW cache and sets the Android `versionName` |

## What ships where

| Path | GitHub Pages | Android (Capacitor `webDir`) |
|---|---|---|
| `index.html`, `src/`, `styles/`, `content/`, `assets/`, `version.json` | ✅ | ✅ |
| `manifest.webmanifest`, `sw.js`, `asset-manifest.json` | ✅ | ❌ (files are already local; the SW is not registered when `isNative`) |
| `tests/`, `docs/` | served but unlinked (add a `Disallow` in robots.txt) | ❌ excluded by the sync script |

The Capacitor project itself lives **outside** this site repo (see [04](04-android-capacitor-plan.md)), so Gradle files and `node_modules` never land on theidealabstudio.com.
