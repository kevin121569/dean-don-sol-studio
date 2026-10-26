# Native bridge contract

This module is Android-only glue. It does not implement game rules.

It hydrates a synchronous in-memory cache from Capacitor Preferences before importing the locked game, mirrors later writes to Preferences, flushes pending writes when the app backgrounds, and maps Android Back to: close an open dialog, use the game's existing Back control, then browser history when available.

The locked R1 files under `www/` are not edited by this bridge. `npm run build:web` stages them in `dist/`, bundles this module and its Capacitor imports, and replaces the ordinary web entry point only in that generated directory. The browser game and its reducer remain unchanged.

This bridge is release-candidate code until the physical-device checks in `REGRESSION_CONTRACT.md` pass.
