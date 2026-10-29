// Browser smoke + actual Cases 3–5 playthrough against a staged five-case QA web payload.
// This is NOT an Android device test and does not replace the human playtest.
import assert from "node:assert/strict";
import {chromium} from "playwright";

const origin = process.env.HARNESS_QA_URL ?? "http://127.0.0.1:4173";
const browser = await chromium.launch({headless:true});
const context = await browser.newContext({viewport:{width:390,height:844},reducedMotion:"reduce"});
await context.addInitScript(() => {
  const registered = [];
  window.__harnessBackCallbacks = registered;
  window.Capacitor = {
    Plugins: {App: {
      addListener(type, callback) {
        if (type === "backButton") registered.push(callback);
        return Promise.resolve({remove() {}});
      }
    }}
  };
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", e => errors.push(e.message));

async function goto(route) {
  const response = await page.goto(origin + route, {waitUntil:"domcontentloaded", timeout:30000});
  assert.equal(response.status(), 200, route + " must return 200");
}

async function storeAction(action, caseId, outcomeId) {
  return page.evaluate(async ({action,caseId,outcomeId}) => {
    const manifest = await (await fetch("/campaign/campaign.json")).json();
    const {createCampaignStore} = await import("/campaign/runtime/campaign-store.mjs");
    const store = createCampaignStore(manifest);
    if (action === "complete") return store.completeCase(caseId,outcomeId);
    if (action === "status") return store.caseStatus(caseId);
    return store.listCases().map(x=>x.status);
  },{action,caseId,outcomeId});
}

async function unlockByPredecessor(caseId) {
  const item = (await (await page.request.get(origin+"/campaign/campaign.json")).json()).cases.find(x=>x.id===caseId);
  const idx = item.level - 1;
  const predecessor = (await (await page.request.get(origin+"/campaign/campaign.json")).json()).cases[idx-1];
  if (predecessor) {
    const status = await storeAction("status",predecessor.id);
    if (status !== "completed") {
      const outcome = predecessor.id === "episode-002" ? "d_hybrid" : "d_hybrid";
      assert.equal(await storeAction("complete",predecessor.id,outcome),true);
    }
  }
}

try {
  await goto("/campaign/app/index.html");
  assert.equal(await page.locator("#caseList .case-card").count(),5);
  assert.equal(await storeAction("status","episode-002"),"locked");

  await goto("/campaign/app/case.html?case=episode-001");
  await page.waitForFunction(() => Boolean(document.querySelector("#caseFrame")?.contentWindow?.HarnessV34), null, {timeout:45000});
  assert.equal(await page.locator("#caseFrame").isVisible(),true);

  assert.equal(await storeAction("complete","episode-001","d_hybrid"),true);
  await goto("/campaign/app/case.html?case=episode-002");
  await page.waitForFunction(() => Boolean(document.querySelector("#caseFrame")?.contentWindow?.HarnessV34), {timeout:45000});
  assert.equal(await page.locator("#caseFrame").isVisible(),true);
  // Legacy Case 2 game UI is fingerprinted and loads; its end-to-end choices require separate phone QA.
  assert.equal(await storeAction("complete","episode-002","d_hybrid"),true);

  for (const num of [3,4,5]) {
    const id="episode-00"+num;
    await goto("/campaign/app/play.html?case="+id);
    await page.locator("button[data-action=start]").waitFor({state:"visible",timeout:45000});
    await page.locator("button[data-action=start]").click();
    await page.locator(".evidence-grid .evidence-card").first().waitFor({state:"visible"});
    assert.equal(await page.locator(".evidence-grid .evidence-card").count(),4);
    // Each case must register only the campaign-level Back handler.
    await page.waitForFunction(() => window.__harnessBackCallbacks?.length === 1, null, {timeout:5000});
    assert.equal(await page.evaluate(() => window.__harnessBackCallbacks.length),1,id+" should have one Android Back listener");
    if (num === 3) {
      // One recorded clue must survive an Android Back to the case selector.
      const firstClue = page.locator(".evidence-grid .evidence-card").first();
      await firstClue.click();
      await page.locator('button[data-action="close-drawer"]').click();
      assert.equal(await storeAction("status",id),"in_progress");
      await page.evaluate(() => window.__harnessBackCallbacks[0]());
      await page.locator("#caseList .case-card").first().waitFor({state:"visible"});
      assert.equal(await storeAction("status",id),"in_progress","Back must not erase case progress");
      await goto("/campaign/app/play.html?case="+id);
      await page.locator(".evidence-card.inspected").first().waitFor({state:"visible"});
      assert.equal(await page.locator(".evidence-card.inspected").count(),1);
      await page.waitForFunction(() => window.__harnessBackCallbacks?.length === 1, null, {timeout:5000});
    }

    const doc = await (await page.request.get(origin+"/campaign/data/"+id+".json")).json();
    const inspected = new Set();
    async function inspectVisible() {
      const ids = await page.locator(".evidence-grid .evidence-card").evaluateAll(els=>els.map(x=>x.dataset.id));
      for (const evidenceId of ids) {
        if (inspected.has(evidenceId)) continue;
        const card = page.locator('.evidence-card[data-id="'+evidenceId+'"]');
        await card.click();
        await page.locator('button[data-action="close-drawer"]').waitFor({state:"visible"});
        await page.locator('button[data-action="close-drawer"]').click();
        inspected.add(evidenceId);
      }
    }
    await inspectVisible();
    for (const adviser of doc.advisorOrder) {
      await page.locator('button[data-action="consult"][data-id="'+adviser+'"]').click();
      await inspectVisible();
    }
    assert.equal(inspected.size,doc.evidence.length,id+" hidden evidence should be reachable through adviser chain");
    assert.equal(await page.locator(".evidence-grid img").count()>=4,true);
    await page.waitForFunction(() => [...document.querySelectorAll(".evidence-grid img")].every(img => img.complete && img.naturalWidth > 0), null, {timeout:15000});
    const imageState = await page.locator(".evidence-grid img").evaluateAll(images => images.map(img => ({
      complete:img.complete,width:img.naturalWidth
    })));
    assert.equal(imageState.every(x=>x.complete&&x.width>0),true,id+" evidence images load");

    await page.locator('button[data-action="begin-trust"]').click();
    if (doc.trustJudgment.mode==="weigh_each") {
      for (const [advisor,weight] of [["boy","low"],["tooth","high"],["darth","medium"],["donsol","high"]]) {
        await page.locator('button[data-action="set-weight"][data-id="'+advisor+'"][data-weight="'+weight+'"]').click();
      }
    } else {
      for (const advisor of ["tooth","donsol"])
        await page.locator('button[data-action="toggle-trust"][data-id="'+advisor+'"]').click();
    }
    await page.locator('button[data-action="commit-trust"]').click();
    const decision = page.locator('button[data-action="decide"][data-id="'+doc.bestDecisionId+'"]');
    assert.equal(await decision.isEnabled(),true,id+" best decision must unlock from discovered evidence");
    await decision.click();
    await page.locator('button[data-action="review"]').click();
    await page.locator('button[data-action="finish"]').click();
    assert.equal(await storeAction("status",id),"completed",id+" completion persists");
    if(num<5) assert.equal(await storeAction("status","episode-00"+(num+1)),"available");
    const horizontal = await page.evaluate(()=>document.documentElement.scrollWidth > window.innerWidth + 2);
    assert.equal(horizontal,false,id+" should not overflow 390px viewport");
    console.log("PASS browser playthrough "+id+" with "+inspected.size+" evidence records");
  }
  assert.equal(errors.length,0,"page errors: "+errors.join(" | "));
  console.log("PASS later-case QA: legacy Case 2 loads; Case 3–5 paths, artwork, decisions, unlocks, saves and mobile width");
} finally {
  await browser.close();
}
