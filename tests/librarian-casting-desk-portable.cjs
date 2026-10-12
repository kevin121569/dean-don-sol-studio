// Assemble a genuinely offline, no-service Librarian casting tool from approved branch assets.
// The actor image is embedded in the single HTML file. Do not change the originals.
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const folder=path.join(root,'librarian-distance-voice-rehearsal-v1');
const h=fs.readFileSync(path.join(folder,'casting-desk.html'),'utf8');
const css=fs.readFileSync(path.join(folder,'casting-desk.css'),'utf8');
const js=fs.readFileSync(path.join(folder,'casting-desk.js'),'utf8');
const approvedImg=fs.readFileSync(path.join(root,'studio-entrance-preview-v4-1/assets/librarian-seated-close-v2.jpg'));
assert.ok(approvedImg.length>3000,'Approved portrait must be present');
assert.ok(h.includes('<link rel="stylesheet" href="/librarian-distance-voice-rehearsal-v1/casting-desk.css?v=1">'));
assert.ok(h.includes('<script src="/librarian-distance-voice-rehearsal-v1/casting-desk.js?v=1" defer></script>'));
assert.ok(h.includes('<img src="/studio-entrance-preview-v4-1/assets/librarian-seated-close-v2.jpg"'));
assert.ok(!/<\/script/i.test(js),'Avoid escaped closing script in embedded JS');
assert.ok(!/<\/style/i.test(css),'Avoid closing style in embedded CSS');
const packed=h
 .replace('<link rel="icon" href="/favicon.svg" type="image/svg+xml">','')
 .replace('<link rel="stylesheet" href="/librarian-distance-voice-rehearsal-v1/casting-desk.css?v=1">','<style>'+css+'</style>')
 .replace('<script src="/librarian-distance-voice-rehearsal-v1/casting-desk.js?v=1" defer></script>','')
 .replace('</body>','<script>'+js+'</script></body>')
 .replace('/studio-entrance-preview-v4-1/assets/librarian-seated-close-v2.jpg','data:image/jpeg;base64,'+approvedImg.toString('base64'))
 .replaceAll('href="/librarian-distance-voice-rehearsal-v1/"','href="#main"');
assert.ok(!/src="\/|href="\/|src="http|href="http/.test(packed),'Portable HTML must have no external dependencies');
const target=path.join(root,'qa-artifacts','LIBRARIAN_DISTANCE_VOICE_CASTING_DESK_OFFLINE_V1.html');
fs.mkdirSync(path.dirname(target),{recursive:true});
fs.writeFileSync(target,packed);
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const [width,height] of [[1440,900],[390,844]]){
    const page=await browser.newPage({viewport:{width,height},acceptDownloads:true});
    const errors=[],network=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url())});
    await page.goto('file://'+target,{waitUntil:'load'});
    const portrait=await page.locator('.hero img').evaluate(el=>el.complete&&el.naturalWidth>0);
    assert.ok(portrait,'Embedded approved actor appears offline');
    assert.equal(await page.locator('#captionGrid .cue').count(),5);
    assert.ok(await page.locator('#takeA').isVisible());
    assert.equal(await page.locator('#downloadVtt').isDisabled(),true);
    assert.deepEqual(errors,[]);
    assert.deepEqual(network,[]);
    assert.ok(await page.evaluate(w=>document.documentElement.scrollWidth<=w+2,width),'Offline viewport fits');
    console.log('PASS OFFLINE '+width+'x'+height+': embedded original actor, five cues, no external requests and no JS errors');
    await page.close();
  }
 }finally{await browser.close()}
 console.log('READY PORTABLE HTML: '+path.relative(root,target)+' ('+fs.statSync(target).size+' bytes)');
})().catch(e=>{console.error('OFFLINE CASTING DESK FAILURE',e);process.exitCode=1});
