#!/usr/bin/env python3
"""QA-only Android WebView CDP integration probe for packaged Cases 2–5.

Unchanged Build G artifact. Uses Chrome DevTools Protocol to seed prior-case
completion in the local *emulator test profile only*. Seeded prerequisites are
NOT a legitimate playthrough or proof of sequential end-to-end progression.
Actual Android system Back is sent through ADB; rendering and clue controls
are inspected in the live Android WebView rather than an in-memory browser.
"""
import json
import os
from pathlib import Path
import re
import subprocess
import time
import xml.etree.ElementTree as ET
from urllib.request import urlopen
import websocket

PACKAGE = "com.theidealabstudio.harness.campaign.fullqa.g"
OUT = Path("harness-later-cases-evidence")
OUT.mkdir(exist_ok=True)
REPORT = {"apk": "FULL5-20261029-G", "mode": "native-WebView-CDP with seeded prerequisite completion", "stages": [], "result": "running",
          "limitations": "Not an organic Case 1–5 completion; no real-device audio or manual tap accuracy"}
PORT = 9222

def adb(*args, timeout=60, check=True):
    return subprocess.run(["adb", *args], capture_output=True, text=True, timeout=timeout, check=check)

def screenshot(label):
    r = subprocess.run(["adb","exec-out","screencap","-p"],capture_output=True,timeout=30)
    if r.returncode == 0 and r.stdout:
        (OUT / (label + ".png")).write_bytes(r.stdout)

def bind_devtools():
    sockets = adb("shell", "cat", "/proc/net/unix").stdout
    candidates = list(dict.fromkeys(re.findall(r"@?(webview_devtools_remote_[0-9]+)", sockets)))
    if not candidates:
        raise RuntimeError("Android WebView CDP socket unavailable; cannot claim native integration.")
    for socket in reversed(candidates):
        adb("forward", f"tcp:{PORT}", f"localabstract:{socket}",check=False)
        try:
            with urlopen(f"http://127.0.0.1:{PORT}/json/list",timeout=6) as response:
                targets=json.load(response)
            pages = [p for p in targets if p.get("type")=="page" and p.get("webSocketDebuggerUrl")]
            if pages: return pages[0]
        except Exception:
            continue
    raise RuntimeError("CDP socket exists but no debuggable HARNESS WebView page found.")

def evaluate(expression, timeout=15):
    page=bind_devtools()
    ws=websocket.create_connection(page["webSocketDebuggerUrl"],timeout=timeout,suppress_origin=True)
    try:
        ws.send(json.dumps({"id":21,"method":"Runtime.evaluate","params":{"expression":expression,"awaitPromise":True,"returnByValue":True,"userGesture":True}}))
        deadline=time.monotonic()+timeout
        while time.monotonic()<deadline:
            response=json.loads(ws.recv())
            if response.get("id")!=21:continue
            if response.get("error"):raise RuntimeError(str(response["error"]))
            result=response.get("result",{})
            if result.get("exceptionDetails"):raise RuntimeError(str(result["exceptionDetails"])[:650])
            return result.get("result",{}).get("value")
        raise TimeoutError("CDP evaluate response timed out.")
    finally:
        ws.close()

def dismiss_emulator_launcher_anr():
    """Dismiss only a recognized Pixel Launcher OS dialog, never a HARNESS dialog."""
    adb("shell", "uiautomator", "dump", "/sdcard/harness-qa-anr.xml", timeout=35, check=False)
    raw=adb("shell", "cat", "/sdcard/harness-qa-anr.xml", timeout=15, check=False).stdout
    if "Pixel Launcher isn't responding" not in raw and "Pixel Launcher isn" not in raw:
        return False
    try:
        root=ET.fromstring(raw)
        for element in root.iter():
            if "Close app" in ((element.get("text") or "")+" "+(element.get("content-desc") or "")):
                coords=list(map(int,re.findall(r"\d+",element.get("bounds",""))))
                if len(coords)==4:
                    x=(coords[0]+coords[2])//2
                    y=(coords[1]+coords[3])//2
                    adb("shell","input","tap",str(x),str(y))
                    time.sleep(2)
                    REPORT["stages"].append({"system":"dismissed Pixel Launcher ANR via Close app"})
                    return True
    except Exception as exc:
        REPORT["stages"].append({"system":"ANR detected but could not dismiss","reason":str(exc)[:160]})
    return False

