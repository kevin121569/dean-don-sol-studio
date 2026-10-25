/* Original Librarian casting desk. No external calls, file uploads or persistence.
   Manually timed draft WebVTT; no implied speech-to-text or commercial approval. */
(() => {
 'use strict';
 const $=id=>document.getElementById(id);
 const elems=[...document.querySelectorAll('#captionGrid .cue')];
 const words=elems.map(el=>el.querySelector('p').textContent.replace(/^\s*\d+\s*/,'').trim());
 const checks=[...document.querySelectorAll('#checks [data-check]')];
 const fresh=()=>({file:null,url:null,hash:null,duration:null,cues:Array.from({length:5},()=>({start:'',end:''})),approved:{},notes:''});
 const takes={A:fresh(),B:fresh()};
 let current='A',verified=null;
 const audio=key=>$('audio'+key);
 const say=(id,msg)=>$(id).textContent=msg;
 function editStatus(message){
  verified=null;$('downloadVtt').disabled=true;
  if(message)say('captionStatus',message);
 }
 function show(){
  const take=takes[current];
  for(let i=0;i<elems.length;i++){
    for(const field of ['start','end'])elems[i].querySelector('.'+field).value=take.cues[i][field];
    elems[i].classList.remove('active');
  }
  checks.forEach(ch=>ch.checked=!!take.approved[ch.dataset.check]);
  $('notes').value=take.notes;
  const label=take.file?take.file.name+' · '+(take.duration===null?'loading duration':take.duration.toFixed(2)+' s'):'No '+current+' recording loaded';
  say('audioStatus','Selected Take '+current+': '+label+'. Files and notes stay in this page only.');
  say('captionStatus','Mark this take’s five sentence boundaries and validate; no automatic caption timing.');
  say('reviewStatus','Manual checks are not external licensing certification. Nothing is approved or published automatically.');
  $('vttPreview').textContent='WEBVTT\n\nNo validated timings for selected take.';
  verified=null;$('downloadVtt').disabled=true;
 }
 function selectedPlayer(){return audio(current)}
 function validate(){
  const take=takes[current],errs=[],out=[];
  if(!take.file)errs.push('Load a licensed audio file for Take '+current+'.');
  if(!Number.isFinite(take.duration)||take.duration<=0)errs.push('Wait until this audio reports a valid duration.');
  for(let i=0;i<5;i++){
    const a=take.cues[i].start,b=take.cues[i].end;
    const start=a===''?NaN:Number(a),end=b===''?NaN:Number(b);
    if(!Number.isFinite(start)||!Number.isFinite(end)||start<0||end<=start)errs.push('Line '+(i+1)+' needs a valid start and later end.');
    if(i>0&&Number.isFinite(start)&&out[i-1]&&start<out[i-1].end)errs.push('Line '+(i+1)+' starts before the previous line ends.');
    if(Number.isFinite(end)&&Number.isFinite(take.duration)&&end>take.duration+.02)errs.push('Line '+(i+1)+' runs past the audio duration.');
    out.push({start,end,text:words[i]});
  }
  return {ok:errs.length===0,errors:errs,cues:out};
 }
 function time(s){
  let ms=Math.round(s*1000);const hours=Math.floor(ms/3600000);ms%=3600000;
  const min=Math.floor(ms/60000);ms%=60000;const sec=Math.floor(ms/1000),m=ms%1000;
  return [hours,min,sec].map(v=>String(v).padStart(2,'0')).join(':')+'.'+String(m).padStart(3,'0');
 }
 function makeVtt(cues){
  return 'WEBVTT\n\nNOTE DRAFT editor timings; must be professionally verified against a licensed master before release.\n\n'
   +cues.map((c,i)=>(i+1)+'\n'+time(c.start)+' --> '+time(c.end)+'\n'+c.text+'\n').join('\n');
 }
 function download(filename,body,type){
  const u=URL.createObjectURL(new Blob([body],{type}));
  const link=document.createElement('a');link.href=u;link.download=filename;document.body.appendChild(link);
  link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(u),4000);
 }
 function sync(){
  const player=selectedPlayer(),t=player.currentTime;
  let active=-1;
  for(let i=0;i<5;i++){
    const start=takes[current].cues[i].start,end=takes[current].cues[i].end;
    if(start!==''&&end!==''&&Number(start)<=t&&t<Number(end)){active=i;break}
  }
  elems.forEach((el,i)=>el.classList.toggle('active',i===active));
 }
 async function load(key){
  const input=$('take'+key),file=input.files?.[0],take=takes[key];
  audio(key).pause();audio(key).removeAttribute('src');
  if(take.url){URL.revokeObjectURL(take.url);}
  takes[key]=fresh();const state=takes[key];
  audio(key).hidden=true;
  if(!file){say('info'+key,'Not loaded');if(current===key)show();return}
  const allow=/\.(wav|mp3|m4a|ogg)$/i.test(file.name)||/^audio\/(wav|x-wav|mpeg|mp4|ogg)$/i.test(file.type);
  if(!allow||file.size<=0||file.size>75*1024*1024){
    input.value='';say('info'+key,'Unsupported audio or over 75 MB. Choose WAV, MP3, M4A or OGG.');
    if(current===key)show();return;
  }
  state.file=file;state.url=URL.createObjectURL(file);
  const player=audio(key);player.src=state.url;player.hidden=false;player.load();
  say('info'+key,file.name+' · '+Math.round(file.size/1024)+' KB · local only');
  if(current===key)show();
  try{
    const buffer=await file.arrayBuffer();
    const hash=await crypto.subtle.digest('SHA-256',buffer);
    if(takes[key]===state){
      state.hash=[...new Uint8Array(hash)].map(v=>v.toString(16).padStart(2,'0')).join('');
      say('info'+key,file.name+' · SHA256 '+state.hash.slice(0,12)+'… · local only');
    }
  }catch(_){if(takes[key]===state)say('info'+key,file.name+' · audio loaded; SHA256 unavailable');}
 }
 for(const key of ['A','B']){
  $('take'+key).addEventListener('change',()=>{load(key).catch(()=>say('info'+key,'Unable to prepare audio.'));});
  audio(key).addEventListener('loadedmetadata',()=>{
    const dur=audio(key).duration;
    takes[key].duration=Number.isFinite(dur)&&dur>0?dur:null;
    if(current===key){
      say('audioStatus','Take '+key+': '+(takes[key].file?.name||'No file')+(takes[key].duration?' · '+dur.toFixed(2)+' seconds':' · duration unavailable'));
      editStatus('Audio metadata changed. Validate actual timing against this recording.');
    }
  });
  audio(key).addEventListener('play',()=>{
    const other=key==='A'?'B':'A';audio(other).pause();
    document.querySelector('[name="chosen"][value="'+key+'"]').checked=true;
    if(current!==key){current=key;show();}
  });
  audio(key).addEventListener('timeupdate',()=>{if(key===current)sync()});
 }
 for(const button of document.querySelectorAll('[name="chosen"]'))button.addEventListener('change',()=>{
   if(!button.checked)return;current=button.value;audio(current==='A'?'B':'A').pause();show();
 });
 elems.forEach((cue,i)=>{
  for(const field of ['start','end']){
   const input=cue.querySelector('.'+field);
   input.addEventListener('input',()=>{takes[current].cues[i][field]=input.value;editStatus('Timings changed. Validate them before exporting.');sync()});
   cue.querySelector('.mark-'+field).addEventListener('click',()=>{
    const take=takes[current],player=selectedPlayer();
    if(!take.file||!Number.isFinite(take.duration)){say('captionStatus','Load a take and wait for its duration before marking lines.');return}
    input.value=player.currentTime.toFixed(2);takes[current].cues[i][field]=input.value;
    editStatus('Marked line '+(i+1)+' '+field+' from the loaded audio; validate all five lines.');sync();
   });
  }
 });
 $('validate').addEventListener('click',()=>{
  const result=validate();
  if(!result.ok){
   editStatus('Not ready: '+result.errors.join(' '));
   $('vttPreview').textContent='WEBVTT\n\nNo valid draft exists. Correct all five timing ranges.';
   return;
  }
  verified={key:current,sha:takes[current].hash,filename:takes[current].file.name,signature:JSON.stringify(takes[current].cues),cues:result.cues};
  $('downloadVtt').disabled=false;
  say('captionStatus','Structure passes: five chronological, non-overlapping captions within this audio. A human must still verify audible synchronization.');
  $('vttPreview').textContent=makeVtt(result.cues);
 });
 $('downloadVtt').addEventListener('click',()=>{
  const v=validate(),s=takes[current];
  if(!verified||verified.key!==current||!v.ok||verified.signature!==JSON.stringify(s.cues)||verified.filename!==s.file?.name){
    editStatus('The selected audio/timings changed. Validate again.');return;
  }
  download('librarian-distance-'+current.toLowerCase()+'-DRAFT.vtt',makeVtt(v.cues),'text/vtt;charset=utf-8');
  say('captionStatus','Draft WebVTT downloaded. It is NOT approved or audible-sync certified.');
 });
 for(const c of checks)c.addEventListener('change',()=>{
  takes[current].approved[c.dataset.check]=c.checked;
  say('reviewStatus','Manual reviewer checks recorded in this page only; rights and timing evidence still require independent confirmation.');
 });
 $('notes').addEventListener('input',()=>{takes[current].notes=$('notes').value});
 $('downloadReport').addEventListener('click',()=>{
  const s=takes[current],v=validate(),passed=checks.filter(x=>s.approved[x.dataset.check]).length;
  const report={
    status:'DRAFT — NOT LICENSED OR AUTHORIZED FOR RELEASE',project:'THE IDEA LAB / THE LIBRARIAN',
    title:'The Distance Between Thoughts',take:current,file:s.file?{name:s.file.name,size_bytes:s.file.size,sha256:s.hash,duration_seconds:s.duration}:null,
    locked_dialogue:words.join(' '),cue_count:words.length,caption_structure_valid:v.ok,caption_errors:v.errors,
    cue_timings:v.ok?v.cues:null,reviewer_checks:Object.fromEntries(checks.map(c=>[c.dataset.check,!!s.approved[c.dataset.check]])),
    manual_review_completed:passed===checks.length&&v.ok,
    voice_rights_and_synced_captions_verified_by_studio:false,
    notes:s.notes,created_at:new Date().toISOString(),
    warnings:['A checked box is only a reviewer assertion, not a license or validation of audible timing.','Do not publish without a recorded master, documentation and final owner approval.']
  };
  download('librarian-distance-'+current.toLowerCase()+'-voice-review-DRAFT.json',JSON.stringify(report,null,2)+'\n','application/json');
  say('reviewStatus','Draft report downloaded to your device; no remote copy or publication was made.');
 });
 $('clearMarks').addEventListener('click',()=>{
  takes[current].cues=Array.from({length:5},()=>({start:'',end:''}));show();say('captionStatus','Selected take caption marks cleared.');
 });
 $('resetReview').addEventListener('click',()=>{
  takes[current].approved={};takes[current].notes='';show();say('reviewStatus','Selected take manual checks cleared.');
 });
 const clean=()=>{for(const key of ['A','B']){audio(key).pause();if(takes[key].url){URL.revokeObjectURL(takes[key].url);takes[key].url=null}}};
 window.addEventListener('pagehide',clean);
 show();
})();