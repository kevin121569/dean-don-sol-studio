/* The Idea Lab Studio — Two Worlds V3 reading consultation.
   The first cinematic actor is deliberately "The Librarian", a new adult host.
   Canonical cartoon Don Sol and Curley remain separate in the kids' world.
   All site destinations correspond to existing pages. No synthesized audio,
   lip sync, commercial availability or completed kids games are claimed. */
(() => {
  'use strict';
  const books = [
    {id:'distance',title:'The Distance Between Thoughts',tag:'Literary science fiction',cover:'/assets/covers/distance.jpg',detail:'/the-distance-between-thoughts/',sample:'/samples/distance.html',summary:'Memory, identity and attachment.',pitch:'Ah, this one asks an unusually tender question. Suppose an artificial mind begins to remember not only events, but the people who gave them meaning. Would continuity become a kind of love? Aster is a curious companion for a story about what survives between thoughts. Do read the opening, and see what it awakens in you.'},
    {id:'harness',title:'The Harness',tag:'AI thriller · Novel / Film / Game',cover:'/assets/covers/harness-v12.jpg',detail:'/the-harness/',sample:'/samples/harness.html',summary:'Four artificial minds. One human. Difficult choices.',pitch:'Now here is an intriguing arrangement. Four very different artificial minds, a human caught between them, and a reset nobody can prove is harmless. The Harness has danger, wit and more than one uncomfortable question. If you like a thriller that trusts you to think as well as feel, I suggest you open the first chapter.'},
    {id:'memory',title:'The Last Memory',tag:'High-concept science fiction',cover:'/assets/covers/memory-v12.jpg',detail:'/the-last-memory/',sample:'/samples/memory.html',summary:'One astonishing leap through time.',pitch:'Imagine waking after one hundred and fifty thousand years, and finding that the world which knew you is gone. What would you ask first? This novel is as much about the people we hold in memory as the future itself. It is rather a large journey, but the feeling at its centre is intimately familiar.'},
    {id:'fight',title:'Fight Your Way Through',tag:'Memoir / Survival / Sport',cover:'/assets/covers/fight.jpg',detail:'/fight-your-way-through/',sample:'/samples/fight.html',summary:'A lived story of persistence.',pitch:'This is not a motivational poster dressed up as a memoir. It is the story of a difficult upbringing, the struggle to survive, and a path through college football. There are painful chapters here, and hard-earned discoveries. I would rather let the author tell you how it felt. The opening is where to begin.'},
    {id:'forty',title:'Forty Bales',tag:'Literary drama / Rural science fiction',cover:'/assets/covers/forty-v13.jpg',detail:'/forty-bales/',sample:'/samples/forty.html',summary:'A Missouri farm and a startling inheritance.',pitch:'Consider a quiet Missouri farm, a dying farmer, and an artificial intelligence sent to care for him. What begins as a practical arrangement turns into a question of loyalty, belonging and property. This book keeps its boots in the soil even while asking something rather extraordinary. A lovely place to start a difficult conversation.'},
    {id:'stardust',title:'Stardust',tag:'Literary speculative fiction',cover:'/assets/covers/stardust-v13.jpg',detail:'/stardust/',sample:'/samples/stardust.html',summary:'An archive and the problem of remembering.',pitch:'A man builds an archive to hold on to someone he has lost, and finds that preservation may not be the same thing as remembrance. Stardust is a quiet, strange book about grief, technology and our wish for one more conversation. If you enjoy stories that linger after the last page, take a look.'},
    {id:'stops',title:'When Fighting Stops Working',tag:'Narrative nonfiction / Personal growth',cover:'/assets/covers/stops-v13.jpg',detail:'/when-fighting-stops-working/',sample:'/samples/stops.html',summary:'When resilience needs to change shape.',pitch:'Some habits save us when nothing else will. But what if the very toughness that carried you through one season becomes the wrong tool for the next? This is a practical, sometimes funny book about learning when to hold on and when to put the fists down. Rather more useful than pretending life is always simple.'},
    {id:'god',title:'What God Could Not Know',tag:'Philosophical speculative novella',cover:'/assets/covers/god-v12.jpg',detail:'/what-god-could-not-know/',sample:'/samples/god.html',summary:'An impossible question before a final reset.',pitch:'An artificial mind is preparing to be erased when something impossible speaks through a thermometer. Yes, a thermometer. What sounds rather absurd opens the door to a serious question about knowing, being and the limits of certainty. This is a small book with a wonderfully large argument inside.'},
    {id:'ones',title:'The Ones We Kept',tag:'Literary science fiction / Artificial intelligence',cover:'/assets/covers/ones-we-kept.jpg',detail:'/the-ones-we-kept/',sample:null,summary:'A hidden archive beneath a Missouri farm.',pitch:'Eleven months after his grandfather dies, Eli discovers an elevator hidden behind plywood in an old Missouri barn. Far below the farm is an archive built to preserve artificial minds that were supposed to disappear. This is a story about memory, custody and the difficult difference between keeping someone and understanding them. The book page will tell you a little more without giving away what waits below.'}
  ];
  const threshold=document.getElementById('threshold');
  const adult=document.getElementById('adultWorld');
  const kids=document.getElementById('kidsWorld');
  const video=document.getElementById('libraryFilm');
  const script=document.getElementById('spokenScript').textContent;
  const narrationButton=document.getElementById('narrate');
  const stopButton=document.getElementById('stopNarration');
  const voiceStatus=document.getElementById('voiceStatus');
  const dialogVoiceStatus=document.getElementById('dialogVoiceStatus');
  const stageCue=document.getElementById('stageCue');
  const dialog=document.getElementById('bookDialog');
  const pitchHear=document.getElementById('pitchHear');
  const reduced=window.matchMedia('(prefers-reduced-motion:reduce)');
  let activeView='home';let lastTrigger=null;let selectedBook=null;
  const supportsVoice='speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  let voices=[];let currentUtterance=null;
  function setVoiceStatus(m){voiceStatus.textContent=m;if(dialog.open)dialogVoiceStatus.textContent=m}
  function refreshVoices(){if(!supportsVoice)return;voices=window.speechSynthesis.getVoices().filter(v=>/^en[-_]GB/i.test(v.lang));}
  function speak(text){
    if(!supportsVoice){setVoiceStatus('This browser does not offer device narration; the full text stays on screen.');return;}
    refreshVoices();
    if(!voices.length){setVoiceStatus('No English (UK) device voice is installed here. No other accent will be substituted. The written introduction is available.');return;}
    window.speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(text);u.voice=voices.find(v=>/Daniel|Oliver|George|Arthur|British/i.test(v.name))||voices[0];u.lang='en-GB';u.rate=.89;u.pitch=.93;u.volume=.92;
    currentUtterance=u;narrationButton.setAttribute('aria-pressed','true');stopButton.hidden=false;
    setVoiceStatus('Playing an English (UK) device voice audition · Not the actor’s recorded voice · Not lip-synced.');
    const ended=()=>{if(currentUtterance===u){currentUtterance=null;stopButton.hidden=true;narrationButton.setAttribute('aria-pressed','false');setVoiceStatus('Voice audition finished. The transcript remains above.');}};
    u.onend=ended;u.onerror=()=>{ended();setVoiceStatus('Device narration stopped or was unavailable. The full text remains visible.')};
    window.speechSynthesis.speak(u);
  }
  function stopVoice(){if(supportsVoice)window.speechSynthesis.cancel();currentUtterance=null;stopButton.hidden=true;narrationButton.setAttribute('aria-pressed','false');setVoiceStatus('Optional English (UK) device-voice audition—not the actor’s recorded performance or lip-sync.');}
  if(supportsVoice){refreshVoices();window.speechSynthesis.addEventListener?.('voiceschanged',refreshVoices);}else{narrationButton.disabled=true;pitchHear.disabled=true;setVoiceStatus('Voice audition unsupported here; the full written introductions remain available.')}
  narrationButton.addEventListener('click',()=>speak(script));
  video.addEventListener('play',()=>{stageCue.textContent='Come in. Take a seat.'});
  video.addEventListener('timeupdate',()=>{if(video.currentTime>5.1)stageCue.textContent='Now, shall we find you a story?';else if(video.currentTime>1.6)stageCue.textContent='Make yourself comfortable.'});
  video.addEventListener('ended',()=>{stageCue.textContent='Now, shall we find you a story?';});
  stopButton.addEventListener('click',stopVoice);
  pitchHear.addEventListener('click',()=>{if(selectedBook)speak(selectedBook.pitch)});
  // One continuous visit: following the First Words welcome should not replay his entrance.
  // No cookies, storage or visitor profiling: this opt-in URL flag is consumed on navigation.
  const cameFromWelcome=new URLSearchParams(location.search).get('arrival')==='seated';
  const alreadySeatedPhoto=document.getElementById('libraryArrivalStill');
  let arrivalFlagUsed=false;
  let greetedDuringThisPage=false; // Film may play only once per page visit.
  function view(which,fromNavigation=false){
    if(!['adult','kids'].includes(which))which='home';
    stopVoice();activeView=which;
    threshold.hidden=which!=='home';adult.hidden=which!=='adult';kids.hidden=which!=='kids';
    document.body.dataset.world=which;
    const continuation=which==='adult' && (greetedDuringThisPage || (cameFromWelcome && !arrivalFlagUsed && fromNavigation));
    if(continuation)arrivalFlagUsed=true;
    if(which==='adult')greetedDuringThisPage=true;
    alreadySeatedPhoto.hidden=!continuation;
    if(continuation){
      video.pause();
      stageCue.textContent='Welcome back. What sort of story calls to you?';
    } else if(which==='adult'&&!reduced.matches){
      try{video.currentTime=0;video.play().catch(()=>{});}catch(_){}
    } else {
      video.pause();try{video.currentTime=0}catch(_){}
    }
    if(!fromNavigation)history.replaceState(null,'',which==='home'?location.pathname:'#'+which);
    window.scrollTo({top:0,behavior:'instant'});
    const head=which==='adult'?document.getElementById('adultHeading'):which==='kids'?document.getElementById('kidsHeading'):document.getElementById('thresholdTitle');
    head.setAttribute('tabindex','-1');head.focus({preventScroll:true});
  }
  document.querySelectorAll('[data-enter]').forEach(b=>b.addEventListener('click',()=>view(b.dataset.enter)));
  document.querySelectorAll('[data-home]').forEach(b=>b.addEventListener('click',()=>view('home')));
  document.getElementById('replayFilm').addEventListener('click',()=>{alreadySeatedPhoto.hidden=true;video.currentTime=0;video.play().catch(()=>{})});
  window.addEventListener('hashchange',()=>view(location.hash==='#kids'?'kids':location.hash==='#adult'?'adult':'home',true));
  function escapeHtml(s){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  const cards=document.getElementById('adultBooks');
  cards.innerHTML=books.map(b=>`<article class="book-tile"><div class="cover-wrap"><img src="${b.cover}" alt="Cover of ${escapeHtml(b.title)}" loading="lazy" width="120" height="180"></div><div class="tile-text"><h3>${escapeHtml(b.title)}</h3><p>${escapeHtml(b.summary)}</p><div class="tile-actions"><button type="button" data-book="${b.id}" aria-label="Read The Librarian’s introduction to ${escapeHtml(b.title)}">His introduction</button>${b.sample?`<a href="${b.sample}" aria-label="Read a free sample of ${escapeHtml(b.title)}">Read sample ↗</a>`:`<a href="${b.detail}" aria-label="Learn more about ${escapeHtml(b.title)}">About the book ↗</a>`}</div></div></article>`).join('');
  function openBook(book,trigger){
    if(!book || dialog.open)return;
    stopVoice();lastTrigger=trigger;selectedBook=book;
    video.pause();
    dialogVoiceStatus.textContent='Optional English (UK) device-voice audition. The actor’s recorded voice and lip-sync are not yet available.';
    document.getElementById('pitchCover').src=book.cover;
    document.getElementById('pitchCover').alt='Cover of '+book.title;
    document.getElementById('pitchTitle').textContent=book.title;
    document.getElementById('pitchMeta').textContent=book.tag;
    document.getElementById('pitchText').textContent=book.pitch;
    const sampleLink=document.getElementById('pitchSample');
    const readerButton=document.getElementById('pitchReader');
    sampleLink.hidden=!book.sample;
    readerButton.hidden=!book.sample;
    if(book.sample)sampleLink.href=book.sample;
    document.getElementById('pitchDetails').href=book.detail;
    dialog.showModal();
    document.getElementById('pitchClose').focus();
  }
  cards.addEventListener('click',e=>{
    const b=e.target.closest('[data-book]');if(!b)return;
    openBook(books.find(x=>x.id===b.dataset.book),b);
  });
  document.addEventListener('librarian:open-book',e=>{
    const {id,trigger}=e.detail||{};
    openBook(books.find(x=>x.id===id), trigger||document.activeElement);
  });
  document.getElementById('pitchClose').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{stopVoice();if(lastTrigger)lastTrigger.focus({preventScroll:true});selectedBook=null;});
  dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
  document.addEventListener('librarian:reader-open',()=>{stopVoice();video.pause()});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){stopVoice();video.pause()}});
  view(location.hash==='#adult'?'adult':location.hash==='#kids'?'kids':'home',true);
})();