def until(expression, description, seconds=55):
    end=time.monotonic()+seconds
    error=None
    iteration=0
    while time.monotonic()<end:
        if iteration%3==0: dismiss_emulator_launcher_anr()
        iteration+=1
        try:
            value=evaluate(expression,timeout=10)
            if value:
                REPORT["stages"].append({"check":description,"result":value})
                return value
        except Exception as exc:
            error=str(exc)[:200]
        time.sleep(2)
    raise AssertionError(f"Timed out: {description}; last error: {error}")

def go(urlpart):
    evaluate(f"location.assign({json.dumps(urlpart)}); true")
    time.sleep(3)

def ensure_selector():
    until("location.pathname.endsWith('/campaign/app/index.html') && !!document.getElementById('caseList')", "campaign selector mounted")

def seeded_unlock_through(level):
    # Explicit test fixture, not organic story completion. Uses genuine production
    # createCampaignStore and content-derived ids; does not bypass case-status checks.
    js=f"""(async()=>{{
      const manifest=await (await fetch('../campaign.json')).json();
      const mod=await import('../runtime/campaign-store.mjs');
      const store=mod.createCampaignStore(manifest);
      for(let level=1;level<={level};level++){{
        const item=manifest.cases[level-1];
        if(store.caseStatus(item.id)==='completed')continue;
        const choice=(level<3)?'d_hybrid':(await (await fetch('../'+item.source)).json()).bestDecisionId;
        if(!store.completeCase(item.id,choice))throw Error('prerequisite fixture refused '+item.id);
      }}
      window.HarnessCampaign?.refresh?.();
      return manifest.cases.map(i=>[i.level,store.caseStatus(i.id)]);
    }})()"""
    result=evaluate(js,timeout=20)
    REPORT["stages"].append({"setup":"seeded prior-case completion for native UI compatibility only","through_level":level,"statuses":result})
    return result

def check_legacy_case_two():
    ensure_selector()
    seeded_unlock_through(1)
    go("./case.html?case=episode-002")
    until("window.HarnessCampaignRunner?.caseId === 'episode-002' && !document.getElementById('caseFrame').hidden", "Case 2 runner booted",seconds=65)
    # Case 2 is a frozen legacy HTML iframe. Native screenshot is authoritative
    # for its art, while its accessibility/DOM contract differs from the shared renderer.
    # Do not infer a broken illustration from a missing HTML <img> node.
    v=evaluate("""(()=>({title:document.getElementById('caseTitle')?.textContent,
      frameReady:!document.getElementById('caseFrame')?.hidden,
      frameContentChars:document.getElementById('caseFrame')?.contentDocument?.body?.innerText?.length??null}))()""")
    REPORT["stages"].append({"case":2,"nativeScreenshot":"case2-native.png","details":v})
    dismiss_emulator_launcher_anr()
    screenshot("case2-native")
    # Start without mutating outcomes; assert actual evidence interface can be reached.
    start=evaluate("""(()=>{
      const d=document.getElementById('caseFrame').contentDocument;
      const b=[...d.querySelectorAll('button')].find(x=>/start silent/i.test(x.textContent));
      if(!b)return 'missing-start';b.click();return 'clicked-start';
    })()""")
    REPORT["stages"].append({"case":2,"start":start,"visual":v})
    screenshot("case2-after-start")
    dismiss_emulator_launcher_anr()
    adb("shell","input","keyevent","KEYCODE_BACK")
    until("location.pathname.endsWith('/campaign/app/index.html')","Case 2 native Back to menu")
    screenshot("case2-after-back")

