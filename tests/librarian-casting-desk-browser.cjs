// Feature-branch Chromium QA for the original Librarian A/B sound+caption desk.
// Synthetic silence is NEVER a generated narrator or commercially usable audio.
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html;charset=utf-8','.css':'text/css;charset=utf-8','.js':'text/javascript;charset=utf-8','.svg':'image/svg+xml','.jpg':'image/jpeg','.jpeg':'image/jpeg'};
const server=http.createServer((req,res)=>{
 let p;try{p=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch(_){res.writeHead(400).end();return}
 if(p.endsWith('/'))p+='index.html';
 const resolved=path.resolve(root,'.'+p);
 if(!resolved.startsWith(root+path.sep)){res.writeHead(403).end();return}
 fs.stat(resolved,(err,s)=>{
  if(err||!s.isFile()){res.writeHead(404).end('missing '+p);return}
  res.setHeader('Content-Type',mime[path.extname(resolved)]||'application/octet-stream');
  fs.createReadStream(resolved).pipe(res);
 });
});
function wav(secs){
 const rate=8000,n=Math.round(rate*secs);
 const b=Buffer.alloc(44+n*2);
 b.write('RIFF',0);b.writeUInt32LE(36+n*2,4);b.write('WAVEfmt ',8);
 b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);
 b.writeUInt32LE(rate,24);b.writeUInt32LE(rate*2,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);
 b.write('data',36);b.writeUInt32LE(n*2,40);return b;
}
async function setCues(page,offset=0){
 for(let i=0;i<5;i++){
  await page.locator('[data-cue="'+i+'"] .start').fill(String(i+offset));
  await page.locator('[data-cue="'+i+'"] .end').fill(String(i+1+offset));
 }
}
async function check(base,browser,width,height){
 const ctx=await browser.newContext({viewport:{width,height},acceptDownloads:true,reducedMotion:'reduce'});
 const page=await ctx.newPage();const problems=[],outside=[];
 page.on('pageerror',e=>problems.push(e.message));
 page.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(base))outside.push(r.url())});
 await page.goto(base+'/librarian-distance-voice-rehearsal-v1/casting-desk.html',{waitUntil:'domcontentloaded'});
 assert.equal(await page.locator('.cue').count(),5,'exactly five cue rows');
 const source=fs.readFileSync(path.join(root,'studio-entrance-preview-v4-1/entrance.js'),'utf8');
 const locked=source.match(/\{id:'distance',[^\n]*?pitch:'([^']+)'/);
 assert.ok(locked,'approved source available');
 const text=await page.locator('.cue p').allTextContents();
 assert.equal(text.map(x=>x.replace(/^\s*\d+\s*/,'').trim()).join(' '),locked[1],'original five sentences unchanged');
 assert.equal(await page.locator('.hero img').evaluate(x=>x.complete&&x.naturalWidth>0),true,'original actor asset loads');
 assert.equal(await page.locator('#downloadVtt').isDisabled(),true,'no captions before recording');
 await page.locator('#takeA').setInputFiles({name:'QA-ONLY-A-SILENT.wav',mimeType:'audio/wav',buffer:wav(6)});
 await page.locator('#audioA').waitFor({state:'visible'});
 await page.waitForFunction(()=>/6.00/.test(document.getElementById('audioStatus').textContent),null,{timeout:10000});
 await page.locator('[data-cue="0"] .start').fill('0');await page.locator('[data-cue="0"] .end').fill('1');
 await page.locator('[data-cue="1"] .start').fill('.8');await page.locator('[data-cue="1"] .end').fill('2');
 for(let i=2;i<5;i++){await page.locator('[data-cue="'+i+'"] .start').fill(String(i));await page.locator('[data-cue="'+i+'"] .end').fill(String(i+1));}
 await page.locator('#validate').click();
 assert.equal(await page.locator('#downloadVtt').isDisabled(),true,'overlapping captions must fail');
 assert.match(await page.locator('#captionStatus').innerText(),/before the previous line ends/i);
 await page.locator('[data-cue="1"] .start').fill('1');
 await page.locator('#validate').click();
 assert.equal(await page.locator('#downloadVtt').isEnabled(),true);
 const vttPromise=page.waitForEvent('download');
 await page.locator('#downloadVtt').click();
 const download=await vttPromise,vtt=fs.readFileSync(await download.path(),'utf8');
 assert.ok(vtt.startsWith('WEBVTT'),'download must be WebVTT');
 assert.ok(vtt.includes('00:00:00.000 --> 00:00:01.000'),'caption time syntax');
 assert.ok(vtt.includes(locked[1].split('. ')[0]+'.'),'first source sentence');
 assert.equal((vtt.match(/ --> /g)||[]).length,5,'five real cue ranges');
 await page.locator('#checks [data-check="accent"]').check();
 await page.locator('#notes').fill('QA-only rehearsal. No narrator has been recorded or approved.');
 await page.locator('[name="chosen"][value="B"]').check();
 assert.equal(await page.locator('#downloadVtt').isDisabled(),true,'B has no borrowed timestamps');
 assert.equal(await page.locator('#checks [data-check="accent"]').isChecked(),false,'attestation separate per take');
 await page.locator('#takeB').setInputFiles({name:'QA-ONLY-B-SILENT.wav',mimeType:'audio/wav',buffer:wav(6.5)});
 await page.locator('#audioB').waitFor({state:'visible'});
 await page.locator('#validate').click();
 assert.equal(await page.locator('#downloadVtt').isDisabled(),true,'cannot export blank timings');
 await page.locator('[name="chosen"][value="A"]').check();
 assert.equal(await page.locator('[data-cue="0"] .end').inputValue(),'1','A timing remains in page');
 assert.equal(await page.locator('#checks [data-check="accent"]').isChecked(),true,'A manual mark restored');
 assert.equal(await page.locator('#notes').inputValue(),'QA-only rehearsal. No narrator has been recorded or approved.');
 await page.locator('#validate').click();
 assert.equal(await page.locator('#downloadVtt').isEnabled(),true);
 const reportPromise=page.waitForEvent('download');
 await page.locator('#downloadReport').click();
 const report=JSON.parse(fs.readFileSync(await (await reportPromise).path(),'utf8'));
 assert.equal(report.take,'A');
 assert.equal(report.status,'DRAFT — NOT LICENSED OR AUTHORIZED FOR RELEASE');
 assert.equal(report.caption_structure_valid,true);
 assert.equal(report.manual_review_completed,false);
 assert.equal(report.voice_rights_and_synced_captions_verified_by_studio,false);
 assert.equal(report.file.sha256.length,64,'crypto fingerprint recorded');
 assert.ok(report.notes.includes('No narrator'));
 assert.equal(report.locked_dialogue,locked[1],'report ties to approved source');
 await page.screenshot({path:path.join(root,'qa-artifacts','distance-casting-'+width+'.png'),fullPage:true});
 const pageWidth=await page.evaluate(()=>document.documentElement.scrollWidth);
 assert.ok(pageWidth<=width+2,'no horizontal overflow '+width+' / '+pageWidth);
 assert.deepEqual(problems,[],'no page exceptions');
 assert.deepEqual(outside,[],'no external HTTP(S) traffic');
 console.log('PASS '+width+'x'+height+' exact text, actor, local A/B audio, SHA, five manual VTT cues, invalid timing blocked, draft report, privacy');
 await ctx.close();
}
(async()=>{
 const output=path.join(root,'qa-artifacts');fs.mkdirSync(output,{recursive:true});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true});
 try{
  for(const [w,h] of [[1440,900],[390,844]])await check('http://127.0.0.1:'+server.address().port,browser,w,h);
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
})().catch(e=>{console.error('LIBRARIAN CASTING DESK QA FAIL',e);process.exitCode=1});
