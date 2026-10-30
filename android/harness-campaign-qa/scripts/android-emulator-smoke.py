#!/usr/bin/env python3
"""Real Android WebView smoke test for the already-built HARNESS QA G APK.

This tests native install, Case 1 entry, Android Back to the case selector,
and reopening the same case. It does NOT claim full Cases 2-5 play-through,
save persistence after a completed clue, or real-device audio.
"""
import json
import os
from pathlib import Path
import re
import subprocess
import time
import xml.etree.ElementTree as ET

PACKAGE = "com.theidealabstudio.harness.campaign.fullqa.g"
OUT = Path(os.environ.get("HARNESS_SMOKE_OUTPUT", "harness-android-smoke-artifacts"))
OUT.mkdir(parents=True, exist_ok=True)
REPORT = {"package": PACKAGE, "stages": [], "result": "in_progress", "scope": "Android launch/Case 1/Back/reopen only"}


def adb(*args, timeout=55, check=True):
    return subprocess.run(["adb", *args], check=check, capture_output=True, text=True, timeout=timeout)


def capture(label):
    image = subprocess.run(["adb", "exec-out", "screencap", "-p"], capture_output=True, timeout=30)
    if image.returncode == 0 and image.stdout:
        (OUT / (label + ".png")).write_bytes(image.stdout)
    try:
        raw = adb("shell", "uiautomator", "dump", "/sdcard/harness-window.xml", timeout=50, check=False)
        content = adb("shell", "cat", "/sdcard/harness-window.xml", timeout=20, check=False).stdout
        if content.lstrip().startswith("<?xml"):
            (OUT / (label + ".xml")).write_text(content, encoding="utf8")
            root = ET.fromstring(content)
            return root
        (OUT / (label + ".txt")).write_text(raw.stdout + raw.stderr + content[:1000], encoding="utf8")
    except (subprocess.SubprocessError, ET.ParseError) as error:
        (OUT / (label + ".txt")).write_text(str(error), encoding="utf8")
    return None


def nodes(root):
    if root is None:
        return []
    return [(node, " ".join((node.get("text", ""), node.get("content-desc", ""))).strip())
            for node in root.iter()]


def find(root, needle):
    lower = needle.lower()
    for node, description in nodes(root):
        if lower in description.lower() and node.get("bounds"):
            bounds = list(map(int, re.findall(r"\d+", node.attrib["bounds"])))
            if len(bounds) == 4:
                x1, y1, x2, y2 = bounds
                if x2 > x1 and y2 > y1:
                    return (x1 + x2) // 2, (y1 + y2) // 2, description
    return None


def wait_for(needle, label, seconds=40):
    deadline = time.monotonic() + seconds
    iteration = 0
    while time.monotonic() < deadline:
        root = capture(label if iteration == 0 else label + "-probe")
        matched = find(root, needle)
        if matched:
            REPORT["stages"].append({"stage": label, "found": needle, "detail": matched[2][:140]})
            return root
        iteration += 1
        time.sleep(2)
    raise AssertionError(f"Timed out waiting for accessible Android text: {needle!r}; screenshots and hierarchy saved in {OUT}")


def tap(root, needle, scrolls=0):
    for index in range(scrolls + 1):
        matched = find(root, needle)
        if matched:
            x, y, description = matched
            adb("shell", "input", "tap", str(x), str(y))
            REPORT["stages"].append({"action": "tap", "text": description[:140], "x": x, "y": y})
            time.sleep(2)
            return
        if index < scrolls:
            adb("shell", "input", "swipe", "200", "740", "200", "290", "380")
            time.sleep(1)
            root = capture("scroll-" + str(index))
    raise AssertionError(f"Could not find clickable Android element {needle!r}")


def assert_running():
    pid = adb("shell", "pidof", PACKAGE, check=False).stdout.strip()
    if not pid:
        raise AssertionError("HARNESS Android process exited unexpectedly")
    return pid


try:
    boot = adb("shell", "getprop", "sys.boot_completed").stdout.strip()
    assert boot == "1", "Android emulator is not booted"
    adb("shell", "wm", "size", "390x844")
    adb("shell", "wm", "density", "240")
    apk = Path(os.environ.get("HARNESS_APK", "qa-apk/HARNESS-QA-FIVE-CASES-FULL5-20261029-G.apk"))
    assert apk.is_file() and apk.stat().st_size > 7_000_000, "Missing validated Build G APK"
    adb("install", "-r", str(apk), timeout=150)
    launch = adb("shell", "monkey", "-p", PACKAGE, "-c", "android.intent.category.LAUNCHER", "1")
    REPORT["stages"].append({"stage": "launch", "message": launch.stdout[-300:]})
    wait_for("HARNESS QA", "launch")
    assert_running()

    root = capture("qa-splash")
    tap(root, "START / RESUME FIVE-CASE CAMPAIGN", scrolls=6)
    root = wait_for("ALL FIVE CASES", "selector")
    tap(root, "BEGIN CASE", scrolls=5)
    wait_for("CASE 1 OF 5", "case-1")
    assert_running()

    adb("shell", "input", "keyevent", "KEYCODE_BACK")
    root = wait_for("ALL FIVE CASES", "after-android-back")
    assert_running()
    # Returning from a live case changes BEGIN CASE to RESUME CASE, proving a saved in-progress state.
    tap(root, "RESUME CASE", scrolls=5)
    REPORT["stages"].append({"stage": "in-progress-state", "detail": "RESUME CASE displayed after Android Back"})
    wait_for("CASE 1 OF 5", "case-1-reopened")
    assert_running()

    # A force-stop + relaunch checks the app opens after a process restart.
    # It does not establish deep game progress restoration.
    adb("shell", "am", "force-stop", PACKAGE)
    adb("shell", "monkey", "-p", PACKAGE, "-c", "android.intent.category.LAUNCHER", "1")
    wait_for("HARNESS QA", "after-process-relaunch")
    assert_running()
    REPORT["result"] = "pass"
except Exception as error:
    REPORT["result"] = "fail"
    REPORT["error"] = str(error)
    capture("failure-state")
finally:
    (OUT / "report.json").write_text(json.dumps(REPORT, indent=2) + "\n", encoding="utf8")
    print(json.dumps(REPORT, indent=2))
if REPORT["result"] != "pass":
    raise SystemExit(1)
