(function(){
  'use strict';
  // RELEASE GATE: both values are intentionally unset in the repo. Activation is a separate, approved change
  // (see workers/ask-don-sol/README.md). While ENDPOINT is empty the page is a non-functional preview.
  var ENDPOINT = (typeof window.ASK_DON_SOL_ENDPOINT === 'string') ? window.ASK_DON_SOL_ENDPOINT : '';
  var SITEKEY = (typeof window.ASK_DON_SOL_TURNSTILE_SITEKEY === 'string') ? window.ASK_DON_SOL_TURNSTILE_SITEKEY : '';
  var TIMEOUT_MS = 20000, MAX_MSGS = 12;
  var log=document.getElementById('adsLog'), form=document.getElementById('adsForm'),
      input=document.getElementById('adsInput'), send=document.getElementById('adsSend'),
      status=document.getElementById('adsStatus'), starters=document.getElementById('adsStarters'),
      preview=document.getElementById('adsPreview'), tsBox=document.getElementById('adsTurnstile');
  var history=[], busy=false, tsId=null;
  var OFFLINE='Don Sol’s AI chat isn’t live yet. You can browse the shelves, meet the Librarian, or email donsol@theidealabstudio.com.';
  function add(cls,text){var li=document.createElement('li');li.className=cls;li.textContent=text;log.appendChild(li);log.scrollTop=log.scrollHeight;return li;}
  function setStatus(t,err){status.textContent=t||'';status.className='ads-status'+(err?' err':'');}
  function setBusy(b){busy=b;send.disabled=b;input.disabled=b;}
  // Keep history valid for the API: starts with a user turn, strictly alternating, bounded.
  function trim(){ if(history.length>MAX_MSGS) history=history.slice(-MAX_MSGS); while(history.length&&history[0].role!=='user') history.shift(); }
  if(!ENDPOINT){
    setBusy(true); input.placeholder='Coming soon'; [].forEach.call(starters.querySelectorAll('button'),function(b){b.disabled=true;});
    setStatus(OFFLINE,true);
  } else if(preview){ preview.hidden=true; }
  function loadTurnstile(){
    return new Promise(function(res,rej){
      if(window.turnstile) return res();
      var s=document.createElement('script');s.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';s.async=true;
      s.onload=function(){res();};s.onerror=function(){rej(new Error('challenge'));};document.head.appendChild(s);
    });
  }
  var tsRes=null,tsRej=null,tsTimer=null;
  function tsOk(tok){clearTimeout(tsTimer);if(tsRes){var r=tsRes;tsRes=tsRej=null;r(tok);}}
  function tsBad(){clearTimeout(tsTimer);if(tsRej){var r=tsRej;tsRes=tsRej=null;r(new Error('challenge'));}}
  function getToken(){
    if(!SITEKEY) return Promise.resolve('');
    return loadTurnstile().then(function(){
      return new Promise(function(res,rej){
        tsRes=res;tsRej=rej;clearTimeout(tsTimer);tsTimer=setTimeout(tsBad,15000);
        // render-time callbacks resolve whichever request is pending; tokens are single-use, so reset before each execute
        if(tsId===null){tsId=window.turnstile.render(tsBox,{sitekey:SITEKEY,execution:'execute',appearance:'interaction-only',callback:tsOk,'error-callback':tsBad,'timeout-callback':tsBad,'expired-callback':tsBad});}
        else{window.turnstile.reset(tsId);}
        window.turnstile.execute(tsId);
      });
    });
  }
  async function ask(text){
    if(busy||!ENDPOINT) return; text=(text||'').trim(); if(!text) return;
    add('you',text);
    history.push({role:'user',content:text}); trim();
    setBusy(true); setStatus('Don Sol is thinking…');
    var pending=add('don pending','…');
    var ctl=new AbortController(), t=setTimeout(function(){ctl.abort();},TIMEOUT_MS);
    try{
      var token=await getToken();
      var r=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:history,turnstileToken:token}),signal:ctl.signal});
      if(r.status===429) throw new Error('rate');
      if(r.status===403) throw new Error('challenge');
      if(!r.ok) throw new Error('http'+r.status);
      var data=await r.json();
      var reply=(data&&typeof data.reply==='string')?data.reply.trim():'';
      if(!reply) throw new Error('empty');
      pending.className='don';pending.textContent=reply;
      history.push({role:'assistant',content:reply});trim();
      setStatus('');
    }catch(e){
      history.pop(); // drop the unanswered user turn so history stays alternating
      pending.className='sys';
      pending.textContent = e.name==='AbortError' ? 'That took too long. Please try again.'
        : e.message==='rate' ? 'Don Sol needs a breather. Please try again in a minute.'
        : e.message==='challenge' ? 'The bot check didn’t pass. Please try again.'
        : 'Don Sol can’t be reached right now. Please try again later, or email donsol@theidealabstudio.com.';
      setStatus('Message not delivered.',true);
    }finally{clearTimeout(t);setBusy(false);input.focus();log.scrollTop=log.scrollHeight;}
  }
  form.addEventListener('submit',function(e){e.preventDefault();if(busy)return;var v=input.value;input.value='';ask(v);});
  input.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();form.requestSubmit();}});
  starters.addEventListener('click',function(e){if(e.target.tagName==='BUTTON'&&!e.target.disabled){ask(e.target.textContent);}});
  add('don','Welcome in. I’m Don Sol, an AI host of the Idea Lab. When the chat opens, ask me about the books, the films, the games, or the strange questions behind them.');
})();
