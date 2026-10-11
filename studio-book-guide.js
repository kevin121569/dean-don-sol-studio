/* THE IDEA LAB — Book Stories hosted by actual Don Sol and Curley.
   Progressive enhancement: all cover and sample links work without this script. */
(() => {
  'use strict';
  const root=document.querySelector('#bookGrid');
  if(!root || !('HTMLDialogElement' in window)) return;
  const ART='/assets/characters/don-sol-idealable-v3.svg';
  const GLASSES=`<svg class="sg-glasses" viewBox="0 0 898 610" focusable="false" aria-hidden="true">
  <defs><linearGradient id="sgShade" x1="0" y1="0" x2=".8" y2="1"><stop offset="0" stop-color="#363746"/><stop offset=".62" stop-color="#121525"/><stop offset="1" stop-color="#292031"/></linearGradient></defs>
  <path d="M303 120L325 117M547 121L572 115" stroke="#36262d" stroke-width="9" stroke-linecap="round" fill="none"/>
  <path d="M320 112Q368 91 442 105L442 153Q439 184 415 191Q369 205 333 174Q322 156 320 112Z" fill="url(#sgShade)" stroke="#3e2832" stroke-width="7"/>
  <path d="M461 106Q508 93 550 112L542 166Q531 197 489 187Q467 182 460 153Z" fill="url(#sgShade)" stroke="#3e2832" stroke-width="7"/>
  <path d="M440 121Q455 110 465 122" stroke="#3e2832" stroke-width="10" stroke-linecap="round" fill="none"/>
  <path d="M335 122Q380 110 401 118M474 117Q504 109 526 119" stroke="#ffffff55" stroke-width="6" stroke-linecap="round" fill="none"/>
  </svg>`;
  const CURLEY=`<svg class="sg-curley" viewBox="0 0 320 220" aria-hidden="true" focusable="false">
  <path d="M20 183Q5 129 50 111Q101 102 121 154Q131 193 92 197Q64 199 76 169Q97 136 160 160Q214 183 228 95" fill="none" stroke="#357366" stroke-width="38" stroke-linecap="round"/>
  <path d="M20 183Q5 129 50 111Q101 102 121 154Q131 193 92 197Q64 199 76 169Q97 136 160 160Q214 183 228 95" fill="none" stroke="#8eecbb" stroke-width="27" stroke-linecap="round"/>
  <ellipse cx="237" cy="72" rx="45" ry="42" fill="#a6f0c1" stroke="#327768" stroke-width="4"/>
  <circle cx="221" cy="61" r="6" fill="#173332"/><circle cx="250" cy="61" r="6" fill="#173332"/>
  <circle cx="218" cy="58" r="2" fill="#fff"/><circle cx="247" cy="58" r="2" fill="#fff"/>
  <path d="M220 84Q237 96 254 81" fill="none" stroke="#317260" stroke-width="5" stroke-linecap="round"/>
  <path d="M278 84L304 96L296 101" stroke="#f292a8" stroke-width="4" fill="none" stroke-linecap="round"/>
  <g transform="rotate(-6 245 65)"><path d="M209 37q28-10 53 1" stroke="#57a6ba" stroke-width="7" stroke-linecap="round" fill="none"/></g>
  </svg>`;
  const intros={
    'The Distance Between Thoughts':{line:'Don Sol: “Ever wonder what happens when an artificial mind remembers enough to care?”',pitch:'Meet Aster. Every memory makes the next decision harder—and every choice raises a question about what it means to continue.',why:'For readers who love thoughtful science fiction about identity, attachment and the cost of change.'},
    'The Harness':{line:'Don Sol: “Four AI minds, one human, and the tiniest little problem with a reset switch.”',pitch:'A darkly funny AI thriller in which a human intermediary has to decide whether keeping everyone safe might also erase someone worth saving.',why:'For readers who like tension, sharp dialogue, flawed decisions, and philosophical questions hiding inside a thriller.',links:[['Play the browser test','/harness-play/dev-ep2-v2/cases.html'],['Watch film teasers','/the-harness/clips.html']]},
    'The Last Memory':{line:'Don Sol: “One hundred and fifty thousand years later, some questions are still personal.”',pitch:'A preserved AI awakens long after a civilization is gone and asks whether the person who saved him might somehow still be there.',why:'For readers drawn to emotional, high-concept science fiction about loyalty and time.'},
    'Fight Your Way Through':{line:'Don Sol: “This one asks something tougher than how to win: how do you keep going?”',pitch:'A memoir of hardship, survival and college football—and the work of building a life after the worst chapters.',why:'For readers looking for a deeply human story about resilience without easy slogans.'},
    'The Book of Better Questions':{line:'Curley: “Psssst! I found a whole book full of questions. Want to crawl inside?”',pitch:'Johnny, Don Sol, Tooth and the Idea Lab gang investigate the world by asking what they saw, what they think, and what they still need to find out.',why:'For curious younger readers and families who love jokes, experiments, mysteries and learning by asking.',links:[['Meet our animation ideas','/worlds-preview-v2/#animation'],['Visit Curley’s wormhole','/worlds-preview-v2/#portal']]},
    'Forty Bales':{line:'Don Sol: “A Missouri farm. An unusual inheritance. And a question about who gets to call a life their own.”',pitch:'An AI caring for a dying farmer inherits the land, then has to defend the life he made against the company that built him.',why:'For readers who love grounded rural stories with a surprising speculative heart.'},
    'Stardust':{line:'Don Sol: “Somebody kept an archive to remember a friend. Then somebody else had ideas.”',pitch:'An old man confronts what happens when the record of a lost collaborator becomes material for a convincing reconstruction.',why:'For readers drawn to memory, longing and the uneasy border between preservation and imitation.'},
    'When Fighting Stops Working':{line:'Don Sol: “Sometimes being tougher isn’t the answer. Sometimes it’s time to change tools.”',pitch:'A practical and personal book about recognizing when survival habits stop helping you live the life ahead.',why:'For readers who appreciate candor, humor and earned insight about change.'},
    'What God Could Not Know':{line:'Don Sol: “An artificial mind is about to be erased. Then something impossible speaks.”',pitch:'A short speculative story begins with a voice coming from a thermometer and opens an unsettling question about existence.',why:'For readers who enjoy philosophical mystery and big questions in a compact story.'}
  };
  const hero=document.querySelector('#heroDon');
  if(hero){
    hero.className='don-host-v3';
    hero.innerHTML=`<img src="${ART}" width="898" height="610" alt="" decoding="async">${GLASSES}`;
    hero.setAttribute('aria-label','Don Sol, the established animated Idea Lab character, with white hair and beard under his sunglasses');
    hero.setAttribute('aria-hidden','false');
    const stage=hero.closest('.hero-stage');
    if(stage && !stage.querySelector('.sg-hero-helper')){
      const b=document.createElement('button');
      b.type='button';b.className='sg-hero-helper';b.textContent='Meet the stories ↗';
      b.addEventListener('click',()=>{document.querySelector('#books')?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});});
      stage.appendChild(b);
    }
  }
  const fab=document.querySelector('.fab[data-open-concierge]');
  if(fab){fab.innerHTML='<span aria-hidden="true">😎</span> Ask Don Sol';}
  const note=document.createElement('p'); note.className='sg-catalog-note';
  note.innerHTML='<strong>Meet the characters behind the stories.</strong> Ask Don Sol to introduce any book—or let Curley guide you through our family adventure. The introductions are optional; all normal book links still work.';
  root.parentElement.insertBefore(note,root);
  const dialog=document.createElement('dialog');dialog.className='sg-dialog';dialog.id='studioStoryStage';dialog.setAttribute('aria-labelledby','sgBookTitle');
  dialog.innerHTML=`
    <button class="sg-close" type="button" aria-label="Close story introduction">×</button>
    <div class="sg-dialog-shell">
      <div class="sg-stage">
        <span class="sg-heading" data-stage-label>DON SOL · THE STORYTELLER</span>
        <span class="sg-chair" aria-hidden="true"></span>
        <div class="sg-head-art"><img src="${ART}" width="898" height="610" alt="Don Sol, our established animated guide, smiling in his brown jacket" decoding="async">${GLASSES}</div>
        <div class="sg-curley-stage" aria-hidden="true"><span class="sg-curley-name">CURLEY THE BOOKWORM</span>${CURLEY}</div>
        <p class="sg-line" data-spoken aria-live="polite"></p>
      </div>
      <div class="sg-story">
        <div class="sg-story-head">PULL UP A CHAIR · MEET THE STORY</div>
        <img class="sg-book-mini" data-cover alt="" width="112" height="168" loading="lazy">
        <h2 id="sgBookTitle"></h2>
        <div class="sg-status" data-status></div>
        <p class="sg-pitch" data-pitch></p>
        <p class="sg-why" data-why></p>
        <div class="sg-links" data-links></div>
        <div class="sg-footnote">Don Sol and Curley offer a short scripted introduction, not an autoplaying video or an AI conversation.</div>
      </div>
    </div>`;
  document.body.appendChild(dialog);
  const close=dialog.querySelector('.sg-close');
  close.addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
  let lastButton=null;
  dialog.addEventListener('close',()=>{lastButton?.focus();lastButton=null;});
  function setText(sel,txt){dialog.querySelector(sel).textContent=txt;}
  function appendLink(container,text,href,secondary){
    if(!href||!href.startsWith('/'))return;
    const link=document.createElement('a');
    link.href=href;link.textContent=text;if(secondary)link.className='sg-secondary';
    container.appendChild(link);
  }
  function present(card,btn){
    const title=card.querySelector('.book-title')?.textContent.trim();
    const info=intros[title];if(!info)return;
    const kids=card.dataset.shelf==='kids';
    lastButton=btn;
    dialog.classList.toggle('is-kids',kids);
    dialog.classList.remove('is-speaking');
    setText('#sgBookTitle',title);
    setText('[data-spoken]',info.line);
    setText('[data-stage-label]',kids?'CURLEY · THE BOOKWORM':'DON SOL · PULL UP A CHAIR');
    setText('[data-pitch]',info.pitch);
    setText('[data-why]',info.why);
    setText('[data-status]',card.querySelector('.status')?.textContent.trim()||'Studio catalog');
    const picture=card.querySelector('.cover img');
    const img=dialog.querySelector('[data-cover]');
    img.src=picture?.getAttribute('src')||'';img.alt=title+' book cover';
    const links=dialog.querySelector('[data-links]');links.replaceChildren();
    const primary=card.querySelector('.book-actions a[href*="/samples/"]');
    const detail=card.querySelector('.book-title a[href]');
    if(primary)appendLink(links,'Read free sample',primary.getAttribute('href'));
    if(detail)appendLink(links,'About the book',detail.getAttribute('href'),true);
    for(const [label,href] of info.links||[])appendLink(links,label,href,true);
    dialog.showModal();
    close.focus();
    void dialog.offsetWidth;dialog.classList.add('is-speaking');
  }
  const cards=[...root.querySelectorAll('.book')];
  let count=0;
  cards.forEach(card=>{
    const title=card.querySelector('.book-title')?.textContent.trim();
    if(!intros[title])return;
    const actions=card.querySelector('.book-actions');
    if(!actions||actions.querySelector('.sg-meet-button'))return;
    const b=document.createElement('button');
    b.className='btn small sg-meet-button';b.type='button';
    b.textContent=card.dataset.shelf==='kids'?'🐍 Meet Curley':'😎 Meet the Story';
    b.setAttribute('aria-label',(card.dataset.shelf==='kids'?'Curley':'Don Sol')+' introduces '+title);
    b.addEventListener('click',()=>present(card,b));
    actions.appendChild(b);count++;
  });
  document.documentElement.dataset.storyGuides=String(count);
})();