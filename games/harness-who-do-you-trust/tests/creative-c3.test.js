import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createAudioDirector} from '../creative/audio.js';
import {createIntro} from '../creative/intro.js';
import {createCreativeLayer} from '../creative/creative.js';
import {ACTIONS, isHybridUnlocked} from '../js/engine.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const introSource=fs.readFileSync(path.join(root,'creative/intro.js'),'utf8');
const creativeSource=fs.readFileSync(path.join(root,'creative/creative.js'),'utf8');
const json=JSON.parse(fs.readFileSync(path.join(root,'creative/intro-script.json'),'utf8'));
const episode=JSON.parse(fs.readFileSync(path.join(root,'data/episode-001.json'),'utf8'));
function fakeDOM(){
 const els={};
 const make=id=>({id,hidden:false,style:{},dataset:{},textContent:'',attrs:{},listeners:{},open:false,
  setAttribute(k,v){this.attrs[k]=v},addEventListener(k,fn){this.listeners[k]=fn},
  showModal(){this.open=true},close(){this.open=false},focus(){this.focused=true}});
 for(const id of ['introDialog','introCover','introStory','introGuide','introSubtitle','introProgress','introAudioStatus','introStoryAudioStatus','introGuideAudioStatus','introMuteToggle','introNext','storyNext','storyBack','storyEyebrow','storyTitle','storySystem','storyLead','storyMoment','storyQuote','storyWho','storyStep','introBegin','introBack','introTestSound','scene-title'])els[id]=make(id);
 return {els,doc:{getElementById:id=>els[id]??null,addEventListener(){}}};
}
test('C3: saved decision or investigation opens cover on every cold boot, with no state change',async()=>{
 const {els,doc}=fakeDOM();let settings={introSeen:true};let saved={sceneId:'investigate'};
 const fakeAudio={prefs:{enabled:true},unlock(){},testSound(){},setMusic(){},stopSpeech(){},status(){return 'Music: ready'}};
 const layer=createCreativeLayer({document:doc,window:{},storage:null,episode,ACTIONS,isHybridUnlocked,getState:()=>saved,
   reducedMotion:()=>true,settings:{read:()=>settings,write:x=>{settings=x}},loadScript:async()=>json});
 await layer.boot();assert.equal(els.introDialog.open,true);assert.equal(layer.intro.index,0);
 layer.intro.next();layer.intro.next();layer.intro.next();
 assert.equal(els.introBegin.textContent,'Continue your investigation →');
 layer.intro.next();assert.equal(saved.sceneId,'investigate');assert.equal(els.introDialog.open,false);
 await layer.boot();assert.equal(els.introDialog.open,true);assert.equal(layer.intro.index,0);
});
test('C3: cinematic story contains two player-controlled stakes scenes and hides spoilers',()=>{
 for(const id of ['introStory','storyTitle','storyLead','storyMoment','storyQuote','storyNext','storyBack']) assert(html.includes(`id="${id}"`));
 for(const s of ['THE ALARM','THE STAKES','Security suspects a breach','none can see the whole picture'])assert(introSource.includes(s));
 assert(!/setTimeout/.test(introSource),'story contains no timer');
 assert(!/six minutes|clock drift|time difference/i.test(introSource),'no pre-discovery clock spoiler');
 assert(creativeSource.includes('if (intro?.available) intro.open()'));
});
test('C3: packaged local music and confirmation exist with valid WAV headers',()=>{
 for(const [name,min] of [['server4-atmosphere.wav',500000],['server4-confirm.wav',40000]]){
  const b=fs.readFileSync(path.join(root,'creative/audio',name));assert(b.length>min);assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WAVE');
 }
});
test('C3: HTML media starts from gesture, handles playback failures and mute without altering saves',async()=>{
 const log=[];class Media {constructor(uri){log.push(['created',uri]);this.uri=uri;this.volume=0;this.loop=false;this.currentTime=0;this.listeners={}}
 addEventListener(k,fn){this.listeners[k]=fn}play(){log.push(['played',this.uri]);return Promise.resolve()}pause(){log.push(['paused',this.uri])}}
 const audio=createAudioDirector({window:{Audio:Media},storage:{getItem(){return null},setItem(){}}});
 assert(!log.length);assert.equal(audio.unlock(),true);assert.equal(audio.testSound(),true);audio.setMusic(true);await new Promise(r=>setImmediate(r));
 assert(log.some(x=>x[0]==='played'&&x[1].includes('atmosphere')));
 assert(log.some(x=>x[0]==='played'&&x[1].includes('confirm')));
 assert.match(audio.status(),/Music: playing/);
 audio.setPrefs({enabled:false});assert(log.some(x=>x[0]==='paused'));assert.match(audio.status(),/Sound muted/);
});
