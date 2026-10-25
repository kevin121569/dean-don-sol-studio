(() => {
  'use strict';
  const video=document.getElementById('donKidsVideo');
  const control=document.getElementById('donMotion');
  if(!video||!control)return;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  let playing=!reduced.matches;
  function sync(){
    control.textContent=playing?'Pause Don Sol':'Play Don Sol';
    control.setAttribute('aria-pressed',String(playing));
  }
  function play(){
    video.muted=true;
    video.play().then(()=>{playing=true;sync()}).catch(()=>{playing=false;sync()});
  }
  function pause(){video.pause();playing=false;sync()}
  if(reduced.matches)pause(); else play();
  control.addEventListener('click',()=>{if(video.paused){video.currentTime=0;play()}else pause()});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause()});
  video.addEventListener('error',()=>{playing=false;control.textContent='Don Sol animation unavailable';control.disabled=true});
  sync();
})();