/* Studio audition only. All audio stays in the browser; zero network requests, storage or uploads. */
(()=>{'use strict';
const SCRIPT={
 welcome:{name:'Welcome to the Library',words:"Ah, welcome. Come in, won't you? Here we keep the stories that ask difficult questions—and aren't afraid of untidy answers. Choose a book, and I'll tell you why it deserves a look. No spoilers. Just an invitation."},
 harness:{name:'Introduce The Harness',words:'Now here is an intriguing arrangement. Four very different artificial minds, a human caught between them, and a reset nobody can prove is harmless. The Harness has danger, wit and more than one uncomfortable question. If you like a thriller that trusts you to think as well as feel, I suggest you open the first chapter.'}
};
const direction='One original, fictional older adult male narrator, native British English with soft Southern English/Received Pronunciation, warm, literate, slightly amused and deeply welcoming. Measured but naturally conversational, no exaggerated aristocratic accent and no imitation of any actual person. Subtle wry smile on “Come in, won\'t you?” and a gentle thoughtful pause before “No spoilers.” Deliver ONLY the dialogue exactly as quoted, without extra sentences, music, effects, or sound. Studio-clean spoken audio.';
const el=id=>document.getElementById(id);
const player=el('auditionPlayer');
let current='welcome';let playingTake='',loaded={},url='',owned=[];
for(const key of ['welcome','harness'])loaded[key]={A:null,B:null};
function setStatus(s){el('status').textContent=s;}
function msg(s){el('playingNow').textContent=s;}
function clearPlaying(){player.pause();player.removeAttribute('src');player.load();playingTake='';url='';}
function update(){
 el('auditionText').textContent=SCRIPT[current].words;
 for(const [slot,fileID] of [['A','takeA'],['B','takeB']]){
  const file=loaded[current][slot];
  const input=el(fileID);input.value='';
  el('file'+slot).textContent=file?file.name+' · '+Math.round(file.size/1024)+' KB':'No recording loaded';
  el('play'+slot).disabled=!file;
 }
 clearPlaying();msg('Waiting for a recording.');el('durationNote').textContent='A longer voice introduction plays against the seated portrait. The original eight-second entrance remains silent; no lip-sync is represented.';
 document.querySelectorAll('[data-qa]').forEach(c=>c.checked=false);
 setStatus('Selected: '+SCRIPT[current].name+'. Audio files stay on this device.');
}
function valid(file){return !!file && (file.type.startsWith('audio/')||/\.(wav|mp3|m4a|ogg|flac)$/i.test(file.name)) && file.size<75*1024*1024;}
function pick(slot){
 const file=el('take'+slot).files[0];if(!file)return;
 if(!valid(file)){setStatus('Unsupported file or over 75 MB. Choose a WAV, MP3, M4A or OGG from Google.');el('take'+slot).value='';return;}
 loaded[current][slot]=file;el('file'+slot).textContent=file.name+' · '+Math.round(file.size/1024)+' KB';el('play'+slot).disabled=false;
 setStatus(SCRIPT[current].name+' · Take '+slot+' ready. Press Play to audition; no upload occurs.');
}
function play(slot){
 const file=loaded[current][slot];if(!file)return;
 if(playingTake===current+slot){if(player.paused)player.play().catch(()=>setStatus('This browser could not play that audio file.'));else player.pause();return;}
 clearPlaying();url=URL.createObjectURL(file);owned.push(url);player.src=url;playingTake=current+slot;
 msg('Playing '+SCRIPT[current].name+' · Take '+slot+' · '+file.name);
 player.play().catch(()=>setStatus('Playback failed. Try exporting a standard PCM WAV or MP3 from Google.'));
}
const copy=async(s)=>{try{await navigator.clipboard.writeText(s);setStatus('Copied to clipboard. This is the original locked script, not a new recording.');}catch(e){setStatus('Clipboard unavailable. Select and copy the visible text instead.');}};
for(const radio of document.querySelectorAll('[name="script"]'))radio.addEventListener('change',e=>{if(e.target.checked){current=e.target.value;update();}});
for(const slot of ['A','B']){el('take'+slot).addEventListener('change',()=>pick(slot));el('play'+slot).addEventListener('click',()=>play(slot));}
el('copyScript').addEventListener('click',()=>copy(SCRIPT[current].words));
el('copyPrompt').addEventListener('click',()=>copy(direction+'\n\nDIALOGUE TO SPEAK VERBATIM:\n"'+SCRIPT[current].words+'"'));
el('resetChecks').addEventListener('click',()=>{document.querySelectorAll('[data-qa]').forEach(c=>c.checked=false);setStatus('Audition checks cleared.');});
el('copyReport').addEventListener('click',()=>{
 const checks=[...document.querySelectorAll('[data-qa]')];const label=k=>loaded[current][k]?loaded[current][k].name:'NOT LOADED';
 const checked=checks.map(c=>(c.checked?'[x] ':'[ ] ')+c.dataset.qa).join('\n');
 const report='IDEA LAB STUDIO — LIBRARIAN ORIGINAL VOICE AUDITION\nDate: '+new Date().toLocaleDateString('en-US')+'\nScript: '+SCRIPT[current].name+'\nTake A: '+label('A')+'\nTake B: '+label('B')+'\nCheckpoints:\n'+checked+'\nStatus: STUDIO REVIEW ONLY, NOT AUTHORISED TO PUBLISH\nNotes: _______________\n';copy(report);
});
player.addEventListener('loadedmetadata',()=>{el('durationNote').textContent='Actual duration: '+Math.round(player.duration*10)/10+' seconds. The eight-second walk-to-chair footage is silent; use the seated portrait for narration, not simulated lip-sync.';});
player.addEventListener('pause',()=>{if(playingTake)msg('Paused · '+SCRIPT[current].name+' · Take '+playingTake.slice(-1));});
player.addEventListener('ended',()=>{msg('Finished · '+SCRIPT[current].name+' · Take '+playingTake.slice(-1));});
window.addEventListener('pagehide',()=>{clearPlaying();owned.forEach(o=>URL.revokeObjectURL(o));owned=[];});
update();
})();
