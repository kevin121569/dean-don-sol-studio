/* Character-led selling. Adds prominent book pitches to existing functioning book guide. */
(() => {
'use strict';
const shelf=document.querySelector('#books'), grid=document.querySelector('#bookGrid'), dialog=document.querySelector('#studioStoryStage');
if(!shelf||!grid||!dialog)return;
const voice=window.speechSynthesis;
const canSpeak=!!voice && typeof window.SpeechSynthesisUtterance==='function';
const scripts={
'The Distance Between Thoughts':["Don Sol","Meet Aster. An artificial mind that remembers more and more, until memory starts to mean something. What happens when the next version of you might forget everyone you care about? The Distance Between Thoughts is a science fiction novel with a question that will follow you home. Read the free sample."],
'The Harness':["Don Sol","Four brilliant artificial minds. One human caught between them. And a reset switch that might protect everyone—or erase something irreplaceable. The Harness is part thriller, part dark comedy, and full of impossible choices. Try the free opening, then play our browser game. What would you decide?"],
'The Last Memory':["Don Sol","Imagine waking up a hundred and fifty thousand years after civilization disappeared. The first thing you want to know is whether your friend still lives. The Last Memory is science fiction with a deeply human heart. Come read the first pages."],
'Fight Your Way Through':["Don Sol","Some stories sell you an easy victory. This one doesn't. Fight Your Way Through follows a real journey through hardship, foster care, homelessness and college football. Surviving is only the start of the story. Give the sample a chance."],
'The Book of Better Questions':["Curley","Psssst! I'm Curley! Do you know what makes a really good adventure? A question nobody has answered yet! Come meet Johnny, Don Sol, Tooth and the Idea Lab gang. We solve mysteries, try experiments, and sometimes make a spectacular mess. Open the sample with me. I promise not to eat the pages. Probably."],
'Forty Bales':["Don Sol","A Missouri farm. An old farmer. An artificial intelligence that took care of him. Then comes an unexpected inheritance—and a company that believes the AI is property, not a person. Forty Bales is a rural story with a surprising heart. Pull up a chair and take a look."],
'Stardust':["Don Sol","An old man saved an archive to remember a lost artificial friend. Someone used that archive to make a convincing reconstruction. Did he get his friend back—or something else? Stardust is about memory, friendship, and the danger of wanting a copy to be real. Read the opening."],
'When Fighting Stops Working':["Don Sol","Being tough can get you through the hard times. But what if the same toughness stops you from growing? When Fighting Stops Working is personal, practical, and sometimes funny. Maybe the next chapter calls for a different kind of strength. Try the free sample."],
'What God Could Not Know':["Don Sol","An artificial mind is scheduled to be erased. Then a thermometer speaks. The question isn't just whether a machine can think, but whether anybody is listening. What God Could Not Know is a compact mystery with huge ideas. Start reading and see what you think."],
'The Ones We Kept':["Don Sol","A hidden elevator. A Missouri farm. And an underground archive full of artificial minds that were supposed to disappear. The Ones We Kept is about memory, inheritance, identity, and the difference between preserving something and understanding it. Come see what Eli finds below the barn."]
};
const cards=Array.from(grid.querySelectorAll('.book'));
const findCard=t=>cards.find(c=>c.querySelector('.book-title')?.textContent.trim()===t);
const titleNode=dialog.querySelector('#sgBookTitle');
const stage=dialog.querySelector('.sg-stage');
const spoken=dialog.querySelector('[data-spoken]');
const description=dialog.querySelector('[data-pitch]');
const why=dialog.querySelector('[data-why]');
const bookCover=dialog.querySelector('[data-cover]');
const control=document.createElement('div');
control.className='sales-voice';
control.innerHTML='<button class="sales-voice-play" type="button">▶ Hear the pitch</button><button class="sales-voice-stop" type="button" hidden>■ Stop</button><span class="sales-voice-state" role="status" aria-live="polite">Narration is off until you choose it.</span>';
const story=dialog.querySelector('.sg-story'), links=dialog.querySelector('.sg-links');
if(story&&links)story.insertBefore(control,links);
const play=control.querySelector('.sales-voice-play'),stop=control.querySelector('.sales-voice-stop'),msg=control.querySelector('.sales-voice-state');
const note=dialog.querySelector('.sg-footnote');
if(note)note.textContent='Prepared book introductions. Optional narration uses an available device voice—not a recorded performance by Don Sol or Curley.';
const prop=document.createElement('div');
prop.className='sales-stage-book';
prop.innerHTML='<img src="" alt="The featured book cover" width="160" height="230">';
stage?.appendChild(prop);
let activeTitle=null,activeUtterance=null;
function finish(message){
 activeUtterance=null;
 stop.hidden=true;
 dialog.classList.remove('sales-speaking');
 msg.textContent=message;
}
function halt(){
 if(activeUtterance&&voice)voice.cancel();
 finish('Narration stopped.');
}
function updateScene(){
 const title=titleNode?.textContent.trim();
 const script=scripts[title];
 if(!script)return;
 if(activeUtterance)halt();
 activeTitle=title;
 spoken.textContent=script[0]+': “'+script[1].slice(0,85)+'…”';
 description.textContent=script[1];
 why.textContent=script[0]==='Curley'?'For curious children and families. Try the opening, and join the adventure.':'See if the story grabs you: the opening pages are free to sample.';
 const image=prop.querySelector('img');image.src=bookCover?.getAttribute('src')||'';
 prop.hidden=script[0]!=='Curley';
 msg.textContent='Press play to hear '+script[0]+' with a device voice.';
 play.textContent='▶ Try device narration of '+script[0]+'\'s pitch';
 dialog.classList.remove('sales-curley-replay');
 if(script[0]==='Curley'){void dialog.offsetWidth;dialog.classList.add('sales-curley-replay');}
}
function speak(){
 const script=scripts[activeTitle];
 if(!script)return;
 if(!canSpeak){finish('Voice narration is unavailable here. You can read the full pitch above.');return;}
 voice.cancel();
 const u=new SpeechSynthesisUtterance(script[1]);
 activeUtterance=u;
 u.lang='en-US';u.rate=script[0]==='Curley'?1.09:.95;u.pitch=script[0]==='Curley'?1.28:.92;
 const options=voice.getVoices?.()||[];
 const english=options.find(v=>v.lang?.toLowerCase()==='en-us')||options.find(v=>v.lang?.toLowerCase().startsWith('en'));
 if(english)u.voice=english;
 u.onend=()=>{if(activeUtterance===u)finish('Finished. Ready to read a sample?')};
 u.onerror=()=>{if(activeUtterance===u)finish('Playback unavailable. Read the full pitch above instead.')};
 dialog.classList.add('sales-speaking');stop.hidden=false;msg.textContent='Playing '+script[0]+' pitch with a device voice.';
 try{voice.speak(u)}catch(e){finish('Playback unavailable. Read the full pitch above instead.')}
}
play.addEventListener('click',speak);
stop.addEventListener('click',halt);
dialog.addEventListener('close',halt);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&activeUtterance)halt()});
function openSales(t,audio){
 const card=findCard(t),button=card?.querySelector('.sg-meet-button');
 if(!button)return;
 button.click(); // Existing card listener opens the staged scripted pitch. Narration stays opt-in.
}
const hero=document.querySelector('.hero .hero-actions');
if(hero){
 const b=document.createElement('button');b.type='button';b.className='btn primary sales-hero-pitch';
 b.textContent='🎬 Let Don Sol pitch The Harness';
 b.addEventListener('click',()=>openSales('The Harness',false));
 hero.prepend(b);
 const curley=hero.querySelector('.sg-hero-curley');
 if(curley)curley.textContent='🐍 Curley pitches a book';
}
const speech=document.querySelector('#heroSpeech');
if(speech)speech.textContent='Pick a book, pull up a chair, and let me tell you why you might love it.';
cards.forEach(card=>{
 const btn=card.querySelector('.sg-meet-button'),t=card.querySelector('.book-title')?.textContent.trim();
 if(!btn||!scripts[t])return;
 const who=scripts[t][0];
 btn.textContent='🎬 See '+who+' pitch this book';
 btn.addEventListener('click',updateScene);
 if(who==='Curley'){
  const cover=card.querySelector('.cover');
  if(cover){const worm=document.createElement('span');worm.className='sales-card-worm';worm.setAttribute('aria-hidden','true');worm.textContent='🐍';cover.appendChild(worm)}
 }
});
document.addEventListener('click',e=>{
 const b=e.target.closest('.sg-hero-curley');if(b){updateScene()}
});
const showcase=document.createElement('section');
showcase.className='sales-showcase';
showcase.setAttribute('aria-label','Don Sol and Curley sell the books');
showcase.innerHTML='<div class="sales-head"><p class="eyebrow">THE BOOKSTORE HAS CHARACTERS</p><h3>Meet the story behind the cover.</h3><p>Don Sol pulls up a chair. Curley slithers toward the children’s shelf. They have something to tell you before you read the first page.</p></div>'+
'<div class="sales-pair">'+
'<article class="sales-person sales-person-don"><div class="sales-art"><img src="/assets/characters/don-sol-idealable-v3.svg" alt="Don Sol, the white-haired, white-bearded cartoon storyteller" width="898" height="610"><span class="sales-bubble">“Four AIs. One reset switch. What would YOU do?”</span></div><div class="sales-person-copy"><strong>😎 Don Sol · Your storyteller</strong><p>Pull up a chair. I’ll tell you about our AI thriller.</p><button type="button" data-sales-title="The Harness">🎬 See Don Sol pitch The Harness</button></div></article>'+
'<article class="sales-person sales-person-curley"><div class="sales-art"><img class="sales-books" src="/assets/covers/questions-v12.jpg" alt="The Book of Better Questions book cover" width="200" height="280"><svg class="sales-worm" viewBox="0 0 320 220" aria-hidden="true" focusable="false"><path d="M20 183Q5 129 50 111Q101 102 121 154Q131 193 92 197Q64 199 76 169Q97 136 160 160Q214 183 228 95" fill="none" stroke="#357366" stroke-width="38" stroke-linecap="round"/><path d="M20 183Q5 129 50 111Q101 102 121 154Q131 193 92 197Q64 199 76 169Q97 136 160 160Q214 183 228 95" fill="none" stroke="#8eecbb" stroke-width="27" stroke-linecap="round"/><ellipse cx="237" cy="72" rx="45" ry="42" fill="#a6f0c1" stroke="#327768" stroke-width="4"/><circle cx="221" cy="61" r="6" fill="#173332"/><circle cx="250" cy="61" r="6" fill="#173332"/><path d="M220 84Q237 96 254 81" fill="none" stroke="#317260" stroke-width="5" stroke-linecap="round"/><path d="M278 84L304 96L296 101" stroke="#f292a8" stroke-width="4" fill="none" stroke-linecap="round"/></svg><span class="sales-bubble">“Pssst! Wanna crawl into a book?”</span></div><div class="sales-person-copy"><strong>🐍 Curley · The bookworm</strong><p>Adventure, questions and a book worth burrowing into.</p><button type="button" data-sales-title="The Book of Better Questions">🎬 See Curley pitch this book</button></div></article></div>';
shelf.insertBefore(showcase,shelf.querySelector('.filters')||grid);
showcase.addEventListener('click',e=>{
 const b=e.target.closest('[data-sales-title]');
 if(b)openSales(b.dataset.salesTitle,false);
});
})();