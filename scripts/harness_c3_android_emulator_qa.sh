#!/usr/bin/env bash
set -euo pipefail
PKG=com.theidealabstudio.harnesswhodoyoutrust.creativec3dev
APK=c3-artifact/android/app/build/outputs/apk/debug/app-debug.apk
mkdir -p emulator-qa
adb install -r "$APK"
adb logcat -c
adb shell monkey -p "$PKG" -c android.intent.category.LAUNCHER 1
sleep 10
adb exec-out screencap -p > emulator-qa/01-first-launch.png
adb shell uiautomator dump /sdcard/first.xml || true
adb pull /sdcard/first.xml emulator-qa/01-first.xml || true
python3 - <<'PY'
import subprocess,re,xml.etree.ElementTree as ET
try:
 t=ET.parse('emulator-qa/01-first.xml')
 for node in t.iter('node'):
  txt=node.get('text','')+' '+node.get('content-desc','')
  if 'Enter Server 4' in txt:
   a=list(map(int,re.findall(r'\d+',node.get('bounds',''))))
   if len(a)==4:
    x=(a[0]+a[2])//2;y=(a[1]+a[3])//2
    print('FOUND ENTER',x,y,flush=True)
    subprocess.check_call(['adb','shell','input','tap',str(x),str(y)])
    break
 else:
  print('ENTER NOT FOUND in UI; skip tap rather than test wrong place',flush=True)
except Exception as e: print('UI PARSE ERROR',e,flush=True)
PY
sleep 8
adb exec-out screencap -p > emulator-qa/02-after-enter.png
adb shell uiautomator dump /sdcard/second.xml || true
adb pull /sdcard/second.xml emulator-qa/02-after-enter.xml || true
adb shell input keyevent KEYCODE_HOME
sleep 2
adb shell monkey -p "$PKG" -c android.intent.category.LAUNCHER 1
sleep 6
adb exec-out screencap -p > emulator-qa/03-return-from-background.png
adb shell am force-stop "$PKG"
adb shell monkey -p "$PKG" -c android.intent.category.LAUNCHER 1
sleep 6
adb exec-out screencap -p > emulator-qa/04-force-restart.png
adb logcat -d -v time > emulator-qa/logcat.txt
grep -iE 'chromium|cr_WebView|MediaPlayer|AudioTrack|NotAllowedError|NotSupportedError|WebView|Console|AndroidRuntime' emulator-qa/logcat.txt | tail -250 > emulator-qa/suspected-errors.txt || true
ls -lh emulator-qa/