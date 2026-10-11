// Read-only LIVE HTTPS test of first-words scene. Uses synthetic audio test tone, NOT an actor voice.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const site='https://theidealabstudio.com/librarian-welcome-preview-v1/';
function tone(){
 const n=24000,sr=24000,b=Buffer.alloc(44+n*2);
 b.write('RIFF',0);b.writeUInt32LE(36+n*2,4);b.write('WAVE',8);b.write('fmt ',12);
 b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);
 b.writeUInt32LE(sr,24);b.writeUInt32LE(sr*2,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);
 b.write('data',36);b.writeUInt32LE(n*2,40);
 for(let i=0;i<n;i++)b.writeInt16LE(Math.round(2000*Math.sin(i*2*Math.PI*440/sr)),44+2*i);
 return b;
}
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const vp of [{width:1440,height:900},{width:390,height:844}]){
   const page=await browser.newPage({viewport:vp});
   const errors=[];page.on('pageerror',e=>errors.push(String(e)));
   await page.goto(site,{waitUntil:'domcontentloaded',timeout:45000});
   await page.locator('#seatedPortrait').waitFor({state:'attached'});
   assert.equal(await page.locator('#seatedPortrait').evaluate(el=>el.complete&&el.naturalWidth>0),true,'real approved poster failed');
   assert.ok((await page.locator('#welcomeScript').innerText()).startsWith("Ah, welcome. Come in, won't you?"));
   assert.equal(await page.locator('#voicePlay').isDisabled(),true);
   if(vp.width>500){
    await page.locator('#beginFilm').click();
    await page.waitForFunction(()=>document.querySelector('#entranceFilm').currentTime>.3,null,{timeout:15000});
    await page.waitForFunction(()=>!document.querySelector('#seatedPortrait').hidden,null,{timeout:15000});
   }else{
    await page.locator('#seatedButton').click();
    await page.locator('#seatedPortrait').waitFor({state:'visible'});
   }
   assert.equal(await page.locator('#voicePlay').isEnabled(),true);
   await page.locator('#voiceMode').selectOption('file');
   await page.locator('#voicePlay').click();
   assert.ok((await page.locator('#voiceStatus').innerText()).includes('Choose a WAV'),'no-file fallback absent');
   await page.locator('#voiceFile').setInputFiles({name:'TONE-NOT-REAL-VOICE.wav',mimeType:'audio/wav',buffer:tone()});
   await page.locator('#voicePlay').click();
   await page.waitForFunction(()=>document.querySelector('#voiceStatus').textContent.includes('LOCAL audio'),{timeout:4000});
   await page.locator('#voiceStop').click();
   await page.locator('#voiceMode').selectOption('device');
   await page.locator('#voicePlay').click();
   const msg=await page.locator('#voiceStatus').innerText();
   assert.ok(/English|voice|speech/i.test(msg));
   assert.equal(await page.locator('a[href="/studio-entrance-preview-v4-1/#adult"]').count(),1);
   assert.equal(await page.locator('a[href="/studio-entrance-preview-v4-1/#kids"]').count(),1);
   assert.equal(await page.evaluate('document.documentElement.scrollWidth <= innerWidth'),true);
   assert.deepEqual(errors,[],'page script exceptions: '+errors.join(','));
   console.log('PASS REAL HTTPS '+vp.width+'x'+vp.height+': original actor poster, '+(vp.width>500?'real 8s video progression':'seated shortcut')+', original welcome, local test-WAV play/stop, English voice fallback, destinations');
   await page.close();
  }
 }finally{await browser.close()}
})().catch(e=>{console.error('LIBRARIAN FIRST WORDS QA FAIL',e);process.exit(1)});
