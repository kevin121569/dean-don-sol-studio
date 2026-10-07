# Native adapter regression contract

These are release-gate assertions for the Android wrapper. They deliberately test the boundary rather than re-specifying game rules.

1. The 14 files under `www/` must remain blob-identical to the reviewed r5 source payload.
2. Bootstrap hydrates Preferences before importing `www/js/app.js`.
3. The injected storage object exposes synchronous `getItem`, `setItem`, and `removeItem`; `state.js` therefore runs its existing createStore/restore validation unchanged.
4. Writes update the in-memory cache immediately and schedule a serialized durable flush after a 250 ms quiet period.
5. Backgrounding cancels any pending debounce timer and flushes immediately. Rapid writes/flush requests must coalesce without allowing stale values to overwrite newer values.
6. Preference failure never blocks game startup; the locked app falls back to its normal storage behavior.
7. Android Back closes an open dialog first, then activates the existing enabled game Back control, then uses browser history only when available.
8. The adapter may not call the reducer, select advice, mutate episode content, construct save objects, or bypass restoreState.
9. Signing keys, APKs, AABs, generated Android project files, and node_modules remain outside git.

Physical-device acceptance remains required for touch, keyboard/accessibility behavior, pause/resume persistence, process death/relaunch restore, hardware Back, safe areas, and reduced motion.
