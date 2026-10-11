// Real Chromium QA of the isolated Librarian voice scene.
// Audio mock tests caption/voice state logic, NOT the quality of a real voice.
'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const root=path.resolve(__dirname,'..');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.mp4':'video/mp4'};
const server=http.createServer((req,res)=>{
  let file;
  try{file=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch(_){res.writeHead(400).end();return}
  if(file.endsWith('/'))file+='index.html';
  const absolute=path.resolve(root,'.'+file);
  if(!absolute.startsWith(root+path.sep)){res.writeHead(403).end();return}
  fs.stat(absolute,(err,stats)=>{
   if(err||!stats.isFile()){res.writeHead(404).end('Missing '+file);return}
   res.setHeader('Content-Type',types[path.extname(absolute)]||'application/octet-stream');
   res.setHeader('Cache-Control','no-store');
   fs.createReadStream(absolute).pipe(res);
  });
});
const source=fs.readFileSync(path.join(root,'studio-entrance-preview-v4-1/entrance.js'),'utf8');
const expected=source.match(/\{id:'distance',[^\n]*?pitch:'([^']+)'/);
assert.ok(expected,'Locked Distance source script must exist');
function makeWav(){
 const rate=8000,n=rate/4;
 const b=Buffer.alloc(44+n*2);
 b.write('RIFF',0);b.writeUInt32LE(36+n*2,4);b.write('WAVEfmt ',8);
 b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);
 b.writeUInt32LE(rate,24);b.writeUInt32LE(rate*2,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);
 b.write('data',36);b.writeUInt32LE(n*2,40);return b;
}
const mockScript=({uk})=>{
 window.__qaSpoken=[];
 const voices=uk?[{name:'QA synthetic UK device voice',lang:'en-GB'}]:[{name:'QA US voice only',lang:'en-US'}];
 class QAUtterance{constructor(text){this.text=text;this.onend=null;this.onerror=null;}}
 Object.defineProperty(window,'SpeechSynthesisUtterance',{configurable:true,value:QAUtterance});
 Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{
   getVoices(){return voices;},
   addEventListener(){},
   cancel(){},
   speak(u){window.__qaSpoken.push(u.text);setTimeout(()=>u.onend&&u.onend(),55);}
 }});
};
async function main(){
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true});
 const dir=path.join(root,'qa-artifacts');fs.mkdirSync(dir,{recursive:true});
 try{
  for(const size of [{width:1440,height:900},{width:390,height:844}]){
   const ctx=await browser.newContext({viewport:size,reducedMotion:'no-preference'});
   await ctx.addInitScript(mockScript,{uk:true});
   const page=await ctx.newPage();const errs=[],outside=[];
   page.on('pageerror',e=>errs.push(e.message));
   page.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(base))outside.push(r.url())});
   await page.goto(base+'/librarian-distance-voice-rehearsal-v1/',{waitUntil:'domcontentloaded'});
   assert.equal(await page.locator('#lines [data-line]').count(),5);
   const text=await page.locator('#lines [data-line]').allTextContents();
   assert.equal(text.map(x=>x.trim()).join(' '),expected[1],'No rewrites to locked book pitch');
   assert.equal(await page.locator('.portrait img').evaluate(e=>e.complete&&e.naturalWidth>0),true,'Original approved actor portrait must load');
   const initial=await page.locator('#voiceStatus').innerText();
   assert.ok(initial.includes('No recording'));
   assert.equal(await page.locator('#localPlayer').isVisible(),false);
   await page.locator('#playAudition').click();
   await page.waitForFunction(()=>window.__qaSpoken?.length===5,null,{timeout:8000});
   assert.deepEqual(await page.evaluate(()=>window.__qaSpoken),text.map(x=>x.trim()),'Sentence cue order follows locked dialogue');
   await page.waitForFunction(()=>document.getElementById('stopAudition').disabled,null,{timeout:8000});
   assert.equal(await page.locator('#lines [data-line]').count(),5,'Transcript persists after audition');
   await page.locator('#localAudio').setInputFiles({name:'qa-only-silent-audio.wav',mimeType:'audio/wav',buffer:makeWav()});
   assert.equal(await page.locator('#localPlayer').isVisible(),true,'local licensed-take slot visible');
   assert.ok((await page.locator('#fileNote').innerText()).includes('No upload'));
   assert.ok((await page.locator('#nowLine').innerText()).includes('not been caption-timed'),'Local take must not pretend sync');
   assert.ok(await page.locator('a[href="/samples/distance.html"]').isVisible(),'Actual original sample link present');
   assert.deepEqual(errs,[],'No JavaScript errors');
   assert.deepEqual(outside,[],'No third-party calls');
   const width=await page.evaluate(()=>document.documentElement.scrollWidth);
   assert.ok(width<=size.width+2,'No horizontal page overflow ('+size.width+' vs '+width+')');
   await page.screenshot({path:path.join(dir,'distance-voice-'+size.width+'.png'),fullPage:true});
   console.log('PASS '+size.width+'x'+size.height+': source lock, original actor, 5 scripted audio cues, local take, transcript, privacy, layout');
   await ctx.close();
  }
  const ctx=await browser.newContext({viewport:{width:390,height:844}});
  await ctx.addInitScript(mockScript,{uk:false});
  const noGB=await ctx.newPage();
  await noGB.goto(base+'/librarian-distance-voice-rehearsal-v1/',{waitUntil:'domcontentloaded'});
  await noGB.locator('#playAudition').click();
  assert.ok((await noGB.locator('#voiceStatus').innerText()).includes('No English (UK) voice'));
  assert.equal(await noGB.locator('#stopAudition').isDisabled(),true);
  assert.deepEqual(await noGB.evaluate(()=>window.__qaSpoken),[]);
  await ctx.close();
  console.log('PASS no-English-UK fallback: full transcript visible, no accent substitution');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
}
main().catch(e=>{console.error('LIBRARIAN DISTANCE VOICE SCENE FAIL',e);process.exitCode=1});
