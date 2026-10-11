// The Librarian — real Chromium regression against the feature branch's own static site.
// Runs offline on localhost; no public-site modification, API keys, telemetry, or visitor data.
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.mp4':'video/mp4','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{
  let name;
  try{name=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch(_){res.writeHead(400).end();return}
  if(name.endsWith('/'))name+='index.html';
  const absolute=path.resolve(root,'.'+name);
  if(absolute!==root&&!absolute.startsWith(root+path.sep)){res.writeHead(403).end();return}
  fs.stat(absolute,(err,stat)=>{
    if(err||!stat.isFile()){res.writeHead(404).end('File unavailable: '+name);return}
    res.setHeader('Content-Type',mime[path.extname(absolute)]||'application/octet-stream');
    res.setHeader('Cache-Control','no-store');
    fs.createReadStream(absolute).pipe(res);
  });
});
function check(expression,message){assert.ok(expression,message)}
async function reader(page,title){
  await page.locator('#readingDesk').waitFor({state:'visible'});
  await page.frameLocator('#readerFrame').locator('main').first().waitFor({state:'visible',timeout:12000});
  check((await page.locator('#readingDeskTitle').innerText()).includes(title),'Reader must name the actual book');
  const body=await page.frameLocator('#readerFrame').locator('main').first().innerText();
  check(body.trim().length>80,'Reader needs substantive actual original excerpt');
}
async function goAdult(page,base){
  await page.goto(base+'/librarian-welcome-preview-v1/',{waitUntil:'domcontentloaded'});
  const link=page.locator('a[href*="?arrival=seated#adult"]');
  assert.equal(await link.count(),1,'First Words must use seamless handoff');
  await link.click();
  await page.locator('#adultWorld').waitFor({state:'visible'});
  check(await page.locator('#libraryArrivalStill').isVisible(),'No second walking entrance on welcome continuation');
  assert.equal(await page.locator('.reading-journey-note').count(),1,'New branch component must load');
}
async function testJourney(page,base,viewport){
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await goAdult(page,base);
  // Recommendation -> original pitch -> actual distance sample -> pitch -> new contextual return.
  await page.locator('[data-mood="mystery"]').click();
  await page.locator('#recommendedBooks [data-recommend-book="distance"]').click();
  await page.locator('#bookDialog').waitFor({state:'visible'});
  await page.locator('#pitchReader').click();
  await reader(page,'The Distance Between Thoughts');
  await page.locator('#closeReadingDesk').click();
  assert.equal(await page.locator('#bookDialog').evaluate(el=>el.open),true,'original book pitch must survive nested reader');
  assert.equal(await page.locator('.reading-journey-note').isVisible(),false,'wait until modal pitch closes');
  await page.locator('#pitchClose').click();
  const note=page.locator('.reading-journey-note');
  await note.waitFor({state:'visible'});
  check((await note.innerText()).includes('What God Could Not Know'),'thoughtful second-book recommendation');
  assert.equal(await note.locator('button').count(),2,'invitation and dismiss affordances');

  await page.locator('#readingJourneyNext').click();
  await page.locator('#bookDialog').waitFor({state:'visible'});
  assert.equal(await page.locator('#pitchTitle').innerText(),'What God Could Not Know');
  await page.locator('#pitchReader').click();
  await reader(page,'What God Could Not Know');
  await page.locator('#readerFooterClose').click();
  await page.locator('#pitchClose').click();
  assert.equal(await note.isVisible(),false,'do not recommend Distance again if already opened this visit');

  // Direct shelf selection should use the very same introduction and reader.
  await page.locator('#adultBooks [data-book="harness"]').click();
  await page.locator('#pitchReader').click();
  await reader(page,'The Harness');
  await page.locator('#closeReadingDesk').click();
  await page.locator('#pitchClose').click();
  await note.waitFor({state:'visible'});
  check((await note.innerText()).includes('Forty Bales'),'pairing for direct shelf visit');
  await page.locator('#readingJourneyDismiss').click();
  assert.equal(await note.isVisible(),false,'Not now dismisses without forcing a choice');

  // A direct sample anchor also passes through the existing Reader.
  await page.locator('#adultBooks a[href="/samples/memory.html"]').click();
  await reader(page,'The Last Memory');
  await page.locator('#closeReadingDesk').click();
  await note.waitFor({state:'visible'});
  check((await note.innerText()).includes('Stardust'),'direct sample link follows existing Reader');
  await page.locator('#adultWorld [data-enter="kids"]').click();
  assert.equal(await note.isVisible(),false,'adult suggestion disappears in the kids world');
  await page.locator('#kidsWorld').waitFor({state:'visible'});
  check(errors.length===0,'no JS exceptions: '+errors.join(' | '));
  const docWidth=await page.evaluate(()=>document.documentElement.scrollWidth);
  assert.ok(docWidth<=viewport.width+2,'No horizontal page overflow at '+viewport.width+'px: '+docWidth);
  console.log('PASS '+viewport.width+'x'+viewport.height+': one arrival, original excerpts, 3 follow-ups, nested modal, no duplicate pitch, dismiss, kids world, zero errors');
}
async function testFreshPairs(browser,base) {
 const expected={forty:'The Harness',stardust:'The Last Memory',fight:'When Fighting Stops Working',stops:'Fight Your Way Through'};
 for(const [id,next] of Object.entries(expected)){
  const page=await browser.newPage({viewport:{width:1280,height:800},reducedMotion:'reduce'});
  try{
   await page.goto(base+'/studio-entrance-preview-v4-1/#adult',{waitUntil:'domcontentloaded'});
   await page.locator('#adultWorld').waitFor({state:'visible'});
   await page.locator('#adultBooks [data-book="'+id+'"]').click();
   await page.locator('#pitchReader').click();
   await page.locator('#readingDesk').waitFor({state:'visible'});
   await page.locator('#closeReadingDesk').click();
   await page.locator('#pitchClose').click();
   const note=page.locator('.reading-journey-note');await note.waitFor({state:'visible'});
   check((await note.innerText()).includes(next),'expected '+id+' → '+next);
  }finally{await page.close()}
 }
 console.log('PASS other pairings: Forty Bales, Stardust, Fight Your Way Through, When Fighting Stops Working');
}
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true});
 try{
  for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
   const page=await browser.newPage({viewport,reducedMotion:'no-preference'});
   try{await testJourney(page,base,viewport)}finally{await page.close()}
  }
  await testFreshPairs(browser,base);
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
})().catch(e=>{console.error('READING JOURNEY BROWSER QA FAIL',e);process.exitCode=1});
