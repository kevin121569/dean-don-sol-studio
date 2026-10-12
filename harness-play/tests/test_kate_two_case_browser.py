#!/usr/bin/env python3
"""Test actual Kate Episode 1 and 2 HTML in a simulated desktop and mobile browser.
No official game/source modification. This is NOT real-device or live HTTPS QA.
"""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
SITE = ROOT / "harness-play" / "kate-cinematic-test-2026-10-11"
OUT = Path(os.environ.get("HARNESS_QA_OUT", "/tmp/harness-two-case-qa"))
OUT.mkdir(parents=True, exist_ok=True)
CASES = [
    ("episode1", "The Shutdown Call", "kate-enter-silent", "kate-final-report"),
    ("episode2", "The Answer Key", "kate-silent2", "kate-awards2"),
]
results = []

def check(ep, mode, name, ok, detail=""):
    results.append(dict(episode=ep, viewport=mode, check=name, passed=bool(ok), detail=detail[:250]))
    print(("PASS" if ok else "FAIL"), ep, mode, name, detail[:130], flush=True)
    if not ok:
        raise AssertionError(name + ": " + detail)

def snap(page, name):
    page.screenshot(path=str(OUT / name), animations="disabled", timeout=30000)

def investigate(page):
    for id in ("relayButton", "commandButton", "briefingNext", "missionButton"):
        page.locator("#" + id).click(timeout=10000)
    page.locator("#sceneInvestigation").wait_for(state="visible")

def see_report(page, id):
    page.locator("#" + id).wait_for(state="visible", timeout=15000)
    return page.locator("#" + id).inner_text()

def finish(page, ep, mode, award, thorough=False):
    if thorough:
        advisers=page.locator("[data-consult]")
        ids=list(dict.fromkeys(advisers.evaluate_all("(els)=>els.map(e=>e.dataset.consult)")))
        check(ep,mode,"four distinct adviser controls",len(ids)==4,str(ids))
        # An adviser can change advice only after newly revealed evidence is opened.
        # Episode 2: BOY reveals the origin audit; AFTER reading it, asking TOOTH
        # again reveals a separate independent harbor-gauge record. Repeat until
        # the investigation reaches a fixed point; never fabricate any evidence.
        prior=-1
        for cycle in range(7):
            for _ in range(12):
                unread=page.locator("button[data-evidence]:not(.read)")
                if not unread.count(): break
                unread.first.click()
            for id in ids:
                page.locator('[data-consult="'+id+'"]').first.click()
            for _ in range(12):
                unread=page.locator("button[data-evidence]:not(.read)")
                if not unread.count(): break
                unread.first.click()
            count=page.locator("button[data-evidence].read").count()
            if count==prior: break
            prior=count
        else:
            raise AssertionError("Evidence/adviser cycle did not converge")
        check(ep,mode,"all genuinely discoverable records inspected",
              page.locator("button[data-evidence]:not(.read)").count()==0 and prior>=5,str(prior))
    page.locator("#goDecision").click()
    page.locator("#sceneDecision").wait_for(state="visible")
    options=page.locator("button[data-decision]")
    check(ep,mode,"source decision options",options.count()>=4,str(options.count()))
    if not thorough:
        check(ep,mode,"fourth option protected before investigation",
              page.locator("button[data-decision][disabled]").count()>0)
    unlocked=thorough and options.last.is_enabled()
    (options.last if unlocked else page.locator("button[data-decision]:not([disabled])").first).click()
    check(ep,mode,"order requires acknowledgment",not page.locator("#submitDecision").is_enabled())
    page.locator("#uncertaintyCheck").check()
    page.locator("#submitDecision").click()
    page.locator("#sceneOutcome").wait_for(state="visible")
    check(ep,mode,"source-defined risk displayed",bool(page.locator("#outcomeRisk").inner_text().strip()))
    page.locator("#showDebrief").click()
    page.locator("#sceneDebrief").wait_for(state="visible")
    report=see_report(page,award)
    if thorough:
        # The authored completion widget refreshes on a zero-delay callback. A prior
        # replay can leave the old (unearned) report visible for one event loop turn.
        # Wait for the freshly updated report, not the already-mounted old panel.
        page.locator("#"+award).filter(has_text="Evidence Detective").wait_for(state="visible",timeout=8000)
        report=page.locator("#"+award).inner_text()
    check(ep,mode,"Mission Complete presented","MISSION COMPLETE" in report.upper())
    if thorough:
        check(ep,mode,"Evidence Detective earned","EVIDENCE DETECTIVE" in report.upper())
        check(ep,mode,"Four Perspectives earned","FOUR PERSPECTIVES" in report.upper())
        if unlocked:
            check(ep,mode,"Hidden Strategy awarded only after earned choice","HIDDEN STRATEGY" in report.upper())
    else:
        check(ep,mode,"no unearned Evidence Detective","EVIDENCE DETECTIVE" not in report.upper())
        check(ep,mode,"no unearned Hidden Strategy","HIDDEN STRATEGY" not in report.upper())
    snap(page,ep+"_"+mode+("_thorough" if thorough else "_quick")+"_complete.png")

