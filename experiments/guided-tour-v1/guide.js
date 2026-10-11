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
  const companion=document.createElement('div');
  companion.className='tg-companion';
  companion.setAttribute('aria-hidden','true');
  companion.innerHTML='<span class="tg-bubble">Looking for a story?</span><span class="tg-face"><img src="'+poster+'" alt="" width="110" height="98"></span><span class="tg-cloud"></span>';
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
    if(open){lastFab=document.activeElement;select.focus();bubble.textContent='Let’s find your story.'}
    else {lastFab?.focus();bubble.textContent='Need a guide? Ask me.'}
  }
  heroFab.setAttribute('aria-controls','tgGuideChooser');
  heroFab.setAttribute('aria-expanded','false');
  heroFab.innerHTML='<span aria-hidden="true">😎</span> Ask Don Sol';
  // Replace the previous generic recommendation popup only in this review preview.
  heroFab.onclick=e=>{e.preventDefault();choosePanel(panel.hidden)};
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
  // Allow the on-page character sales stage to summon Don Sol as well.
  const bookIntro=stageDialog.querySelector('.sg-stage');
  const filmButton=document.createElement('button');
  filmButton.className='tg-film-trigger';filmButton.type='button';
  filmButton.textContent='▶ Watch approved Don Sol animation';
  filmButton.title='Private studio preview of the approved, silent ten-second animated close-up.';
  bookIntro?.appendChild(filmButton);
  const videoDialog=document.createElement('dialog');videoDialog.className='tg-film-dialog';
  videoDialog.setAttribute('aria-labelledby','tgFilmTitle');
  videoDialog.innerHTML='<header class="tg-film-head"><h2 id="tgFilmTitle">Don Sol · Approved Close-up</h2><button type="button" class="tg-film-close" aria-label="Close approved studio animation">×</button></header><div class="tg-film-frame" data-film></div><div class="tg-film-note"><strong>Studio review only:</strong> this is the verified 10-second character-performance master in our private Drive. It is not a finished speaking-book pitch, and its soundtrack is not approved for use on the website. Play the footage only if your studio Drive account can access it. The book introduction remains available without video.</div>';
  document.body.appendChild(videoDialog);
  const filmArea=videoDialog.querySelector('[data-film]');
  const filmClose=videoDialog.querySelector('.tg-film-close');
  let filmLastFocus;
  filmButton.addEventListener('click',()=>{
    filmLastFocus=document.activeElement;
    filmArea.replaceChildren();
    const iframe=document.createElement('iframe');
    iframe.setAttribute('title','Approved Don Sol close-up animation — studio Drive login required');
    iframe.setAttribute('allow','fullscreen');
    iframe.setAttribute('referrerpolicy','no-referrer');
    iframe.loading='lazy';
    iframe.src='https://drive.google.com/file/d/1VV3aabtxnr9s-jUn62fiG_tjim9dH0fL/preview';
    filmArea.appendChild(iframe);
    videoDialog.showModal();
    filmClose.focus();
  });
  filmClose.addEventListener('click',()=>videoDialog.close());
  videoDialog.addEventListener('close',()=>{filmArea.replaceChildren();filmLastFocus?.focus()});
  videoDialog.addEventListener('click',e=>{if(e.target===videoDialog)videoDialog.close()});
  // The video is a review reference; don't open private Drive footage for casual site visitors.
  document.documentElement.dataset.guidedTour='v1';
})();