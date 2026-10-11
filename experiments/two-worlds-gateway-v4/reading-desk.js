/* V4 — Reader's Desk. Reuses the published book HTML in a read-only iframe.
 * Reader never tracks visitors, copies book text, or sends prompts to a model. */
(() => {
 'use strict';
 const desk=document.getElementById('readingDesk');
 const iframe=document.getElementById('readerFrame');
 const title=document.getElementById('readingDeskTitle');
 const more=document.getElementById('readerExternal');
 const progress=document.getElementById('readerProgress');
 const bar=document.getElementById('readerProgressFill');
 const pitch=document.getElementById('bookDialog');
 const allowed={
  distance:'The Distance Between Thoughts',harness:'The Harness',memory:'The Last Memory',fight:'Fight Your Way Through',
  forty:'Forty Bales',stardust:'Stardust',stops:'When Fighting Stops Working',god:'What God Could Not Know'
 };
 let opener=null,scale=1,iframeListener=null,frameKeyListener=null;
 function validSample(href){
  try{
   const parsed=new URL(href,location.href);
   if(parsed.origin!==location.origin)return null;
   const match=/^\/samples\/(distance|harness|memory|fight|forty|stardust|stops|god)\.html$/.exec(parsed.pathname);
   return match?{url:parsed.pathname,title:allowed[match[1]]}:null;
  }catch(_){return null}
 }
 function setProgress(){
  try{
   const w=iframe.contentWindow;
   const root=w.document.scrollingElement || w.document.documentElement;
   const max=Math.max(0,root.scrollHeight-w.innerHeight);
   const pct=max<=0?100:Math.round(100*Math.min(1,Math.max(0,root.scrollTop/max)));
   progress.textContent=pct+'% of this opening excerpt';bar.style.width=pct+'%';
  }catch(_){progress.textContent='Read the original excerpt at your pace';bar.style.width='0%'}
 }
 function textSize(){
  try{
   const doc=iframe.contentDocument;
   if(!doc||doc.URL==='about:blank')return;
   let style=doc.getElementById('librarianReaderSize');
   if(!style){style=doc.createElement('style');style.id='librarianReaderSize';doc.head.appendChild(style)}
   style.textContent='main p:not(.end p), main li{font-size:'+Math.round(19*scale)+'px!important;line-height:1.78!important;}';
   setProgress();
  }catch(_){/* fallback is the untouched original excerpt */}
 }
 function frameLoaded(){
  try{
   const w=iframe.contentWindow;
   if(iframeListener)w.removeEventListener('scroll',iframeListener);
   iframeListener=()=>setProgress();w.addEventListener('scroll',iframeListener,{passive:true});
   frameKeyListener=(e)=>{if(e.key==='Escape'){e.preventDefault();desk.close()}};
   w.document.addEventListener('keydown',frameKeyListener);
   // The original sample may link to its book page or studio homepage. Keep the
   // on-page reading experience intact by opening those links separately.
   for(const link of w.document.querySelectorAll('a[href]')){
    if(!link.getAttribute('href').startsWith('#')){link.target='_blank';link.rel='noopener noreferrer'}
   }
   textSize();setProgress();
  }catch(_){progress.textContent='Original excerpt loaded · Read at your pace'}
 }
 function openSample(href,trigger){
  const book=validSample(href);if(!book||desk.open)return false;
  opener=trigger||document.activeElement;
  document.dispatchEvent(new Event('librarian:reader-open'));
  title.textContent=book.title;
  iframe.title='Read the original free excerpt of '+book.title;
  more.href=book.url;
  scale=1;progress.textContent='Opening '+book.title+'…';bar.style.width='0%';
  desk.showModal();iframe.src=book.url;
  document.getElementById('closeReadingDesk').focus();
  return true;
 }
 // Keep all original links working without JavaScript. Intercept only a plain, unmodified left-click
 // on actual eight published adult-book samples (never the children's samples).
 document.addEventListener('click',e=>{
  if(e.defaultPrevented||e.button!==0||e.ctrlKey||e.metaKey||e.altKey||e.shiftKey)return;
  const a=e.target.closest('a[href]');if(!a||a.target==='_blank'||desk.contains(a))return;
  const book=validSample(a.getAttribute('href'));if(!book)return;
  if(!document.getElementById('adultWorld').contains(a)&&!pitch.contains(a))return;
  e.preventDefault();openSample(book.url,a);
 });
 iframe.addEventListener('load',frameLoaded);
 document.getElementById('closeReadingDesk').addEventListener('click',()=>desk.close());
 document.getElementById('readerFooterClose').addEventListener('click',()=>desk.close());
 document.getElementById('readerLarger').addEventListener('click',()=>{scale=Math.min(1.5,+(scale+.1).toFixed(1));textSize()});
 document.getElementById('readerSmaller').addEventListener('click',()=>{scale=Math.max(.8,+(scale-.1).toFixed(1));textSize()});
 desk.addEventListener('close',()=>{
  // A closed reader should never keep the sample in memory or play media from its frame.
  iframe.src='about:blank';progress.textContent='Your chapter is ready';bar.style.width='0%';
  if(opener?.isConnected&&!opener.closest('[hidden]'))opener.focus({preventScroll:true});
  opener=null;
 });
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&desk.open){/* preserve reading place without autoplay */}});
})();
