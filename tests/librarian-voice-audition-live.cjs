// Live HTTPS read-only QA for the original Librarian voice casting room.
// The uploaded WAV is a synthetic 1-second test tone generated in-memory, NOT a character voice.
const { chromium }=require('playwright');
const assert=require('node:assert/strict');
function testWav(){
 const sr=24000,n=24000,b=Buffer.alloc(44+n*2);
 b.write('RIFF',0);b.writeUInt32LE(36+n*2,4);b.write('WAVE',8);b.write('fmt ',12);
 b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);
 b.writeUInt32LE(sr,24);b.writeUInt32LE(sr*2,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);
 b.write('data',36);b.writeUInt32LE(n*2,40);
 for(let i=0;i<n;i++)b.writeInt16LE(Math.round(2000*Math.sin(i*2*Math.PI*440/sr)),44+i*2);
 return b;
}
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
   const page=await browser.newPage({viewport, reducedMotion:'reduce'});
   const errors=[];page.on('pageerror',e=>errors.push(String(e)));
   await page.goto('https://theidealabstudio.com/librarian-voice-audition-v1/',{waitUntil:'networkidle',timeout:45000});
   assert.equal(await page.locator('h1').count(),1);
   assert.ok((await page.locator('h1').innerText()).includes('a voice.'));
   assert.ok((await page.locator('#auditionText').innerText()).startsWith('Ah, welcome.'));
   assert.ok(await page.locator('#playA').isDisabled());
   const actor=page.locator('.portrait img');
   assert.equal(await actor.evaluate(e=>e.complete&&e.naturalWidth>0),true,'actor poster must load');
   await page.locator('#takeA').setInputFiles({name:'QA-not-a-voice.wav',mimeType:'audio/wav',buffer:testWav()});
   assert.ok(await page.locator('#playA').isEnabled());
   await page.locator('#playA').click();
   await page.waitForFunction('document.querySelector("#auditionPlayer").duration>0');
   await page.locator('input[name="script"][value="harness"]').check();
   assert.ok((await page.locator('#auditionText').innerText()).includes('Four very different artificial minds'));
   assert.ok(await page.locator('#playA').isDisabled(),'welcome audio should not mislabel harness');
   await page.locator('input[name="script"][value="welcome"]').check();
   assert.ok(await page.locator('#playA').isEnabled(),'welcome audio restored');
   assert.equal(await page.evaluate('document.documentElement.scrollWidth<=innerWidth'),true,'no horizontal overflow');
   assert.deepEqual(errors,[],'no page JS errors');
   console.log('PASS live '+viewport.width+'x'+viewport.height+': real actor image, scripts, local test WAV playback, separate audition slots, no upload');
   await page.close();
  }
 }finally{await browser.close()}
})().catch(e=>{console.error('LIVE VOICE BOOTH QA FAIL:',e);process.exit(1)});
