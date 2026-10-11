/* Guided Tour V1 — cinematic scroll/escort and existing book sales presentation.
   Approved G1 footage stays private and is viewed only on demand by studio reviewers.
   Does not modify frozen Harness game or approved Curley wormhole. */
(() => {
  'use strict';
  const grid=document.querySelector('#bookGrid');
  const heroFab=document.querySelector('.fab[data-open-concierge]');
  const stageDialog=document.querySelector('#studioStoryStage');
  if(!grid||!heroFab||!stageDialog)return;
  const cards=[...grid.querySelectorAll('.book')];
  const names=cards.map(card=>card.querySelector('.book-title')?.textContent.trim()).filter(Boolean);
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const poster='/assets/characters/don-sol-idealable-v3.svg';
  const videoUrl='/assets/video/don-sol-approved-closeup-web-v1.mp4';
  const companion=document.createElement('div');
  companion.className='tg-companion';
  companion.setAttribute('aria-hidden','true');
  companion.innerHTML='<span class="tg-bubble">Looking for a story?</span><span class="tg-face"><img src="'+poster+'" alt="" width="110" height="98"><video class="tg-face-video" muted playsinline loop preload="none" aria-hidden="true"><source src="'+videoUrl+'" type="video/mp4"></video></span><span class="tg-cloud"></span>';
  const floatingVideo=companion.querySelector('video');
  floatingVideo.addEventListener('playing',()=>companion.classList.add('tg-has-motion'));
  floatingVideo.addEventListener('error',()=>companion.classList.remove('tg-has-motion'));
  document.body.appendChild(companion);
  const bubble=companion.querySelector('.tg-bubble');
  const panel=document.createElement('aside');
  panel.className='tg-chooser';panel.hidden=true;panel.id='tgGuideChooser';
  panel.setAttribute('aria-labelledby','tgChooserTitle');
  panel.innerHTML='<div class="tg-kicker">DON SOL · YOUR GUIDE</div><h2 id="tgChooserTitle">Pull up a chair.</h2><p>Tell me which story has your curiosity. I’ll take you to it, then introduce you properly.</p><label for="tgBookChoice">Which story shall we explore?</label><select id="tgBookChoice"></select><div class="tg-buttons"><button type="button" data-go>Take me there →</button><button type="button" class="tg-secondary" data-dismiss>Maybe later</button></div><p>Curley handles our young readers. Nobody has to sit through an animation just to read a sample.</p>';
  document.body.appendChild(panel);
  const select=panel.querySelector('select');
  names.forEach(name=>{const op=document.createElement('option');op.value=name;op.textContent=name;select.appendChild(op)});
  select.value=names.includes('The Harness')?'The Harness':names[0];
  const status=document.createElement('output');
  status.className='tg-status';status.hidden=true;status.setAttribute('role','status');document.body.appendChild(status);
  let currentCard=null,ongoing=null,lastFab=null;
  function announce(message){status.textContent=message;status.hidden=false}
  function clearStatus(){status.hidden=true}
  function choosePanel(open){
    panel.hidden=!open;heroFab.setAttribute('aria-expanded',String(open));
    if(open){lastFab=document.activeElement;select.focus();bubble.textContent='Let’s find your story.';if(!reduced.matches)floatingVideo.play().catch(()=>{})}
    else {lastFab?.focus();bubble.textContent='Need a guide? Ask me.'}
  }
  heroFab.setAttribute('aria-controls','tgGuideChooser');
  heroFab.setAttribute('aria-expanded','false');
  heroFab.innerHTML='<span aria-hidden="true">😎</span> Ask Don Sol';
  // Replace the previous generic recommendation popup only in this review preview.
  heroFab.onclick=null;
  heroFab.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();choosePanel(panel.hidden)},true);
  panel.querySelector('[data-dismiss]').addEventListener('click',()=>choosePanel(false));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden){choosePanel(false)}});
  panel.addEventListener('keydown',e=>{
    if(e.key!=='Tab')return;
    const items=[select,panel.querySelector('[data-go]'),panel.querySelector('[data-dismiss]')];
    if(e.shiftKey&&document.activeElement===items[0]){e.preventDefault();items.at(-1).focus()}
    else if(!e.shiftKey&&document.activeElement===items.at(-1)){e.preventDefault();items[0].focus()}
  });
  function goToBook(title){
    const card=cards.find(c=>c.querySelector('.book-title')?.textContent.trim()===title);
    if(!card)return;
    if(ongoing!==null){clearTimeout(ongoing);ongoing=null}
    if(currentCard)currentCard.classList.remove('tg-current-card');
    choosePanel(false);
    companion.classList.add('is-traveling');
    bubble.textContent=card.dataset.shelf==='kids'?'Curley! Your turn!':'Come along, cousin.';
    announce('Don Sol is taking you to '+title+'…');
    if(card.hidden){
      const allFilter=document.querySelector('[data-filter="all"]');
      allFilter?.click();
    }
    // Scroll the actual book into view. The companion escorts the reader as the page moves.
    const top=Math.max(0,window.scrollY+card.getBoundingClientRect().top-120);
    window.scrollTo({top,behavior:reduced.matches?'instant':'smooth'});
    const delay=reduced.matches?90:980;
    ongoing=setTimeout(()=>{
      ongoing=null;
      companion.classList.remove('is-traveling');
      card.classList.add('tg-current-card');currentCard=card;
      const meet=card.querySelector('.sg-meet-button');
      if(meet){meet.click();bubble.textContent='Let me tell you about this one.'}
      else {bubble.textContent='Here’s the book.';card.querySelector('.book-title a')?.focus()}
      clearStatus();
    },delay);
  }
  panel.querySelector('[data-go]').addEventListener('click',()=>goToBook(select.value));
  // The real approved G1 close-up now plays inside the bookstore pitch stage.
  // It is silent and expression-only: no claim of speech or full-body animation.
  const stage=stageDialog.querySelector('.sg-stage');
  const face=stageDialog.querySelector('.sg-head-art');
  const performance=document.createElement('video');
  performance.className='tg-approved-performance';
  performance.setAttribute('aria-label','Don Sol smiling, listening and nodding in the studio approved cartoon clip; silent.');
  performance.setAttribute('playsinline','');
  performance.muted=true;
  performance.loop=true;
  performance.preload='metadata';
  performance.src=videoUrl;
  performance.poster=poster;
  face?.appendChild(performance);
  const replay=document.createElement('button');
  replay.type='button';replay.className='tg-film-trigger';
  replay.textContent='↻ Replay Don Sol animation';
  replay.title='Replay the genuine, silent ten-second approved cartoon close-up. This is not lip-synced dialogue.';
  stage?.appendChild(replay);
  const liveStatus=document.createElement('span');
  liveStatus.className='tg-video-note';
  liveStatus.textContent='Approved cartoon movement · Silent close-up · Voice performance in production';
  stage?.appendChild(liveStatus);
  function setPerformance() {
    const isKids=stageDialog.classList.contains('is-kids');
    replay.hidden=isKids;
    liveStatus.hidden=isKids;
    performance.hidden=isKids;
    if(isKids){performance.pause();return;}
    if(reduced.matches){performance.pause();performance.currentTime=0;return;}
    performance.play().catch(()=>{liveStatus.textContent='Still image fallback · Motion playback unavailable on this device';});
  }
  replay.addEventListener('click',()=>{
    try{performance.currentTime=0;}catch(_){}
    performance.play().catch(()=>{liveStatus.textContent='Movement unavailable here; original image remains visible.'});
  });
  stageDialog.addEventListener('close',()=>{performance.pause();floatingVideo.pause();companion.classList.remove('tg-has-motion')});
  // Programmatic click on a catalog "Meet" button also bubbles to this listener.
  document.addEventListener('click',e=>{
    if(e.target.closest('.sg-meet-button,.sg-hero-curley,.sales-hero-pitch,[data-sales-title]')){
      // Existing handler opens the book presentation before event bubbles.
      if(stageDialog.open)setPerformance();
    }
  });
  performance.addEventListener('playing',()=>{face?.classList.add('tg-animation-ready');liveStatus.textContent='Don Sol’s approved close-up is playing · Silent performance'});
  performance.addEventListener('error',()=>{face?.classList.remove('tg-animation-ready');liveStatus.textContent='Character portrait fallback · Video unavailable'});
  document.documentElement.dataset.guidedTour='v2';

})();