def run_case(browser, mode, viewport, case):
    ep,title,entry,award=case
    page=browser.new_page(viewport=viewport,reduced_motion="reduce")
    errors=[]
    page.on("pageerror",lambda err: errors.append(str(err)))
    try:
        page.goto((SITE/(ep+".html")).as_uri(),wait_until="domcontentloaded",timeout=45000)
        page.locator("#"+entry).wait_for(state="visible")
        check(ep,mode,"Kate episode browser-tab title",("Episode 1" if ep == "episode1" else "Episode 2") in page.title())
        snap(page,ep+"_"+mode+"_opening.png")
        page.locator("#"+entry).click()
        check(ep,mode,"sound explicitly off",page.locator("#audioToggle").get_attribute("aria-pressed")=="false")
        page.locator("#sceneIsolation").wait_for(state="visible")
        investigate(page)
        check(ep,mode,"real evidence console populated",page.locator("button[data-evidence]").count()>=3)
        snap(page,ep+"_"+mode+"_evidence.png")
        finish(page,ep,mode,award,False)
        page.locator("#replayButton").click()
        page.locator("#sceneTitle").wait_for(state="visible")
        check(ep,mode,"replay returns to title",page.locator("#sceneTitle").is_visible())
        page.locator("#startButton").click()
        investigate(page)
        finish(page,ep,mode,award,True)
        check(ep,mode,"zero uncaught JavaScript errors",not errors,str(errors))
    except Exception as exc:
        results.append(dict(episode=ep,viewport=mode,check="END-TO-END CASE FLOW",passed=False,detail=str(exc)[:500]))
        print("FAIL",ep,mode,"END-TO-END CASE FLOW",str(exc),flush=True)
        try:snap(page,ep+"_"+mode+"_failure.png")
        except Exception: pass
    finally:
        page.close()

with sync_playwright() as playwright:
    browser=playwright.chromium.launch(headless=True,args=["--no-sandbox"])
    for mode,viewport in (("mobile",dict(width=390,height=844)),("desktop",dict(width=1280,height=900))):
        for case in CASES:run_case(browser,mode,viewport,case)
    browser.close()
passed=sum(item["passed"] for item in results)
report=dict(scope="Original two Kate HTML episodes; simulated Chromium only",checks=len(results),passed=passed,
            failed=len(results)-passed,real_phone_tested=False,live_https_tested=False,modified_game_files=False,
            results=results)
(OUT/"QA_RESULTS.json").write_text(json.dumps(report,indent=2))
print("RESULT:",passed,"/",len(results),"checks passed",flush=True)
if report["failed"]:raise SystemExit(1)
