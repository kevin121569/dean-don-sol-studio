# Who Do You Trust? — Android graphics and sound device test

This folder packages the self-contained Episode 1 cinematic build for physical Android testing.

- App id: `com.theidealabstudio.harnesswhodoyoutrust`
- App name: `Who Do You Trust?`
- Device-test payload: nine story/game screens with embedded scene art and three embedded WAV tracks
- Sound begins only after the player taps **START WITH SOUND**, in accordance with Android playback rules
- Web source: one hash-locked, self-contained `www/index.html`
- Generated Capacitor web root: `dist`
- Target SDK: Android 16 / API 36 through Capacitor 8
- No signing keys belong in git
- Debug builds are for device acceptance only

The build gate rejects the payload if its locked hash changes, if the embedded graphics/audio markers disappear, or if the packaged HTML becomes unexpectedly small. Physical-device confirmation is still required before signing or uploading to Google Play.
