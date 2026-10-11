'use strict';
const {chromium} = require('playwright');
const fs = require('fs');
const assert = require('node:assert/strict');
const base = 'https://theidealabstudio.com/harness-play/kate-cinematic-test-2026-10-11/';
const cases = [
  {file:'episode1.html', intro:'#kate-entry', start:'#kate-enter-sound', test:'#kate-sound-test'},
  {file:'episode2.html', intro:'#kate-opening', start:'#kate-go2', test:'#kate-test2'},
];
(async()=>{
  fs.mkdirSync('qa/kate-visual',{recursive:true});
  const browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const page=await context.newPage(),results=[],errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  try {
    const response=await page.goto(base+'cases.html',{waitUntil:'domcontentloaded',timeout:30000});
    assert.equal(response.status(),200,'case selector HTTP status');
    assert.equal(await page.locator('a[href="episode1.html"]').count(),1);
    assert.equal(await page.locator('a[href="episode2.html"]').count(),1);
    await page.screenshot({path:'qa/kate-visual/menu.png'});
    for(const item of cases){
      const response=await page.goto(base+item.file,{waitUntil:'domcontentloaded',timeout:45000});
      assert.equal(response.status(),200,item.file+' HTTP status');
      await page.locator(item.intro).waitFor({state:'visible',timeout:15000});
      const text=await page.locator(item.intro).innerText();
      assert.match(text,/START WITH SOUND/);
      assert.match(text,/MISSION/);
      const assets=await page.evaluate(()=>({
        background:getComputedStyle(document.querySelector('.scene-image')).backgroundImage.slice(0,80),
        audio:document.getElementById('soundtrack')?.getAttribute('src')?.slice(0,21),
        start:!!document.getElementById('startButton'),
        hasEmbeddedEpisode:!!window.HarnessEpisode?.decisions?.length,
      }));
      assert.match(assets.background,/data:image\/svg/,'embedded graphic');
      assert.match(assets.audio,/data:audio\/wav/,'embedded WAV audio');
      assert(assets.start && assets.hasEmbeddedEpisode,'game engine and original start control');
      await page.screenshot({path:'qa/kate-visual/'+item.file+'.intro.png'});
      await page.locator(item.test).click();
      await page.waitForTimeout(450);
      await page.locator(item.start).click();
      await page.locator('#sceneIsolation').waitFor({state:'visible',timeout:7000});
      const hidden=await page.locator(item.intro).evaluate(el=>el.hidden);
      assert.equal(hidden,true,'overlay dismisses');
      await page.screenshot({path:'qa/kate-visual/'+item.file+'.isolation.png'});
      results.push({case:item.file,status:'PASS',assets});
    }
    assert.equal(errors.length,0,'uncaught JS page errors: '+errors.join(' | '));
    fs.writeFileSync('qa/kate-visual/result.json',JSON.stringify({results,errors},null,2));
    console.log('PASS: live case selector, two illustrated intros, embedded graphics/WAV, tap-to-enter and scene transitions, no uncaught JS errors');
    console.log(JSON.stringify(results,null,2));
  }catch(e){
    fs.writeFileSync('qa/kate-visual/result.json',JSON.stringify({results,errors,failure:String(e.stack||e)},null,2));
    throw e;
  }finally{await browser.close()}
})().catch(err=>{console.error(err);process.exit(1)});
