#!/usr/bin/env node
// Real Chromium UI test, not text matching. Capacitor backButton/exitApp
// callbacks are simulated; a physical Android test is still required.
import assert from "node:assert/strict";
import http from "node:http";
import {readFile, mkdir} from "node:fs/promises";
import {resolve, extname, sep} from "node:path";
import {fileURLToPath} from "node:url";
import puppeteer from "puppeteer-core";

const root=resolve(fileURLToPath(new URL("..",import.meta.url)));
const mime={".html":"text/html;charset=utf-8",".mjs":"application/javascript;charset=utf-8",
  ".js":"application/javascript;charset=utf-8",".json":"application/json;charset=utf-8",
  ".css":"text/css;charset=utf-8",".jpg":"image/jpeg",".jpeg":"image/jpeg",
  ".png":"image/png",".svg":"image/svg+xml",".webp":"image/webp"};
const server=http.createServer(async(req,res)=>{
  try{
    const relative=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
    const absolute=resolve(root,"."+relative);
    if(absolute!==root&&!absolute.startsWith(root+sep)){res.writeHead(403).end();return;}
    const data=await readFile(absolute);
    res.writeHead(200,{"Content-Type":mime[extname(absolute)]??"application/octet-stream","Cache-Control":"no-store"});
    res.end(data);
  }catch{res.writeHead(404).end("Not found");}
});
await new Promise((done,reject)=>{server.once("error",reject);server.listen(0,"127.0.0.1",done)});
const base="http://127.0.0.1:"+server.address().port;
const shots=resolve(root,"h3-browser-evidence");
await mkdir(shots,{recursive:true});
const results=[];
function check(name){results.push({name,status:"pass"});console.log("PASS "+name);}
let browser;
try{
  browser=await puppeteer.launch({
    executablePath:process.env.HARNESS_CHROME||process.env.CHROME_PATH||"/usr/bin/google-chrome",
    headless:true,args:["--no-sandbox","--disable-dev-shm-usage"]
  });
  const page=await browser.newPage();
  await page.setViewport({width:390,height:844,isMobile:true,deviceScaleFactor:1,hasTouch:true});
  const errors=[];
  page.on("pageerror",e=>errors.push(String(e)));
  await page.evaluateOnNewDocument(()=>{
    window.__harnessBack=null;
    window.__harnessExitCount=0;
    window.Capacitor={Plugins:{App:{
      addListener(name,callback){
        if(name==="backButton")window.__harnessBack=callback;
        return Promise.resolve({remove(){}});
      },
      exitApp(){window.__harnessExitCount++;return Promise.resolve();}
    }}};
  });

  await page.goto(base+"/app/play.html?case=episode-005&preview=1",{waitUntil:"domcontentloaded"});
  await page.waitForFunction(()=>document.querySelector("#app")?.textContent.includes("Case locked"),{timeout:25000});
  assert.match(await page.$eval("#app",el=>el.textContent),/Complete the earlier cases first/);
  check("Direct preview URL cannot open locked Case 5");

  await page.goto(base+"/app/index.html",{waitUntil:"domcontentloaded"});
  await page.waitForFunction(()=>!!window.HarnessCampaign?.snapshot,{timeout:25000});
  await page.evaluate(async()=>{
    const manifest=await(await fetch("../campaign.json")).json();
    const {createCampaignStore}=await import("../runtime/campaign-store.mjs");
    const store=createCampaignStore(manifest);
    for(let i=1;i<=3;i++){
      if(!store.completeCase("episode-00"+i,"test_valid_outcome_"+i))
        throw Error("QA prerequisite fixture rejected at "+i);
    }
    if(!store.saveCase("episode-004",{
      episodeId:"episode-004",completed:false,outcomeId:null,sceneId:"investigate"
    }))throw Error("Case 4 protective save rejected");
  });
  await page.reload({waitUntil:"domcontentloaded"});
  await page.waitForFunction(()=>document.querySelector("#case-card-3 .case-action")?.textContent==="PLAY AGAIN");
  const case4Before=await page.evaluate(()=>localStorage.getItem("harness-campaign:v2:case:episode-004"));

  page.once("dialog",dialog=>dialog.dismiss());
  await page.click("#case-card-3 .case-action");
  await page.waitForFunction(()=>location.pathname.endsWith("/app/index.html"));
  assert.equal(await page.$eval("#case-card-3 .case-action",el=>el.textContent),"PLAY AGAIN");
  check("Canceling Play Again preserves the finished case");

  page.once("dialog",dialog=>dialog.accept());
  await page.click("#case-card-3 .case-action");
  await page.waitForFunction(()=>location.pathname.endsWith("/app/play.html")&&document.querySelector(".briefing [data-action='start']"),{timeout:25000});
  assert.equal(await page.evaluate(()=>new URL(location.href).searchParams.get("case")),"episode-003");
  check("Confirmed Play Again begins fresh Case 3");

  await page.click('[data-action="start"]');
  await page.waitForFunction(()=>document.querySelector(".evidence-card"),{timeout:20000});
  const beforeBack=await page.evaluate(async()=>{
    const manifest=await(await fetch("../campaign.json")).json();
    const {createCampaignStore}=await import("../runtime/campaign-store.mjs");
    return createCampaignStore(manifest).loadCase("episode-003")?.session?.sceneId;
  });
  assert.equal(beforeBack,"investigate");
  await page.screenshot({path:resolve(shots,"case3-replay-investigation.png")});
  const handled=await page.evaluate(()=>{
    if(typeof window.__harnessBack!=="function")return false;
    window.__harnessBack();
    return true;
  });
  assert.equal(handled,true);
  await page.waitForFunction(()=>location.pathname.endsWith("/app/index.html")&&!!window.HarnessCampaign?.snapshot,{timeout:15000});
  assert.equal(await page.$eval("#case-card-3 .case-action",el=>el.textContent),"RESUME REPLAY");
  assert.equal(await page.evaluate(()=>localStorage.getItem("harness-campaign:v2:case:episode-004")),case4Before);
  check("Back returns to menu and unfinished replay is offered for Resume");

  assert.equal(await page.evaluate(()=>typeof window.__harnessBack),"function");
  await page.evaluate(()=>window.__harnessBack());
  assert.equal(await page.evaluate(()=>window.__harnessExitCount),1);
  assert.equal(await page.evaluate(()=>location.pathname),"/app/index.html");
  check("Second native Back on menu exits instead of reopening a case");
  await page.screenshot({path:resolve(shots,"menu-resume-replay.png")});

  await page.click("#case-card-3 .case-action");
  await page.waitForFunction(()=>location.pathname.endsWith("/app/play.html")&&!!document.querySelector(".evidence-card"),{timeout:25000});
  const replay=await page.evaluate(async()=>{
    const manifest=await(await fetch("../campaign.json")).json();
    const {createCampaignStore}=await import("../runtime/campaign-store.mjs");
    return createCampaignStore(manifest).loadCase("episode-003")?.session?.sceneId;
  });
  assert.equal(replay,"investigate");
  check("Resume Replay preserves the investigation screen and saved state");

  await page.goBack({waitUntil:"domcontentloaded"});
  await page.waitForFunction(()=>location.pathname.endsWith("/app/index.html"),{timeout:12000});
  check("Browser Back fallback returns to selector instead of a case");
  assert.deepEqual(errors,[]);
  check("No uncaught page JavaScript errors");
  console.log(JSON.stringify({status:"pass",checks:results},null,2));
}catch(e){
  console.error(JSON.stringify({status:"fail",checks:results,error:String(e.stack||e)},null,2));
  process.exitCode=1;
}finally{
  await browser?.close();
  await new Promise(done=>server.close(done));
}
