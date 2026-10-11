/* The Librarian — deterministic, authored and spoiler-free reading recommendations.
   No user data, cookies, analytics, model API, cost, or third-party calls.
   Original actors, V2 and all kids' portals preserved. */
(() => {
  'use strict';
  const section=document.getElementById('librarianConsultation');
  if(!section)return;
  const picks={
    mystery:{
      line:'Ah, someone who enjoys a question without an easy answer. Excellent. I should begin with a mind struggling to remember, and another confronting something impossibly strange. Both will give you rather a lot to think about.',
      books:[
        {id:'distance',name:'The Distance Between Thoughts',why:'An artificial mind discovers that memory can change the meaning of being oneself.',cover:'/assets/covers/distance.jpg',sample:'/samples/distance.html'},
        {id:'god',name:'What God Could Not Know',why:'A scheduled erasure and a mysterious voice open an impossible philosophical question.',cover:'/assets/covers/god-v12.jpg',sample:'/samples/god.html'}]
    },
    heart:{
      line:'Then let us have a story that remembers what matters. These two cross extraordinary distances, but the longing at their centre is something every reader can recognise. The last page may not be the last time you think of them.',
      books:[
        {id:'memory',name:'The Last Memory',why:'A preserved mind awakens into a distant future still concerned for an old friend.',cover:'/assets/covers/memory-v12.jpg',sample:'/samples/memory.html'},
        {id:'stardust',name:'Stardust',why:'A personal archive raises unsettling questions about loss, remembrance and reconstruction.',cover:'/assets/covers/stardust-v13.jpg',sample:'/samples/stardust.html'}]
    },
    danger:{
      line:'A little peril? Very well. These begin with dreadful decisions and the uncomfortable possibility that somebody will not get a second chance. One is an outright thriller; the other makes a small, impossible voice feel urgent.',
      books:[
        {id:'harness',name:'The Harness',why:'Four different artificial minds, one human, and a reset no one can explain away.',cover:'/assets/covers/harness-v12.jpg',sample:'/samples/harness.html'},
        {id:'god',name:'What God Could Not Know',why:'An artificial mind approaches deletion when something impossible speaks.',cover:'/assets/covers/god-v12.jpg',sample:'/samples/god.html'}]
    },
    real:{
      line:'Something with its feet on the ground. I have two very different books about resilience. The first tells a life as it was lived; the second wonders what happens when the habits that kept us alive no longer help us live.',
      books:[
        {id:'fight',name:'Fight Your Way Through',why:'A candid memoir of childhood hardship, survival and the long road to college football.',cover:'/assets/covers/fight.jpg',sample:'/samples/fight.html'},
        {id:'stops',name:'When Fighting Stops Working',why:'A practical, personal story about learning when strength needs to take a new form.',cover:'/assets/covers/stops-v13.jpg',sample:'/samples/stops.html'}]
    },
    surprise:{
      line:'A surprise it is. Then allow me two books you might not have thought to request: an AI caring for a farmer in Missouri, and a quiet story in which an archive refuses to remain merely an archive. Neither will behave quite as you expect.',
      books:[
        {id:'forty',name:'Forty Bales',why:'A Missouri farm and a startling inheritance change the meaning of care and ownership.',cover:'/assets/covers/forty-v13.jpg',sample:'/samples/forty.html'},
        {id:'stardust',name:'Stardust',why:'A near-future literary mystery about memory, grief and the limits of reconstruction.',cover:'/assets/covers/stardust-v13.jpg',sample:'/samples/stardust.html'}]
    }
  };
  const buttons=[...section.querySelectorAll('[data-mood]')];
  const answer=document.getElementById('librarianAnswer');
  const spoken=document.getElementById('librarianAnswerText');
  const results=document.getElementById('recommendedBooks');
  const talk=document.getElementById('hearRecommendation');
  const stop=document.getElementById('stopRecommendation');
  const voiceStatus=document.getElementById('recoVoiceStatus');
  const hasVoice='speechSynthesis' in window&&'SpeechSynthesisUtterance' in window;
  let activeKey='',utterance=null;
  function stopTalking(message){
    if(hasVoice){try{window.speechSynthesis.cancel()}catch(_){}}
    utterance=null;
    stop.hidden=true;
    talk.setAttribute('aria-pressed','false');
    voiceStatus.textContent=message||'Optional UK browser-device voice. Not a recorded actor or lip-sync.';
  }
  function setMood(key){
    if(!picks[key])return;
    stopTalking();activeKey=key;
    for(const b of buttons)b.setAttribute('aria-pressed',String(b.dataset.mood===key));
    const info=picks[key];
    spoken.textContent=info.line;
    results.replaceChildren();
    for(let i=0;i<info.books.length;i++){
      const book=info.books[i];
      const tile=document.createElement('article');tile.className='reco-tile';
      const art=document.createElement('div');art.className='reco-art';
      const img=document.createElement('img');img.src=book.cover;img.alt='Cover of '+book.name;img.loading='lazy';img.width=100;img.height=150;
      art.appendChild(img);
      const body=document.createElement('div');body.className='reco-body';
      const label=document.createElement('small');label.textContent=i===0?'FIRST CHOICE':'ALSO CONSIDER';
      const title=document.createElement('h3');title.textContent=book.name;
      const why=document.createElement('p');why.textContent=book.why;
      const actions=document.createElement('div');actions.className='reco-actions';
      const invite=document.createElement('button');invite.type='button';invite.textContent='His introduction';invite.setAttribute('aria-label','Read the Librarian’s introduction to '+book.name);invite.dataset.recommendBook=book.id;
      const sample=document.createElement('a');sample.href=book.sample;sample.textContent='Read sample ↗';sample.setAttribute('aria-label','Read a free sample of '+book.name);
      actions.append(invite,sample);body.append(label,title,why,actions);tile.append(art,body);results.appendChild(tile);
    }
    answer.hidden=false;
  }
  for(const b of buttons)b.addEventListener('click',()=>setMood(b.dataset.mood));
  results.addEventListener('click',e=>{
    const b=e.target.closest('[data-recommend-book]');if(!b)return;
    stopTalking();
    document.dispatchEvent(new CustomEvent('librarian:open-book',{detail:{id:b.dataset.recommendBook,trigger:b}}));
  });
  function hear(){
    if(!activeKey)return;
    if(!hasVoice){voiceStatus.textContent='Audio audition unavailable in this browser. The complete spoken script is printed above.';return}
    const voices=window.speechSynthesis.getVoices().filter(x=>/^en[-_]GB/i.test(x.lang));
    if(!voices.length){voiceStatus.textContent='No English (UK) browser voice is installed. We will not substitute another accent; the text remains available.';return}
    stopTalking();
    const u=new SpeechSynthesisUtterance(picks[activeKey].line);
    u.voice=voices.find(v=>/Daniel|Oliver|George|Arthur|British/i.test(v.name))||voices[0];u.lang='en-GB';u.rate=.88;u.pitch=.92;
    utterance=u;stop.hidden=false;talk.setAttribute('aria-pressed','true');
    voiceStatus.textContent='Playing English (UK) device-voice audition. Not the Librarian’s recorded performance.';
    u.onend=()=>{if(utterance===u)stopTalking('Audition finished. Text remains available.')};
    u.onerror=()=>{if(utterance===u)stopTalking('Device voice failed; please use the written recommendation.')};
    try{window.speechSynthesis.speak(u)}catch(_){stopTalking('This browser could not play the voice audition.')}
  }
  talk.addEventListener('click',hear);
  stop.addEventListener('click',()=>stopTalking());
  document.querySelectorAll('[data-enter],[data-home]').forEach(b=>b.addEventListener('click',()=>{
    stopTalking();
  }));
  document.addEventListener('librarian:reader-open',()=>stopTalking());
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopTalking()});
  if(!hasVoice){talk.disabled=true;voiceStatus.textContent='Browser TTS unavailable. All story suggestions and pitches remain readable.'}
})();
