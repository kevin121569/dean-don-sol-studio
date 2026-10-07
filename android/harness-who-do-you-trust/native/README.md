# Native bridge contract

This module is Android-only glue. It does not implement game rules.

It hydrates a synchronous in-memory cache from Capacitor Preferences before importing the locked game, mirrors later writes to Preferences, flushes pending writes when the app backgrounds, and maps Android Back to: close an open dialog, use the game's existing Back control, then browser history when available.

The locked r5 files under `www/` are not edited by this bridge. Integration requires the generated Capacitor shell to load this bootstrap as the entry point and to make the cache backend available to the game store through a separately reviewed one-line injection point or wrapper build transform. Until that wiring is reviewed, this file is scaffold code and must not be represented as production-active.
