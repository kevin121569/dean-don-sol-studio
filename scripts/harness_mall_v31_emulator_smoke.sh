#!/usr/bin/env bash
set -euo pipefail
PKG=com.theidealabstudio.harness.mallv31demo
APK=mall-apk/android/app/build/outputs/apk/debug/app-debug.apk
mkdir -p emulator-qa
adb install -r "$APK"
adb logcat -c
adb shell settings put system screen_off_timeout 600000 || true
adb shell svc wifi disable || true
adb shell svc data disable || true
echo 'Offline Android app launch' | tee emulator-qa/RESULT.txt
adb shell monkey -p "$PKG" -c android.intent.category.LAUNCHER 1
sleep 17
adb shell pidof "$PKG" | tee -a emulator-qa/RESULT.txt
adb exec-out screencap -p > emulator-qa/01-title-offline.png
python3 - <<'PY'
from pathlib import Path
p=Path('emulator-qa/01-title-offline.png')
assert p.stat().st_size>1000, 'first screenshot capture empty'
print('First screen saved, bytes:',p.stat().st_size)
PY
adb shell dumpsys activity activities > emulator-qa/activity-dumpsys.txt || true
adb logcat -d -v time > emulator-qa/01-launch-logcat.txt
sleep 12
adb exec-out screencap -p > emulator-qa/01b-title-after-30s.png
SIZE=$(adb shell wm size | tr -d '\r' | grep -oE '[0-9]+x[0-9]+' | head -1)
W=$(echo "$SIZE" | cut -dx -f1)
H=$(echo "$SIZE" | cut -dx -f2)
echo "Display $W x $H" | tee -a emulator-qa/RESULT.txt
adb shell input tap "$((W/2))" "$((H*80/100))"
sleep 6
adb exec-out screencap -p > emulator-qa/02-after-start-tap.png
if cmp -s emulator-qa/01b-title-after-30s.png emulator-qa/02-after-start-tap.png; then echo "FAIL: title unchanged after Enter tap" >> emulator-qa/RESULT.txt; exit 2; fi
adb shell pidof "$PKG" | tee -a emulator-qa/RESULT.txt
adb shell input keyevent KEYCODE_HOME
sleep 2
adb shell monkey -p "$PKG" -c android.intent.category.LAUNCHER 1
sleep 3
adb exec-out screencap -p > emulator-qa/03-return-from-background.png
adb logcat -d -v time > emulator-qa/android-logcat.txt
grep -iE 'chromium|cr_WebView|MediaPlayer|AudioTrack|NotAllowedError|NotSupportedError|WebView|Console|AndroidRuntime|FATAL EXCEPTION' emulator-qa/android-logcat.txt | tail -160 > emulator-qa/relevant-logcat.txt || true
for n in 01-title-offline 02-after-start-tap 03-return-from-background; do test -s "emulator-qa/$n.png"; done
echo "CAPTURED 3 Android screenshots; device audio hardware is not certified" | tee -a emulator-qa/RESULT.txt
