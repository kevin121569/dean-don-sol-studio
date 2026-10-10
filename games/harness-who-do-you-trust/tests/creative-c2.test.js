import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createAudioDirector,DEFAULT_AUDIO_PREFS} from '../creative/audio.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=x=>fs.readFileSync(path.join(root,x),'utf8');
const html=read('index.html'),css=read('css/game.css'),intro=read('creative/intro.js');
test('C2 immersive original cover art exists, with a layered inward zoom and visible title CTA',()=>{
 const file=path.join(root,'creative/server4-cover.webp');
 assert(fs.statSync(file).size>50000);
 assert.match(css,/server4-cover\.webp/);
 assert.match(css,/@keyframes sinkIn\{from\{transform:scale\(1\.09\)\}to\{transform:scale\(1\)\}/);
 assert.match(html,/THE<\s*br>HARNESS/);
 assert.match(html,/id="introNext">Enter Server 4/);
});
test('C2 static instructions can be read indefinitely; no timer, 13-frame progress, or auto-advance',()=>{
 assert.match(html,/id="introGuide" hidden/);
 for(const x of ['Inspect the clues','Ask the four advisers','Make the call','Begin investigation','Back to title'])assert(html.includes(x));
 assert.match(html,/Read at your own pace/);
 assert(!/setTimeout/.test(intro));
 assert(!/auto-advance/.test(intro));
 assert.match(intro,/index\+\+; render\(\)/);
});
test('C2 sound defaults on, remains gesture locked, and offers a mute plus Test sound',()=>{
 assert.equal(DEFAULT_AUDIO_PREFS.enabled,true);
 assert.match(html,/id="introMuteToggle"/);
 assert.match(html,/id="introTestSound"/);
 assert.match(html,/id="audioTest"/);
 assert.match(html,/id="audioState"/);
 let created=0;
 class WebAudio{constructor(){created++;this.state='running';this.destination={};this.currentTime=0;}
   createGain(){return {gain:{value:0,setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(n){return n}}}
   createOscillator(){return {frequency:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(n){return n},start(){},stop(){}}}
   resume(){this.state='running'} }
 const audio=createAudioDirector({window:{AudioContext:WebAudio,setTimeout(){return 1},clearTimeout(){}},storage:null});
 assert.equal(created,0);assert.equal(audio.cue('reveal'),false);
 assert.match(audio.status(),/Tap Enter Server 4/);
 assert.equal(audio.unlock(),true);assert.equal(created,1);assert.equal(audio.cue('reveal'),true);
 audio.setPrefs({enabled:false});assert.equal(audio.cue('reveal'),false);
});
test('C2 leaves core engine, state, validation, advice and telemetry byte-for-byte unchanged',()=>{
 const pinned={
  'js/engine.js':'7d543aa191870bd7c6ea978bdbb7df5f23bb2aec735ab35cde5cd77977c7734d',
  'js/state.js':'ce323ada229fa874f4e5559cc3345406e631a708dc1da341fe946cd84b97a670',
  'js/content.js':'ff68de6b9c5d61527ed5681b74fde2308ecfd585c1c2bab847ffa85b67dde26b',
  'js/advice.js':'e9afc25309491640ce4ab217467adc94d9edc56cebb6726425b1a13ea85515cd',
  'js/telemetry.js':'84c379e934b610ee47dcb08c8280173526de405c8f5386d717cade36822a8164',
 };
 for(const [file,sha] of Object.entries(pinned))
   assert.equal(crypto.createHash('sha256').update(read(file).replace(/\r\n/g,'\n')).digest('hex'),sha,file);
});
