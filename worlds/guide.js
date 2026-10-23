/* Studio Worlds V2: single-vector-body pen→Curley morph. One-shot and gesture driven. */
(() => {
  'use strict';
  const portal = document.getElementById('portal');
  if (!portal) return;
  const theater = portal.querySelector('[data-theater]');
  const paths = ['shadow','main','highlight'].map(key=>theater.querySelector('[data-morph-' + key + ']'));
  const head = theater.querySelector('[data-curley-head]');
  const face = theater.querySelector('[data-face]');
  const tongue = theater.querySelector('[data-tongue]');
  const cap = theater.querySelector('[data-pen-eraser]');
  const nib = theater.querySelector('[data-pen-nib]');
  const caption = theater.querySelector('[data-stage-caption]');
  const status = theater.querySelector('[data-portal-status]');
  const choices = [...portal.querySelectorAll('[data-guide-destination]')];
  const dialogue = portal.querySelector('[data-guide-dialogue]');
  const launch = portal.querySelector('[data-guide-launch]');
  const skip = portal.querySelector('[data-guide-skip]');
  const replay = portal.querySelector('[data-guide-replay]');
  const start = document.querySelector('[data-portal-start]');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const DURATION = 2400;
  const PENCIL = [30,156, 77,156,105,156,135,156, 165,156,200,156,234,156, 244,156,252,156,258,156];
  const CURLEY = [38,196, 12,126,86,96,119,145, 155,202,234,159,211,106, 199,81,207,73,224,61];
  const WORLD = {
    books: {href:'#books',name:'Books',text:'Percy keeps the chapters in order. Curley knows where the strange ideas hide. Your next stop: the books.',payoff:'Percy opens the bookshelf. Curley found your next story.'},
    games: {href:'#games',name:'Games',text:'Tooth says inspect the evidence first. Curley says the games are this way. You make the decisions.',payoff:'Curley found the games. Tooth demands a rematch.'},
    films: {href:'#films',name:'Films',text:'Lights, camera, inconvenient questions. Don Sol will show you the movie projects and teasers.',payoff:'Welcome to the screening room. Curley saved you a seat.'},
    animation: {href:'#animation',name:'Animation',text:'Percy opens a new pair of possibilities. Meet the animated worlds in development.',payoff:'Curley found the cartoons. Percy approves the parentheses.'}
  };
  const lerp = (a,b,t) => a+(b-a)*t;
  const clamp = v=>Math.max(0,Math.min(1,v));
  const smooth = v=> { v=clamp(v); return v*v*(3-2*v); };
  const range = (v,lo,hi)=>smooth((v-lo)/(hi-lo));
  const hex = (a,b,t)=> '#'+a.map((c,i)=>Math.round(lerp(c,b[i],t)).toString(16).padStart(2,'0')).join('');
  let selected='games',frame=null,generation=0;
  function pathFrom(points){
    const n=v=>Number(v.toFixed(2));
    return 'M '+n(points[0])+' '+n(points[1])+
      ' C '+[2,4,6].map(i=>n(points[i])+' '+n(points[i+1])).join(' ')+
      ' C '+[8,10,12].map(i=>n(points[i])+' '+n(points[i+1])).join(' ')+
      ' C '+[14,16,18].map(i=>n(points[i])+' '+n(points[i+1])).join(' ');
  }
  function paint(raw){
    const t=smooth(raw);
    const points=PENCIL.map((v,i)=>lerp(v,CURLEY[i],t));
    const d=pathFrom(points);
    paths.forEach(path=>path.setAttribute('d',d));
    paths[1].setAttribute('stroke',hex([217,181,127],[132,223,181],t));
    paths[2].setAttribute('stroke',hex([255,242,200],[207,255,220],t));
    const capFade=1-range(t,.13,.67);
    cap.setAttribute('transform','translate('+points[0].toFixed(2)+' '+points[1].toFixed(2)+') scale('+lerp(1,.4,t).toFixed(3)+')');
    cap.setAttribute('opacity',capFade.toFixed(3));
    const nx=points[18],ny=points[19];
    nib.setAttribute('transform','translate('+nx.toFixed(2)+' '+ny.toFixed(2)+') rotate('+lerp(0,-48,t).toFixed(2)+') scale('+lerp(1,.64,t).toFixed(2)+')');
    nib.setAttribute('opacity',(1-range(t,.27,.75)).toFixed(3));
    const emerge=range(t,.39,.86);
    head.setAttribute('transform','translate('+nx.toFixed(2)+' '+ny.toFixed(2)+') scale('+lerp(.05,1,emerge).toFixed(3)+')');
    head.setAttribute('opacity',emerge.toFixed(3));
    face.setAttribute('opacity',range(t,.68,.90).toFixed(3));
    tongue.setAttribute('opacity',range(t,.83,1).toFixed(3));
    theater.dataset.progress=String(Math.round(raw*100));
  }
  function stop(){
    generation++;
    if(frame!==null){window.cancelAnimationFrame(frame);frame=null}
  }
  function finish(){
    stop();
    paint(1);
    theater.dataset.state='complete';
    status.textContent='02 / CURLEY FOUND IT';
    caption.textContent=WORLD[selected].payoff;
  }
  function animate(){
    stop();
    if(motion.matches){finish();return}
    paint(0);
    theater.dataset.state='running';
    status.textContent='01 → 02 / THE TRANSFORMATION';
    caption.textContent='Watch closely. It’s the same little line.';
    const id=generation;
    let from=null;
    function tick(now){
      if(id!==generation)return;
      if(from===null)from=now;
      const t=clamp((now-from)/DURATION);
      paint(t);
      if(t<1)frame=window.requestAnimationFrame(tick);
      else{frame=null;finish()}
    }
    frame=window.requestAnimationFrame(tick);
  }
  function choose(which){
    if(!Object.prototype.hasOwnProperty.call(WORLD,which))return;
    selected=which;
    const target=WORLD[which];
    choices.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.guideDestination===which)));
    launch.href=target.href;
    launch.textContent='Explore '+target.name+' →';
    dialogue.textContent=target.text;
    animate();
  }
  choices.forEach(b=>b.addEventListener('click',()=>choose(b.dataset.guideDestination)));
  skip.addEventListener('click',finish);
  replay.addEventListener('click',animate);
  if(start) start.addEventListener('click',()=>choose(selected));
  const reducedChange=()=>{if(motion.matches)finish()};
  if(motion.addEventListener)motion.addEventListener('change',reducedChange);
  else if(motion.addListener)motion.addListener(reducedChange);
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&theater.dataset.state==='running')finish()});
  paint(0);theater.dataset.state='idle';
  launch.href=WORLD[selected].href;
  launch.textContent='Explore '+WORLD[selected].name+' →';
  choices.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.guideDestination===selected)));
})();
