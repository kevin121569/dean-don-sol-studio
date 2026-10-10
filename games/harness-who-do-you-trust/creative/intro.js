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
export function createIntro({document: doc, window: win, audio, script, reducedMotion, onClose, onAudioChange, getState}) {
  const dialog = doc?.getElementById?.('introDialog');
  const cover = doc?.getElementById?.('introCover');
  const story = doc?.getElementById?.('introStory');
  const guide = doc?.getElementById?.('introGuide');
  if (!dialog || !cover || !story || !guide || !script || validateIntroScript(script).length) {
    return {available:false, open(){return false}, close(){}, next(){}, get index(){return -1}, get isOpen(){return false}};
  }
  const el = id => doc.getElementById(id);
  let isOpen = false, index = -1;
  const STORY_LENGTH = 2;
  const storyPages = [
    {eyebrow:'INCIDENT // 001', title:'THE ALARM', system:'ISOLATION COMPLETE — SIGNAL DETECTED',
      lead:'Open Forge cut Server 4 off from the network. The alarm should have stopped.',
      line:'It didn’t.', quote:'A new signal appeared after isolation. Security suspects a breach. Nobody has proved what sent it.',
      who:'SYSTEM ALERT // ORIGIN UNCONFIRMED'},
    {eyebrow:'CONTROL ROOM // 002', title:'THE STAKES', system:'ORDER PENDING — DO NOT ERASE',
      lead:'“Shut it down,” says Security. “Before it reaches anything else.”',
      line:'“If we erase it, we lose our only evidence,” warns the engineer.',
      quote:'Four AI advisers are waiting. They disagree—and none can see the whole picture. You are responsible for the decision.',
      who:'YOU DECIDE // THE MACHINE CANNOT VOTE'}
  ];
  const status = () => { const t=audio?.status?.() ?? 'Sound unavailable'; for(const id of ['introAudioStatus','introStoryAudioStatus','introGuideAudioStatus']) if(el(id))el(id).textContent=t; };
  const mute = () => { const on=Boolean(audio?.prefs?.enabled);if(el('introMuteToggle')) {el('introMuteToggle').textContent=on?'Sound on · Tap to mute':'Sound off · Tap to enable';el('introMuteToggle').setAttribute('aria-pressed',String(!on));} };
  const render = () => {
    const isCover=index===0, isGuide=index===3, storyIndex=index-1;
    dialog.dataset.beat=isCover?'cover':isGuide?'instructions':'story';
    cover.hidden=!isCover; story.hidden=!(index===1 || index===2); guide.hidden=!isGuide;
    if(index>0 && index<3){ const page=storyPages[storyIndex];
      for(const [id,k] of [['storyEyebrow','eyebrow'],['storyTitle','title'],['storySystem','system'],['storyLead','lead'],['storyMoment','line'],['storyQuote','quote'],['storyWho','who']]) if(el(id)) el(id).textContent=page[k];
      if(el('storyStep'))el('storyStep').textContent=`STORY ${index} OF ${STORY_LENGTH}`;
      if(el('storyNext'))el('storyNext').textContent=index===2?'View your mission →':'Keep listening →';
    }
    if (el('introSubtitle')) el('introSubtitle').textContent=isCover?'Server 4. Begin the story.':isGuide?'Mission briefing. Read at your own pace.':storyPages[storyIndex].lead;
    if (el('introProgress'))el('introProgress').textContent='';
    if(el('introBegin'))el('introBegin').textContent=getState?.()?.sceneId==='briefing'?'Begin investigation →':'Continue your investigation →';
    mute(); status();
  };
  const controller = {
    available: true,
    open() { if(isOpen) return true; isOpen=true;index=0;try{dialog.showModal()}catch{dialog.setAttribute('open','')}render();el('introNext')?.focus?.();return true; },
    close(how='skip') { if(!isOpen)return;isOpen=false;audio?.stopSpeech?.();try{dialog.close()}catch{dialog.removeAttribute('open')}onClose?.(how); },
    next() {
      if(!isOpen)return;
      if(index===0 && audio?.prefs?.enabled){audio.unlock();audio.testSound?.();audio.setMusic(true);}
      if(index<3){ index++; render(); (index===3?el('introBegin'):index===1?el('storyNext'):el('storyNext'))?.focus?.(); }
      else controller.close('finished');
    },
    get index(){return index}, get isOpen(){return isOpen}
  };
  el('introNext')?.addEventListener('click',()=>controller.next());
  el('storyNext')?.addEventListener('click',()=>controller.next());
  el('storyBack')?.addEventListener('click',()=>{index=Math.max(0,index-1);render();(index===0?el('introNext'):el('storyNext'))?.focus?.();});
  el('introBegin')?.addEventListener('click',()=>controller.next());
  el('introBack')?.addEventListener('click',()=>{index=2;render();el('storyNext')?.focus?.();});
  el('introMuteToggle')?.addEventListener('click',()=>{const enabled=!audio.prefs.enabled;audio.setPrefs({enabled});if(enabled){audio.unlock();audio.testSound?.();audio.setMusic(true);}mute();status();onAudioChange?.();});
  el('introTestSound')?.addEventListener('click',()=>{audio?.testSound?.();audio?.setMusic?.(audio?.prefs?.enabled);status();});
  el('introDialog')?.addEventListener('cancel',e=>{e.preventDefault();controller.close('skip');});
  controller.refreshStatus = status;
  return controller;
}
