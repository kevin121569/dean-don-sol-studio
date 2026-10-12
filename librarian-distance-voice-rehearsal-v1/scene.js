/* The Librarian / Distance voice rehearsal. Zero paid services, cookies or uploads.
   UK device voice = audition, NOT an approved narrator recording. The five
   sentence cues below are the unchanged, locked pitch from entrance.js. */
(() => {
 'use strict';
 const q=id=>document.getElementById(id);
 const nodes=[...document.querySelectorAll('#lines [data-line]')];
 const script=nodes.map(p=>p.textContent.trim());
 const play=q('playAudition'),stop=q('stopAudition'),status=q('voiceStatus');
 const cue=q('nowLine'),upload=q('localAudio'),audio=q('localPlayer');
 const fileNote=q('fileNote'),copy=q('copyDirection');
 const hasSpeech='speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
 const direction='Original fictional adult male English storyteller, gently softened educated Southern English / Received Pronunciation. Warm, literate, intimate, curious, slight dry humour, never grand or salesy. Smile on “tender question”; allow the question “Would continuity become a kind of love?” to breathe; close with a personal invitation. Read only the exact locked dialogue. No imitation of any existing actor, celebrity or public figure. No added words, effects, or music.';
 let voices=[],activeUtterance=null,cycle=0,objectUrl=null,recordedFile=null;
 function write(message){status.textContent=message}
 function caption(index){
   for(let i=0;i<nodes.length;i++)nodes[i].classList.toggle('active',i===index);
   cue.textContent=index>=0&&index<script.length?'“'+script[index]+'”':'“A story worth opening.”';
 }
 function updateVoices(){
   if(!hasSpeech)return;
   try{voices=window.speechSynthesis.getVoices().filter(v=>/^en[-_]GB$/i.test(v.lang))}catch(_){voices=[]}
 }
 function stopAudition(message){
   cycle++;
   try{if(hasSpeech)window.speechSynthesis.cancel()}catch(_){}
   activeUtterance=null;play.disabled=false;stop.disabled=true;
   caption(-1);
   if(message)write(message);
 }
 function selectVoice(){
   updateVoices();
   return voices.find(v=>/Daniel|Oliver|George|Arthur|British/i.test(v.name))||voices[0]||null;
 }
 function say(index,token,voice){
   if(token!==cycle)return;
   if(index>=script.length){
     activeUtterance=null;play.disabled=false;stop.disabled=true;
     caption(-1);write('The English (UK) device-voice audition has ended. This is not the actor’s recorded performance.');
     return;
   }
   caption(index);
   const u=new SpeechSynthesisUtterance(script[index]);
   u.voice=voice;u.lang='en-GB';u.rate=.88;u.pitch=.94;u.volume=1;
   activeUtterance=u;
   u.onend=()=>{if(token===cycle && activeUtterance===u)say(index+1,token,voice)};
   u.onerror=e=>{if(token===cycle)stopAudition('The device voice could not complete this audition. The full written script remains available.')};
   try{window.speechSynthesis.speak(u)}catch(_){stopAudition('Browser voice playback failed. You may still read the complete transcript.')}
 }
 play.addEventListener('click',()=>{
   if(!hasSpeech){write('This browser has no device speech support. The full transcript remains visible.');return}
   const voice=selectVoice();
   if(!voice){write('No English (UK) voice is installed in this browser. We will not silently substitute another accent. The complete written dialogue remains available.');return}
   audio.pause();
   stopAudition();
   play.disabled=true;stop.disabled=false;
   const token=cycle;
   write('Playing an optional English (UK) browser-device audition — not licensed actor audio or lip-sync.');
   say(0,token,voice);
 });
 stop.addEventListener('click',()=>stopAudition('Audition stopped. All of the original script remains readable below.'));
 upload.addEventListener('change',()=>{
   stopAudition();
   audio.pause();
   if(objectUrl){URL.revokeObjectURL(objectUrl);objectUrl=null;}
   audio.hidden=true;audio.removeAttribute('src');audio.load();
   const file=upload.files&&upload.files[0];
   recordedFile=null;
   if(!file){fileNote.textContent='No take loaded. Your file stays in this browser.';return}
   if(!(/\.(wav|mp3|ogg|m4a)$/i.test(file.name)||/^audio\/(wav|mpeg|ogg|mp4|x-wav)/i.test(file.type))||file.size>75*1024*1024){
     upload.value='';fileNote.textContent='Choose a WAV, MP3, M4A or OGG file smaller than 75 MB.';return;
   }
   objectUrl=URL.createObjectURL(file);recordedFile=file;
   audio.src=objectUrl;audio.hidden=false;
   caption(-1);cue.textContent='“Follow along in the complete transcript. This local recording has not been caption-timed.”';
   fileNote.textContent='Local rehearsal take: '+file.name+' ('+Math.round(file.size/1024)+' KB). No upload, automatic approval or publication.';
   write('Local audio ready for manual listening. Timing, speech rights and caption sync have not been certified.');
 });
 audio.addEventListener('play',()=>{stopAudition();cue.textContent='“Follow the full written transcript. Caption synchronization awaits the approved master.”';});
 audio.addEventListener('error',()=>{if(recordedFile)fileNote.textContent='The selected file could not play. Please use a standard WAV or MP3.'});
 copy.addEventListener('click',async()=>{
   const payload=direction+'\n\nAPPROVED SCRIPT (UNCHANGED):\n'+script.join(' ');
   try{
     await navigator.clipboard.writeText(payload);
     write('Performance direction and exact locked script copied. No recording generated.');
   }catch(_){write('Clipboard unavailable. The full script and performance direction are visible on the page.')}
 });
 document.addEventListener('visibilitychange',()=>{if(document.hidden){stopAudition();audio.pause()}});
 window.addEventListener('pagehide',()=>{stopAudition();audio.pause();if(objectUrl){URL.revokeObjectURL(objectUrl);objectUrl=null}});
 caption(0);
 if(!hasSpeech)write('Browser speech synthesis is not available. Read the full transcript or load a licensed audio take locally.');
 else {
   updateVoices();
   window.speechSynthesis.addEventListener?.('voiceschanged',updateVoices);
 }
})();