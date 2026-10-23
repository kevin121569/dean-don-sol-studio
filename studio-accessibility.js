(() => {
  'use strict';
  const trigger=document.getElementById('openConcierge')||document.querySelector('[data-open-concierge]');
  const panel=document.getElementById('concierge');
  const close=document.getElementById('closeConcierge');
  if(!trigger||!panel||!close)return;
  trigger.setAttribute('aria-controls','concierge');
  const isOpen=()=>!panel.hidden;
  const focusables=()=>[...panel.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter(el=>!el.disabled&&!el.hidden);
  const sync=()=>{
    const open=isOpen();
    trigger.setAttribute('aria-expanded',String(open));
    if(open && !panel.contains(document.activeElement)) (focusables()[0]||close).focus();
  };
  new MutationObserver(sync).observe(panel,{attributes:true,attributeFilter:['hidden']});
  document.addEventListener('keydown',e=>{
    if(!isOpen())return;
    if(e.key==='Escape'){e.preventDefault();close.click();trigger.focus();return;}
    if(e.key!=='Tab')return;
    const list=focusables(); if(!list.length)return;
    const first=list[0],last=list[list.length-1];
    if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus();}
  });
  close.addEventListener('click',()=>{trigger.setAttribute('aria-expanded','false');queueMicrotask(()=>trigger.focus());});
  sync();
})();