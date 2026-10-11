/* Original first Librarian actor, original silent 8-second editorial web cut; no cloud TTS or upload. */
(()=>{'use strict';
 const el=id=>document.getElementById(id);
 const film=el('entranceFilm'),portrait=el('seatedPortrait'),start=el('beginFilm'),skip=el('seatedButton'),again=el('replayFilm'),cue=el('screenCue');
 const status=el('filmStatus'),voiceStatus=el('voiceStatus'),voicePlay=el('voicePlay'),voiceStop=el('voiceStop'),mode=el('voiceMode'),fileInput=el('voiceFile');
 const script=el('welcomeScript').textContent.trim();
 const hasSpeech='speechSynthesis' in window&&'SpeechSynthesisUtterance' in window;
 let stage='ready',utterance=null,audio=null,localUrl=null,sessionVoice=null;
 function report(message){voiceStatus.textContent=message;}
 function endVoice(message){
   if(hasSpeech){try{window.speechSynthesis.cancel()}catch(_){}}
   if(audio){try{audio.pause();audio.currentTime=0;}catch(_){}audio.removeAttribute('src');audio.load();audio=null;}
   utterance=null;voiceStop.disabled=true;voicePlay.disabled=stage!=='seated';if(message)report(message);
 }
 function seated(){
   stage='seated';film.pause();portrait.hidden=false;start.hidden=true;again.hidden=false;skip.hidden=true;
   cue.textContent='Ah, welcome. Come in, won’t you?';voicePlay.disabled=false;
   status.textContent='Seated portrait. Hear an optional voice audition with an explicit click.';
   report('Ready. This is a device audition or a local recording, not the actor’s filmed speech.');
 }
 function watch(){
   endVoice('Original entrance: silent footage, then seated portrait.');
   stage='film';start.hidden=true;again.hidden=true;skip.hidden=false;portrait.hidden=true;voicePlay.disabled=true;
   cue.textContent='He approaches the armchair.';
   status.textContent='Playing the original eight-second silent entrance.';
   try{film.currentTime=0;const p=film.play();if(p&&p.catch)p.catch(()=>{seated();report('Video could not play; the seated portrait and full script remain available.');});}
   catch(_){seated();report('Video unavailable; you can still audition the seated welcome.');}
 }
 function spoken(){
   if(stage!=='seated')return;
   endVoice();voicePlay.disabled=true;voiceStop.disabled=false;
   if(mode.value==='file'){
     const file=fileInput.files?.[0];
     if(!file){endVoice('Choose a WAV or MP3 on your device first. No audio is uploaded.');return;}
     audio=new Audio();localUrl=URL.createObjectURL(file);audio.src=localUrl;
     audio.onended=()=>endVoice('Local recording finished.');
     audio.onerror=()=>endVoice('Your device could not play this file. Try a standard PCM WAV or MP3.');
     audio.play().catch(()=>endVoice('Playback was blocked by this browser. Tap Hear again.'));
     report('Playing your LOCAL audio take; this file is not uploaded or published.');
     return;
   }
   if(!hasSpeech){endVoice('Browser speech is unavailable; the complete welcome is written above.');return;}
   const voices=window.speechSynthesis.getVoices().filter(x=>/^en[-_]GB/i.test(x.lang));
   if(!voices.length){endVoice('No English (UK) voice is installed on this device. A different accent will not be substituted.');return;}
   const v=voices.find(x=>/Daniel|Oliver|George|Arthur|British/i.test(x.name))||voices[0];
   sessionVoice=v.name;const u=new SpeechSynthesisUtterance(script);u.lang='en-GB';u.voice=v;u.rate=.87;u.pitch=.94;utterance=u;
   u.onend=()=>{if(utterance===u)endVoice('English device-voice audition finished. The script remains readable.');};
   u.onerror=()=>{if(utterance===u)endVoice('Device voice unavailable; the original script remains readable.');};
   try{window.speechSynthesis.speak(u);report('Playing English (UK) device audition: '+sessionVoice+'. This is NOT recorded actor audio or lip sync.');}
   catch(_){endVoice('The English device voice could not start.');}
 }
 film.addEventListener('ended',seated);
 film.addEventListener('timeupdate',()=>{if(stage==='film'&&film.currentTime>4)cue.textContent='He takes his seat.';});
 start.addEventListener('click',watch);again.addEventListener('click',watch);skip.addEventListener('click',()=>{endVoice();seated()});
 voicePlay.addEventListener('click',spoken);voiceStop.addEventListener('click',()=>endVoice('Audition stopped; the script remains available.'));
 mode.addEventListener('change',()=>endVoice('Source selected: '+(mode.value==='device'?'English (UK) device audition.':'local WAV or MP3 file.')));
 fileInput.addEventListener('change',()=>{
   endVoice();const file=fileInput.files?.[0];
   el('fileStatus').textContent=file?'Selected locally: '+file.name+' · '+Math.round(file.size/1024)+' KB. No upload.':'No file selected.';
   if(file && (!file.type.startsWith('audio/')&&!/\.(wav|mp3|ogg|m4a)$/i.test(file.name)||file.size>=75*1024*1024)){fileInput.value='';el('fileStatus').textContent='Unsupported format or over 75 MB; use WAV or MP3 under 75 MB.';}
 });
 document.addEventListener('visibilitychange',()=>{if(document.hidden){endVoice('Audition stopped while away.');if(stage==='film')film.pause();}});
 window.addEventListener('pagehide',()=>{endVoice();if(localUrl)URL.revokeObjectURL(localUrl);});
 if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){status.textContent='Reduced motion respected. Select Go to his chair to skip the eight-second film.';}
})();
