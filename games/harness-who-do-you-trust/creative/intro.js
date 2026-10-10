// C2 first-play experience: a static, cinematic title followed by readable instructions.
// No automatic pages, timers, countdown or state mutation. Native audio is only unlocked on a real tap.
export const INTRO_BEATS = Object.freeze(['grid', 'pulse', 'callout', 'question', 'stakes', 'world', 'boy', 'tooth', 'luke', 'donsol', 'mission', 'final']);
export const INTRO_LIMITS = Object.freeze({maxLines: 20, maxTextLength: 280, minDurationMs: 1500, maxDurationMs: 12000});
export function validateIntroScript(script) {
  const problems=[];
  if(!script||typeof script!=='object'||Array.isArray(script))return ['intro script is not an object'];
  for(const k of ['id','title','kicker'])if(typeof script[k]!=='string'||!script[k].trim()||script[k].length>80)problems.push(`intro ${k} must be a non-empty string of at most 80 characters`);
  const lines=script.lines;
  if(!Array.isArray(lines)||!lines.length||lines.length>INTRO_LIMITS.maxLines)return [...problems,`intro lines must be an array of 1–${INTRO_LIMITS.maxLines}`];
  const ids=new Set();
  lines.forEach((l,i)=>{const at=`intro line ${i}`;if(!l||typeof l!=='object'){problems.push(`${at} must be an object`);return;}
    if(typeof l.id!=='string'||!/^[a-z][a-z0-9_-]{0,31}$/.test(l.id)||ids.has(l.id))problems.push(`${at}: id must be a unique short identifier`);
    ids.add(l.id);if(!INTRO_BEATS.includes(l.beat))problems.push(`${at}: unknown beat`);
    if(typeof l.text!=='string'||!l.text.trim()||l.text.length>INTRO_LIMITS.maxTextLength)problems.push(`${at}: text (the subtitle) must be 1–${INTRO_LIMITS.maxTextLength} characters`);
    if(!Number.isInteger(l.durationMs)||l.durationMs<INTRO_LIMITS.minDurationMs||l.durationMs>INTRO_LIMITS.maxDurationMs)problems.push(`${at}: durationMs out of range`);
  });return problems;
}
export function createIntro({document:doc,window:win,audio,script,reducedMotion,onClose,onAudioChange}){
  const dialog=doc?.getElementById?.('introDialog'),cover=doc?.getElementById?.('introCover'),guide=doc?.getElementById?.('introGuide');
  if(!dialog||!cover||!guide||!script||validateIntroScript(script).length)return {available:false,open(){return false},close(){},next(){},get index(){return -1},get isOpen(){return false}};
  const el=id=>doc.getElementById(id);
  let isOpen=false,index=-1;
  const status=()=>{const t=audio?.status?.()??'Sound unavailable';for(const id of ['introAudioStatus','introGuideAudioStatus']){if(el(id))el(id).textContent=t;}};
  const mute=()=>{const on=Boolean(audio?.prefs?.enabled);if(el('introMuteToggle')){el('introMuteToggle').textContent=on?'Sound on · Tap to mute':'Sound off · Tap to enable';el('introMuteToggle').setAttribute('aria-pressed',String(!on));}};
  const render=()=>{dialog.dataset.beat=index===0?'cover':'instructions';cover.hidden=index!==0;guide.hidden=index!==1;
    if(el('introSubtitle'))el('introSubtitle').textContent=index===0?'Episode 1. Tap Enter Server 4 to begin.':'Mission briefing. Read at your own pace.';
    if(el('introProgress'))el('introProgress').textContent='';mute();status();};
  const controller={available:true,open(){isOpen=true;index=0;try{dialog.showModal()}catch{dialog.setAttribute('open','')}render();el('introNext')?.focus?.();return true;},
    close(how='skip'){if(!isOpen)return;isOpen=false;audio?.stopSpeech?.();if(how==='skip')audio?.setMusic?.(false);try{dialog.close()}catch{dialog.removeAttribute('open')}onClose?.(how);},
    next(){if(!isOpen)return;if(index===0){if(audio?.prefs?.enabled){audio?.unlock?.();audio?.cue?.('reveal');audio?.setMusic?.(true);}index=1;render();el('introBegin')?.focus?.();}
      else controller.close('finished');},
    get index(){return index},get isOpen(){return isOpen}};
  el('introNext')?.addEventListener('click',()=>controller.next());
  el('introBegin')?.addEventListener('click',()=>controller.next());
  el('introBack')?.addEventListener('click',()=>{index=0;render();el('introNext')?.focus?.()});
  el('introMuteToggle')?.addEventListener('click',()=>{const enabled=!audio.prefs.enabled;audio.setPrefs({enabled});if(enabled){audio.unlock();audio.cue('reveal');if(index===1)audio.setMusic(true);}mute();status();onAudioChange?.();});
  el('introTestSound')?.addEventListener('click',()=>{audio?.unlock?.();audio?.cue?.('reveal');audio?.setMusic?.(audio?.prefs?.enabled);status();});
  dialog.addEventListener('cancel',e=>{e.preventDefault();controller.close('skip')});
  return controller;
}