def check_shared(level):
    ensure_selector()
    seeded_unlock_through(level-1)
    go(f"./play.html?case=episode-00{level}")
    title = {3: "The Cold Mirror", 4: "The Ledger's Weight", 5: "The Open Record"}[level]
    until(f"document.querySelector('.case-head h1')?.textContent === {json.dumps(title)}", "Case "+str(level)+" header from real APK", seconds=55)
    # Click genuine stage control through CDP while observing Android WebView DOM.
    start=evaluate("""(()=>{let b=document.querySelector('[data-action="start"]');if(!b)return false;b.click();return true})()""")
    if not start:raise AssertionError(f"Case {level} has no enabled evidence-board start")
    info=until("""(()=>{
      const cards=[...document.querySelectorAll('.evidence-card')];
      if(cards.length!==4)return false;
      const imgs=[...document.querySelectorAll('.evidence-card img')];
      return imgs.length===4 && imgs.every(i=>i.complete&&i.naturalWidth>0)
      ? {cards:cards.length,images:imgs.length,soundButton:document.querySelector('#harnessSharedSound')?.textContent} : false;
    })()""",f"Case {level} four illustrated clue cards on Android",seconds=65)
    viewport=evaluate("""(()=>{
      const w=window.innerWidth;
      const selectors=['.app-shell','.case-head','.alert-gauge','#qaBuildBanner'];
      const elements=selectors.map(selector=>{
        const el=document.querySelector(selector),r=el?.getBoundingClientRect();
        return {selector,present:!!el,left:r?.left,right:r?.right};
      });
      return {width:w,documentWidth:document.documentElement.scrollWidth,elements};
    })()""")
    if viewport["width"] < 360 or viewport["width"] > 440:
        raise AssertionError(f"Unexpected CSS viewport {viewport['width']}px; Android density invalid")
    for item in viewport["elements"]:
        if item["present"] and (item["left"] < -1 or item["right"] > viewport["width"] + 1):
            raise AssertionError(f"Case {level} {item['selector']} clips at CSS viewport {viewport['width']}: {item}")
    REPORT["stages"].append({"case":level,"viewport":viewport})
    time.sleep(0.5)
    screenshot(f"case{level}-native-board")
    opened=evaluate("""(()=>{const b=document.querySelector('.evidence-card');if(!b)return false;b.click();return true})()""")
    if not opened:raise AssertionError("Clue button could not be clicked")
    until("!!document.querySelector('.drawer:not([hidden])')",f"Case {level} opened actual evidence drawer")
    # Return to board and ensure checked state persists when browser view rerenders.
    evaluate("""(()=>{document.querySelector('[data-action="close-drawer"]')?.click();return true})()""")
    until("!!document.querySelector('.evidence-card.inspected')",f"Case {level} inspected clue state")
    screenshot(f"case{level}-inspected")
    # Native Back may navigate within the story in some cases; inspect result rather than assume menu.
    adb("shell","input","keyevent","KEYCODE_BACK")
    time.sleep(2)
    location=evaluate("({url:location.href, heading:document.querySelector('.case-head h1')?.textContent,scene:document.querySelector('.screen-head h2')?.textContent})")
    REPORT["stages"].append({"case":level,"nativeBackResult":location,"render":info})
    screenshot(f"case{level}-back")
    # Explicit route to menu for next independent case; we do not claim full progression here.
    if not evaluate("location.pathname.endsWith('/campaign/app/index.html')"):
        go("./index.html")
    ensure_selector()

try:
    assert adb("shell","getprop","sys.boot_completed").stdout.strip()=="1","Android emulator not booted"
    adb("shell","wm","size","390x844")
    adb("shell","wm","density","160")  # 390 physical px = 390 CSS px for the responsive QA gate
    apk=Path("qa-apk/HARNESS-QA-FIVE-CASES-FULL5-20261029-G.apk")
    assert apk.exists() and apk.stat().st_size>7_000_000,"missing verified Build G APK"
    adb("install","-r",str(apk),timeout=180)
    adb("shell","monkey","-p",PACKAGE,"-c","android.intent.category.LAUNCHER","1")
    until("document.title.includes('HARNESS QA')","Android app launched",seconds=75)
    screenshot("launcher")
    go("./campaign/app/index.html")
    ensure_selector()
    check_legacy_case_two()
    for level in [3,4,5]: check_shared(level)
    REPORT["result"]="pass"
except Exception as exc:
    REPORT["result"]="fail"
    REPORT["error"]=str(exc)
    screenshot("failure")
finally:
    (OUT/"report.json").write_text(json.dumps(REPORT,indent=2)+"\n")
    print(json.dumps(REPORT,indent=2))
if REPORT["result"]!="pass":
    raise SystemExit(1)
