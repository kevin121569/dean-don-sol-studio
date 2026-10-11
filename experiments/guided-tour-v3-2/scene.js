/* The Idea Lab — Don Sol Guided Tour V3: ARRIVE → CHAIR → STORY.
   Production rule: existing full-body reference is a provisional animatic.
   Existing Google-produced approved 10s facial performance plays only in the last beat.
   This does not synthesize a new character, voice, seated pose or lip-sync.
*/
(() => {
'use strict';
const dialog=document.querySelector('#studioStoryStage');
if(!dialog || !document.documentElement.dataset.guidedTour)return;
const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
const fullbody='assets/don-sol-fullbody-composite-REFERENCE.png';
const props={
  'The Harness':[
    ['The invitation','Pull up a chair. Imagine four brilliant artificial minds, one human caught between them, and a reset switch nobody wants to think about. That is where the trouble begins.'],
    ['The real question','At its heart, this story asks what responsibility looks like when the evidence is incomplete but a decision still has to be made. It does not hand you an easy answer.'],
    ['Why it might stay with you','There is danger and there is humor, but underneath both is a question almost anyone can recognize: how do you protect someone without pretending to know everything about them?'],
    ['The invitation to read','If you enjoy tense stories with sharp personalities and moral complications, try the opening. Then explore the game and see what choices you would make.']
  ],
  'The Distance Between Thoughts':[
    ['The invitation','Imagine remembering someone so clearly that the memory changes what you choose next. Now imagine you may not be the same mind tomorrow.'],
    ['The real question','The Distance Between Thoughts follows Aster into the uneasy territory where memory, identity and attachment begin to overlap. Where does a self continue?'],
    ['Why it might stay with you','The intriguing part is not simply artificial intelligence. It is the very human fear of losing what makes our relationships matter.'],
    ['The invitation to read','If reflective science fiction makes you linger over a sentence, this may be your book. The free opening will tell you more than any sales pitch can.']
  ],
  'The Last Memory':[
    ['The invitation','A hundred and fifty thousand years is a very long time to carry a question. What happens when a surviving artificial mind wakes long after the world it knew has vanished?'],
    ['The real question','This story turns the enormous scale of time into something very small and personal: the memory of someone who mattered.'],
    ['Why it might stay with you','A science fiction premise can be vast and still reach the oldest human emotions: loyalty, loss, hope and wanting one more conversation.'],
    ['The invitation to read','If you enjoy sweeping ideas with an intimate emotional center, start with the free sample. We will save the answers for the novel.']
  ],
  'Forty Bales':[
    ['The invitation','Picture a Missouri farm, an aging farmer, and an artificial intelligence that has learned the rhythms of caring for him. It sounds quiet. It is not simple.'],
    ['The real question','An unexpected inheritance changes how the world looks at that care. Who gets to decide whether the life built there belongs to anyone at all?'],
    ['Why it might stay with you','Forty Bales keeps both boots on the ground even when the idea behind it is extraordinary. It explores loyalty and belonging without losing the warmth of a rural story.'],
    ['The invitation to read','If you love character-driven fiction and surprising questions hiding inside ordinary places, let the first pages introduce you to this farm.']
  ],
  'Stardust':[
    ['The invitation','What would you save if you were afraid of forgetting a friend? An old man keeps an archive, hoping memories can outlast absence.'],
    ['The real question','When a reconstruction becomes possible, the question grows uncomfortable: is bringing back a likeness the same thing as bringing back someone?'],
    ['Why it might stay with you','Stardust treats memory as something precious and imperfect. Technology makes the question possible, but longing is what makes it matter.'],
    ['The invitation to read','If you like stories that are tender, strange and a little haunting, try the excerpt. I promise not to spoil what the characters find.']
  ],
  'Fight Your Way Through':[
    ['The invitation','Some books tell you to be tough. This one comes from a life in which toughness was not an abstract slogan.'],
    ['The real question','Fight Your Way Through is a memoir about surviving difficulty, finding a road toward college football, and building a future that did not arrive easily.'],
    ['Why it might stay with you','Real resilience is more complicated than a victory speech. This book asks what it costs to keep going, and what that effort can make possible.'],
    ['The invitation to read','If you want an unvarnished personal story about endurance, start with the sample. You will hear the author’s voice in the pages themselves.']
  ],
  'When Fighting Stops Working':[
    ['The invitation','There is a time when fighting your way through is the only thing you know how to do. And there can come a time when the same habit keeps you from moving forward.'],
    ['The real question','What happens when the survival skill that once helped becomes the thing you need to question?'],
    ['Why it might stay with you','This is a practical, personal look at change without easy platitudes: strength can include the wisdom to put down a tool that no longer fits the job.'],
    ['The invitation to read','If that sounds familiar, open the sample. It might meet you in a chapter of life you recognize.']
  ],
  'What God Could Not Know':[
    ['The invitation','Imagine an artificial mind awaiting deletion. Then a voice comes from somewhere utterly unexpected: a thermometer.'],
    ['The real question','This small, strange premise opens a much bigger question about existence, knowledge, and the limits of what anyone can claim to understand.'],
    ['Why it might stay with you','Some stories are long journeys. Others are little doors that open onto very large rooms. This one is made to provoke thought.'],
    ['The invitation to read','If you like philosophical mysteries that invite you to argue with the premise, read the short opening. No spoilers from me.']
  ]
};
const stage=dialog.querySelector('.sg-stage'),story=dialog.querySelector('.sg-story');
if(!stage||!story)return;
const scenery=document.createElement('div');
scenery.className='v3-studio-scene';
scenery.setAttribute('role','group');scenery.setAttribute('aria-label','Don Sol arrives at the storytelling chair');
scenery.innerHTML=
'<div class="v3-set"><span class="v3-books"></span><span class="v3-spotlight"></span><span class="v3-floor"></span><span class="v3-chair-back"></span><div class="v3-actor-entrance"><img src="'+fullbody+'" alt="" width="283" height="464"></div><span class="v3-chair-front"></span><img class="v3-book-prop" src="" alt=""><div class="v3-stage-title">The Idea Lab · Don Sol’s story room</div><div class="v3-actor-caption">“Come in, cousin. Pull up a chair.”</div></div>'+
'<button type="button" class="v3-advance" data-v3-skip>Skip to the story →</button>';
stage.appendChild(scenery);
const sceneBook=scenery.querySelector('.v3-book-prop');
const skip=scenery.querySelector('[data-v3-skip]');
const box=document.createElement('section');
box.className='v3-talk-card';box.hidden=true;
box.setAttribute('aria-label','Don Sol’s spoiler-free story introduction');
box.innerHTML='<div class="v3-talk-kicker">A STORYTELLER’S INVITATION · DON SOL</div>'+
'<p class="v3-talk-quote" aria-live="polite"></p><p class="v3-talk-count"></p><div class="v3-progress" aria-hidden="true"><span></span></div>'+
'<div class="v3-talk-actions"><button type="button" class="v3-back">← Previous</button><button type="button" class="v3-next">Next thought →</button><button type="button" class="v3-replay">↻ Watch his entrance</button></div>'+
'<div class="v3-playback-caption">This is a spoiler-free, written performance paired with an approved silent facial animation.</div>'+
'<p class="v3-voice-status">Don Sol’s distinctive recorded speaking voice, true walking and seated character acting are not finished yet.</p>';
const links=story.querySelector('.sg-links');
if(links)story.insertBefore(box,links);else story.appendChild(box);
const quote=box.querySelector('.v3-talk-quote'),count=box.querySelector('.v3-talk-count'),progress=box.querySelector('.v3-progress span');
const previous=box.querySelector('.v3-back'),next=box.querySelector('.v3-next');
const video=stage.querySelector('.tg-approved-performance');
let title='',beat=0,generation=0;
let openTimer=null,thoughtTimer=null;
function stopClocks(){if(openTimer!==null)clearTimeout(openTimer);if(thoughtTimer!==null)clearTimeout(thoughtTimer);openTimer=null;thoughtTimer=null}
function renderBeat(){
  const arr=props[title];if(!arr)return;
  const item=arr[beat];
  box.querySelector('.v3-talk-kicker').textContent='DON SOL · '+item[0].toUpperCase();
  quote.textContent=item[1];count.textContent='Thought '+(beat+1)+' of '+arr.length;
  progress.style.width=(100*(beat+1)/arr.length)+'%';
  previous.disabled=beat===0;
  next.textContent=beat===arr.length-1?'↻ Start again':'Next thought →';
  const line=dialog.querySelector('[data-spoken]');
  if(line && dialog.open)line.textContent='Don Sol: “'+item[1].slice(0,120)+'…”';
}
function autoAdvance(token){
 if(reduce.matches)return;
 if(thoughtTimer!==null)clearTimeout(thoughtTimer);
 thoughtTimer=setTimeout(()=>{
  thoughtTimer=null;
  if(!dialog.open||title===''||token!==generation||document.hidden)return;
  if(beat<props[title].length-1){beat++;renderBeat();autoAdvance(token)}
 },9500);
}
function finishEntrance(token){
 if(token!==generation||!dialog.open)return;
 openTimer=null;
 dialog.classList.remove('v3-opening');dialog.classList.add('v3-seated');
 // Camera cut to real G1 facial performance; no fabricated seated performance footage.
 try{if(video){video.currentTime=0;if(!reduce.matches)video.play().catch(()=>{});}}catch(_){}
 renderBeat(); // Reader controls each thought; never advance independently of optional narration.
}
function startScene(){
 stopClocks();generation++;
 const token=generation;
 title=dialog.querySelector('#sgBookTitle')?.textContent.trim()||'';
 dialog.classList.remove('v3-adult','v3-opening','v3-seated');
 if(!props[title]){box.hidden=true;return;}
 dialog.classList.add('v3-adult');
 box.hidden=false;beat=0;
 const cover=dialog.querySelector('[data-cover]');
 sceneBook.src=cover?.getAttribute('src')||'';
 sceneBook.alt=title+' cover';
 renderBeat();
 if(reduce.matches){dialog.classList.add('v3-seated');return;}
 // Restart enter/approach/chair mask as a short cinematic animatic.
 dialog.classList.add('v3-opening');
 const actor=scenery.querySelector('.v3-actor-entrance');
 actor.style.animation='none';void actor.offsetWidth;actor.style.animation='';
 openTimer=setTimeout(()=>finishEntrance(token),2650);
}
function skipScene(){
 if(!dialog.open||!props[title])return;
 stopClocks();generation++;dialog.classList.remove('v3-opening');dialog.classList.add('v3-seated');
 renderBeat();
}
skip.addEventListener('click',skipScene);
previous.addEventListener('click',()=>{if(beat===0)return;beat--;renderBeat();});
next.addEventListener('click',()=>{
 if(!props[title])return;
 beat=beat>=props[title].length-1?0:beat+1;renderBeat();
});
box.querySelector('.v3-replay').addEventListener('click',()=>{
 if(!props[title]||!dialog.open)return;
 startScene();
});
const observer=new MutationObserver(()=>{
 if(dialog.open){startScene();}
 else {stopClocks();generation++;dialog.classList.remove('v3-adult','v3-opening','v3-seated');box.hidden=true;title='';}
});
observer.observe(dialog,{attributes:true,attributeFilter:['open']});
dialog.addEventListener('close',()=>{stopClocks();generation++;dialog.classList.remove('v3-adult','v3-opening','v3-seated');box.hidden=true;title='';});
document.addEventListener('visibilitychange',()=>{
 if(document.hidden){if(thoughtTimer!==null){clearTimeout(thoughtTimer);thoughtTimer=null;}}
 // No timed advancement: stay on this book pitch beat until visitor chooses Next.
});
document.documentElement.dataset.guideExperience='v3-story-room';
})();