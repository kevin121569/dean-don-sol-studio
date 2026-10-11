// Reusable live HTTPS continuity regression for The Librarian. No credentials or writes.
// The approved eight-second entrance plays only once when the visitor comes from First Words.
const { chromium }=require('playwright'), assert=require('node:assert/strict');
const base='https://theidealabstudio.com';
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
   const page=await browser.newPage({viewport,reducedMotion:'no-preference'});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+'/librarian-welcome-preview-v1/',{waitUntil:'domcontentloaded'});
   const link=page.locator('a[href*="?arrival=seated#adult"]');
   assert.equal(await link.count(),1,'First Words must use a continuation link');
   await link.click();
   await page.locator('#adultWorld').waitFor({state:'visible'});
   assert.equal(await page.locator('#libraryArrivalStill').isVisible(),true,
      'returning from first greeting must show seated Librarian rather than a second entrance');
   assert.equal(await page.locator('#libraryFilm').evaluate(el=>el.paused),true,
      'no repeated autoplay on a continuation');
   assert.ok((await page.locator('#stageCue').innerText()).includes('Welcome back'));
   const still=page.locator('#libraryArrivalStill');
   assert.equal(await still.evaluate(el=>el.complete&&el.naturalWidth>0),true,
      'the approved seated portrait loads');
   await page.locator('#replayFilm').click();
   assert.equal(await still.isVisible(),false,'visitor can explicitly replay entrance');
   await page.locator('[data-mood="danger"]').click();
   await page.locator('#recommendedBooks [data-recommend-book="harness"]').click();
   await page.locator('#bookDialog').waitFor({state:'visible'});
   assert.ok((await page.locator('#pitchText').innerText()).includes('Four very different artificial minds'));
   await page.locator('#pitchReader').click();
   const frame=page.frameLocator('#readerFrame');
   await frame.locator('main').getByText('Black.',{exact:true}).first().waitFor({state:'visible'});
   await page.locator('#closeReadingDesk').click();
   assert.equal(await page.locator('#bookDialog').evaluate(el=>el.open),true);
   await page.locator('#pitchClose').click();
   await page.goto(base+'/studio-entrance-preview-v4-1/#adult',{waitUntil:'domcontentloaded'});
   await page.locator('#adultWorld').waitFor({state:'visible'});
   assert.equal(await page.locator('#libraryArrivalStill').isVisible(),false,
      'direct adult entrance must retain original cinematic film');
   assert.deepEqual(errors,[],'web page JavaScript errors');
   console.log('PASS '+viewport.width+'x'+viewport.height+': one arrival, seated carryover, replay enabled, original Harness excerpt, direct-entrance film preserved');
   await page.close();
  }
 } finally {await browser.close();}
})().catch(e=>{console.error('SINGLE-ENTRANCE REGRESSION FAIL',e);process.exit(1)});
