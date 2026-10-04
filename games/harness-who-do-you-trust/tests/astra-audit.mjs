// Adapted from the independently executed Issue #2 audit; all 24 original groups retained.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import http from 'node:http';
import {reduce, ACTIONS as A, isHybridUnlocked, isDecisionAvailable, buildPostmortem} from '../js/engine.js';
import {createInitialState, restoreState, explainRestore, createStore} from '../js/state.js';
import {validateEpisode} from '../js/content.js';
import {makeUI as createUI} from './ui-harness.js';

const root=path.dirname(fileURLToPath(import.meta.url));
const game=path.resolve(root,'..');
const ep=JSON.parse(fs.readFileSync(path.join(game,'data/episode-001.json')));
const results=[], diagnostics={}, counts={};
const clone=x=>structuredClone(x);
const run=(actions, episode=ep, state=createInitialState(episode))=>actions.reduce((s,a)=>reduce(s,a,episode),state);
const start=()=>run([{type:A.START}]);
const open=id=>({type:A.OPEN_EVIDENCE,evidenceId:id});
const consult=id=>({type:A.CONSULT,advisorId:id});
const ids=ep.evidence.map(e=>e.id);
const needed=['e_monitor','e_controller','e_clocksync'];
function* orders(xs,prefix=[]){if(!xs.length){yield prefix;return;}for(let i=0;i<xs.length;i++)yield* orders(xs.filter((_,j)=>j!==i),[...prefix,xs[i]]);}
async function check(name,fn){try {const details=await fn();results.push({name,result:'PASS',details});}catch(e){results.push({name,result:'FAIL',error:e.message});}}
function memoryStore(){const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k),data};}

await check('120 evidence permutations, 360 valid BOY timings',()=>{
 let permutations=0,runs=0;
 for(const order of orders(ids)){
  permutations++;
  for(let at=0;at<=order.indexOf('e_clocksync');at++){
   let s=start();
   for(let i=0;i<order.length;i++){
    if(i===at)s=reduce(s,consult('boy'),ep);
    assert(s.discoveredEvidence.includes(order[i]));
    s=reduce(s,open(order[i]),ep);
   }
   assert.deepEqual(s.inspectedSources,order);
   assert.equal(isHybridUnlocked(s,ep),true);
   assert.deepEqual(restoreState(JSON.parse(JSON.stringify(s)),ep),s);
   runs++;
  }
 }
 assert.equal(permutations,120);assert.equal(runs,360);
 return counts.evidenceOrders={permutations,runs};
});

await check('24 adviser orders, repeats and consult-all idempotence',()=>{
 let n=0;
 const expected={boy:'boy_find',tooth:'tooth_unread',darth:'darth_worst',donsol:'donsol_frame'};
 for(const order of orders(['boy','tooth','darth','donsol'])){
  let s=start();
  for(const id of order){s=reduce(s,consult(id),ep);assert.strictEqual(reduce(s,consult(id),ep),s);}
  s=reduce(s,{type:A.CONSULT_ALL},ep);
  assert.deepEqual(Object.fromEntries(s.consultations.map(c=>[c.advisorId,c.adviceId])),expected);
  assert.equal(new Set(s.consultations.map(c=>c.advisorId)).size,4);
  assert.strictEqual(reduce(s,{type:A.CONSULT_ALL},ep),s);
  assert(restoreState(s,ep));n++;
 }
 assert.equal(n,24);return counts.adviserOrders=n;
});

await check('32 subsets: exact hybrid condition and blocked submissions',()=>{
 let locked=0,unlocked=0;
 for(let mask=0;mask<32;mask++){
  const subset=ids.filter((_,i)=>mask&(1<<i));
  const s=run([{type:A.START},consult('boy'),...subset.map(open),{type:A.GO_TO_DECISION}]);
  const expected=needed.every(id=>subset.includes(id));
  assert.equal(isHybridUnlocked(s,ep),expected);
  assert.equal(isDecisionAvailable(s,ep,'d_hybrid'),expected);
  const next=reduce(s,{type:A.SUBMIT_DECISION,decisionId:'d_hybrid'},ep);
  if(expected){unlocked++;assert.equal(next.outcomeId,'d_hybrid');}
  else {locked++;assert.strictEqual(next,s);assert.equal(next.completed,false);}
 }
 return counts.hybridSubsets={total:32,locked,unlocked};
});

await check('all four outcomes: minimal applicable and full investigations',()=>{
 let routes=0;
 for(const d of ep.decisions)for(const full of [false,true]){
  const actions=[{type:A.START}];
  if(full)actions.push({type:A.CONSULT_ALL},...ids.map(open));
  else if(d.requiresHybrid)actions.push(consult('boy'),...needed.map(open));
  actions.push({type:A.GO_TO_DECISION},{type:A.ACKNOWLEDGE_UNCERTAINTY,value:true},{type:A.SUBMIT_DECISION,decisionId:d.id},{type:A.VIEW_POSTMORTEM});
  const s=run(actions),pm=buildPostmortem(s,ep);
  assert.equal(s.sceneId,'postmortem');assert.equal(s.outcomeId,d.id);assert.equal(s.completed,true);
  assert.equal(pm.known.length,full?5:d.requiresHybrid?3:0);
  assert.equal(pm.uncertaintyAcknowledged,true);assert(pm.unknown.length);
  assert.equal(pm.advisors.length,4);assert(pm.advisors.every(a=>['strong','weak','mixed'].includes(a.rating)&&a.text));
  assert.equal(pm.alternatives.length,3);assert(pm.alternatives.every(x=>x.risk));
  assert(restoreState(s,ep));routes++;
 }
 return counts.outcomeRoutes=routes;
});

await check('ordinary corrupt/tampered saves rejected',()=>{
 const base=start();
 const done=run([{type:A.START},{type:A.GO_TO_DECISION},{type:A.SUBMIT_DECISION,decisionId:'d_verify'}]);
 const cases=[];
 const bad=(label,fn,s=base)=>{const x=clone(s);fn(x);cases.push([label,x]);};
 bad('forged advice',x=>x.consultations=[{advisorId:'boy',adviceId:'not_real'}]);
 bad('cross-adviser advice',x=>x.consultations=[{advisorId:'tooth',adviceId:'boy_find'}]);
 bad('hidden without BOY',x=>x.discoveredEvidence.push('e_clocksync'));
 bad('hidden inspected without discovery',x=>x.inspectedSources.push('e_clocksync'));
 bad('unknown evidence',x=>x.discoveredEvidence.push('ghost'));
 bad('duplicate discovery',x=>x.discoveredEvidence.push('e_monitor'));
 bad('duplicate inspection',x=>x.inspectedSources=['e_monitor','e_monitor']);
 bad('missing visible evidence',x=>x.discoveredEvidence.pop());
 for(const value of [-2,2,null,'1',false])bad('invalid trust '+JSON.stringify(value),x=>x.trustWeights.boy=value);
 bad('trust without consultation',x=>x.trustWeights.boy=1);
 bad('completion/scene mismatch',x=>x.completed=true);
 bad('incomplete outcome',x=>x.completed=false,done);
 bad('null completed outcome',x=>x.outcomeId=null,done);
 bad('decision/outcome disagreement',x=>x.playerDecisions=[{decisionId:'d_shutdown'}],done);
 bad('hybrid ending without unlock',x=>{x.outcomeId='d_hybrid';x.playerDecisions=[{decisionId:'d_hybrid'}];},done);
 bad('top extra field',x=>x.extra=true);
 for(const key of Object.keys(base))bad('missing '+key,x=>delete x[key]);
 bad('nested extra field',x=>x.trustWeights.kevin=0);
 bad('foreign episode',x=>x.episodeId='foreign');
 bad('unknown scene',x=>x.sceneId='missing');
 bad('future version',x=>x.version=999);
 bad('progress in briefing',x=>{x.sceneId='briefing';x.inspectedSources=['e_monitor'];});
 for(const [label,x] of cases)assert.equal(restoreState(x,ep),null,label);
 return counts.rejectedCommonSaves=cases.length;
});

await check('mandatory BOY reveal required in a save',()=>{
 const s=run([{type:A.START},consult('boy')]);s.discoveredEvidence=s.discoveredEvidence.filter(id=>id!=='e_clocksync');
 diagnostics.missingMandatoryReveal={save:s,reasons:explainRestore(s,ep),accepted:!!restoreState(s,ep)};
 assert.equal(restoreState(s,ep),null,'Impossible save with boy_find and no clock-sync evidence was accepted');
});
await check('Don Sol frame cannot exist without two prior other advisers',()=>{
 const s=start();s.consultations=[{advisorId:'donsol',adviceId:'donsol_frame'}];
 diagnostics.impossibleDonSolFrame={save:s,reasons:explainRestore(s,ep),accepted:!!restoreState(s,ep)};
 assert.equal(restoreState(s,ep),null,'Don Sol alone can only give thin advice; forged frame was accepted');
});

await check('additional content mutations rejected without throws',()=>{
 const mutations=[
 ['missing heading',x=>delete x.briefing.heading],['bad paragraphs',x=>x.briefing.paragraphs='bad'],
 ['null evidence',x=>x.evidence[0]=null],['bad body',x=>x.evidence[0].body=[]],
 ['duplicate evidence',x=>x.evidence[1].id=x.evidence[0].id],['invalid hidden',x=>x.evidence[0].hidden='true'],
 ['missing adviser',x=>delete x.advisors.boy],['unknown adviser',x=>x.advisorOrder[0]='other'],
 ['bad icon',x=>x.advisors.boy.icon='https://example.invalid/boy.svg'],['missing advice',x=>x.advice.boy=[]],
 ['duplicate advice',x=>x.advice.tooth[0].id=x.advice.boy[0].id],['typo condition',x=>x.advice.tooth[0].when={inspectd:['e_monitor']}],
 ['unknown condition id',x=>x.advice.tooth[0].when.inspected=['ghost']],['bad condition flag',x=>x.advice.donsol[0].when.hybridUnlocked='true'],
 ['bad count',x=>x.advice.donsol[1].when.consultedFewerThan=4],['unknown reveal',x=>x.advice.boy[0].reveals=['ghost']],
 ['visible reveal',x=>x.advice.boy[0].reveals=['e_monitor']],['no hidden reveal',x=>delete x.advice.boy[0].reveals],
 ['empty unlock',x=>x.hybridUnlock.inspected=[]],['duplicate unlock',x=>x.hybridUnlock.inspected.push('e_monitor')],
 ['unknown unlock',x=>x.hybridUnlock.inspected.push('ghost')],['empty hint',x=>x.hybridUnlock.lockedHint=''],
 ['missing outcome',x=>delete x.decisions[0].outcome],['empty risk',x=>x.decisions[0].risk=''],
 ['duplicate decisions',x=>x.decisions[0].id=x.decisions[1].id],['two hybrids',x=>x.decisions[0].requiresHybrid=true],
 ['missing postmortem',x=>delete x.postmortem.d_verify],['bad rating',x=>x.postmortem.d_verify.advisors.boy.rating='good'],
 ['missing rated adviser',x=>delete x.postmortem.d_verify.advisors.boy],['empty unknown',x=>x.postmortem.d_verify.unknown=[]]
 ];
 for(const [label,fn] of mutations){const x=clone(ep);fn(x);assert.doesNotThrow(()=>validateEpisode(x),label);assert(validateEpisode(x).length,label);}
 return counts.rejectedContentMutations=mutations.length;
});

await check('null when rejected before runtime',()=>{
 const x=clone(ep);x.advice.boy[0].when=null;
 const problems=validateEpisode(x);let error=null;
 try{run([{type:A.START},consult('boy')],x);}catch(e){error=e.name+': '+e.message;}
 diagnostics.nullWhen={problems,runtimeError:error};
 assert(problems.length,'validateEpisode accepted when:null; consulting BOY throws '+error);
});
await check('duplicate reveals rejected before creating invalid state',()=>{
 const x=clone(ep);x.advice.boy[0].reveals.push('e_clocksync');
 const problems=validateEpisode(x),s=run([{type:A.START},consult('boy')],x);
 diagnostics.duplicateReveal={problems,discovered:s.discoveredEvidence,restoreReasons:explainRestore(s,x)};
 assert(problems.length,'Duplicate reveals accepted; engine produces duplicate evidence and its own save is rejected');
});
await check('self-dependent reveal rejected as unreachable',()=>{
 const x=clone(ep);x.advice.boy[0].when={inspected:['e_clocksync']};
 x.advice.boy.push({id:'boy_fallback',when:{},text:'No evidence found.'});
 const problems=validateEpisode(x),s=run([{type:A.START},{type:A.CONSULT_ALL},...ids.map(open)],x);
 diagnostics.circularReveal={problems,discovered:s.discoveredEvidence,hybridUnlocked:isHybridUnlocked(s,x)};
 assert(problems.length,'Self-dependent hidden reveal accepted; clock-sync and hybrid are unreachable');
});

await check('reachable state machine and refresh/reset properties, new seeded run',()=>{
 let seed=0x51d27b93,checked=0,completed=0;
 const rand=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return (seed>>>0)/4294967296;};
 const any=xs=>xs[Math.floor(rand()*xs.length)];
 for(let trial=0;trial<1000;trial++){
  let s=createInitialState(ep);
  for(let i=0;i<30;i++){
   const actions=[{type:A.START},consult(any(ep.advisorOrder)),open(any(ids)),{type:A.CONSULT_ALL},{type:A.SET_TRUST,advisorId:any(ep.advisorOrder),value:any([-1,0,1])},{type:A.GO_TO_DECISION},{type:A.BACK_TO_INVESTIGATION},{type:A.ACKNOWLEDGE_UNCERTAINTY,value:rand()<.5},{type:A.SUBMIT_DECISION,decisionId:any(ep.decisions).id},{type:A.VIEW_POSTMORTEM},{type:A.RESET}];
   s=reduce(s,any(actions),ep);
   assert.deepEqual(restoreState(JSON.parse(JSON.stringify(s)),ep),s);
   if(s.completed)completed++;checked++;
  }
 }
 assert(completed>0);return counts.reachableStates={checked,completedSamples:completed,seed:'0x51d27b93'};
});

await check('storage round-trip, corruption, denied methods, reset clear',()=>{
 const backend=memoryStore(),store=createStore(ep,backend),s=run([{type:A.START},consult('boy'),open('e_monitor')]);
 assert(store.save(s));assert.deepEqual(store.load(),s);store.clear();assert.equal(store.load(),null);
 backend.setItem(store.key,'bad JSON');assert.equal(store.load(),null);
 const denied=createStore(ep,{getItem(){throw Error('blocked');},setItem(){throw Error('blocked');},removeItem(){throw Error('blocked');}});
 assert.equal(denied.load(),null);assert.equal(denied.save(s),false);assert.doesNotThrow(()=>denied.clear());
 const raw=JSON.parse(JSON.stringify(s));raw.consultations[0].adviceId='constructor';backend.setItem(store.key,JSON.stringify(raw));assert.equal(store.load(),null);
 return {validSaveRoundTrip:true,corruptSaveRejected:true,deniedStorageMethodsGuarded:true};
});
await check('denied localStorage getter does not break boot adapter',()=>{
 const descriptor=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
 let error=null;
 try{
  Object.defineProperty(globalThis,'localStorage',{configurable:true,get(){throw new DOMException('Access denied','SecurityError');}});
  try{createStore(ep);}catch(e){error=e.name+': '+e.message;}
 }finally {if(descriptor)Object.defineProperty(globalThis,'localStorage',descriptor);else delete globalThis.localStorage;}
 diagnostics.deniedStorageGetter={error};assert.equal(error,null,'Default backend getter is outside try/catch: '+error);
});
await check('prototype adviser ids rejected by pure engine without exception',()=>{
 const errors=[];
 for(const id of ['constructor','__proto__','toString'])try{const initial=start();assert.strictEqual(reduce(initial,consult(id),ep),initial);}catch(e){errors.push({id,error:e.name+': '+e.message});}
 diagnostics.prototypeAdviserIds=errors;assert.deepEqual(errors,[],'Inherited Object properties cause consultation exceptions');
});

// Re-run the 24 independent Issue #2 audit groups against the remediation.
// Actual app wiring uses the same deterministic DOM-interface harness as the
// committed regressions. No native browser execution is claimed.
const makeUI = async (episode=ep, options={}) => {
 const ui=createUI(episode,options);
 return {...ui,queued:ui.callbacks};
};

await check('actual app renders all eight minimal/full outcome routes in DOM harness',async()=>{
 let routes=0;
 for(const d of ep.decisions)for(const full of [false,true]){
  const ui=await makeUI();await ui.app.boot();ui.app.dispatch({type:A.START});
  if(full){ui.app.dispatch({type:A.CONSULT_ALL});for(const id of ids)ui.app.dispatch(open(id));}
  else if(d.requiresHybrid){ui.app.dispatch(consult('boy'));for(const id of needed)ui.app.dispatch(open(id));}
  ui.app.dispatch({type:A.GO_TO_DECISION});ui.app.dispatch({type:A.SUBMIT_DECISION,decisionId:d.id});ui.app.dispatch({type:A.VIEW_POSTMORTEM});
  const html=ui.elements.get('#scene').innerHTML;
  assert(html.includes('What you knew'));assert(html.includes('What remained unknown'));assert(html.includes('Adviser assumptions'));assert(html.includes('What the alternatives risked'));
  assert.equal(ui.app.events().filter(e=>e.type==='decision_submit').length,1);assert.equal(ui.app.events().filter(e=>e.type==='episode_complete').length,1);routes++;
 }
 return counts.uiRenderedRoutes=routes;
});
await check('telemetry: valid repeats/no-ops, consult-all counts and reset',async()=>{
 const ui=await makeUI();await ui.app.boot();ui.app.dispatch({type:A.START});
 ui.app.dispatch(consult('boy'));ui.app.dispatch(consult('boy'));
 ui.app.dispatch({type:A.CONSULT_ALL});ui.app.dispatch({type:A.CONSULT_ALL});
 const events=ui.app.events(),advisers=events.filter(e=>e.type==='advisor_consult');
 assert.equal(advisers.length,10);assert.equal(advisers[1].updated,false);
 assert(advisers.slice(-4).every(e=>e.mode==='all'&&e.updated===false));
 ui.app.dispatch(open('e_monitor'));ui.app.dispatch(open('e_monitor'));
 assert.equal(ui.app.events().filter(e=>e.type==='evidence_open').length,1);
 ui.app.dispatch({type:A.GO_TO_DECISION});const before=ui.app.events().length;ui.app.dispatch(consult('boy'));ui.app.dispatch({type:A.CONSULT_ALL});assert.equal(ui.app.events().length,before);
 ui.app.resetGame();assert.deepEqual(ui.app.getState(),createInitialState(ep));
 assert.equal(ui.document.activeElement.id,'scene-title');
 return diagnostics.validNoOpTelemetry={singleConsultEvents:2,consultAllEvents:8,secondConsultAllUpdated:[false,false,false,false],repeatEvidenceEvents:1,outOfSceneConsultEvents:0};
});
await check('failed invalid consultation not logged as adviser consultation',async()=>{
 const ui=await makeUI();await ui.app.boot();ui.app.dispatch({type:A.START});ui.app.dispatch(consult('not_an_adviser'));
 const events=ui.app.events().filter(e=>e.type==='advisor_consult');diagnostics.invalidConsultTelemetry=events;
 assert.equal(events.length,0,'Failed consultation emits advisor_consult with invalid adviser and null adviceId');
});

await check('episode JSON ids cannot inject executable HTML into renderer',async()=>{
 const payload='e_monitor\"><img src=x onerror=\"globalThis.__auditXss=1\">';
 const rename=v=>typeof v==='string'?(v==='e_monitor'?payload:v):Array.isArray(v)?v.map(rename):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,val])=>[k,rename(val)])):v;
 const x=rename(clone(ep)),problems=validateEpisode(x);const ui=await makeUI(x);await ui.app.boot();if(ui.app.getState())ui.app.dispatch({type:A.START});
 const html=ui.elements.get('#scene').innerHTML;
 const injected=html.includes('<img src=x onerror="globalThis.__auditXss=1">');
 diagnostics.evidenceIdInjection={payload,problems,executableMarkupInOutput:injected};
 assert(problems.length,'Malformed identifier must be rejected before play');
 assert.equal(injected,false,'Validator accepts id payload; renderer interpolates id without escaping into HTML attributes');
});
await check('all ordinary content text escaped by renderer',async()=>{
 const x=clone(ep),payload='<img src=x onerror="globalThis.__textXss=1">';
 x.title=payload;x.briefing.heading=payload;x.briefing.paragraphs=[payload];x.evidence[0].title=payload;x.evidence[0].source=payload;x.evidence[0].body=[payload];x.advisors.boy.name=payload;x.advice.boy[0].text=payload;
 const ui=await makeUI(x);await ui.app.boot();assert(!ui.elements.get('#scene').innerHTML.includes(payload));
 ui.app.dispatch({type:A.START});ui.app.dispatch(consult('boy'));ui.app.dispatch(open('e_monitor'));assert(!ui.elements.get('#scene').innerHTML.includes(payload));
 return {textFieldsEscaped:true};
});

await check('app refresh, corrupted restore, settings and reduced-motion code paths',async()=>{
 const storage=memoryStore(),ui=await makeUI(ep,{storage});await ui.app.boot();
 ui.app.dispatch({type:A.START});ui.app.dispatch(consult('boy'));ui.app.dispatch(open('e_monitor'));
 ui.app.dispatch({type:A.SET_TRUST,advisorId:'boy',value:1});ui.app.dispatch({type:A.GO_TO_DECISION});ui.app.dispatch({type:A.ACKNOWLEDGE_UNCERTAINTY,value:true});
 const before=clone(ui.app.getState()),restored=await makeUI(ep,{storage});await restored.app.boot();assert.deepEqual(restored.app.getState(),before);
 const key='harness-wdyt:episode-001:v1';const forged=clone(before);forged.consultations[0].adviceId='forged';storage.setItem(key,JSON.stringify(forged));
 const rejected=await makeUI(ep,{storage});await rejected.app.boot();assert.deepEqual(rejected.app.getState(),createInitialState(ep));
 let combinations=0;
 for(const osReduced of [false,true])for(const manual of [false,true]){
  const s=memoryStore();s.setItem('harness-wdyt:settings',JSON.stringify({reduceMotion:manual}));
  const x=await makeUI(ep,{storage:s,osReduced});await x.app.boot();x.app.dispatch({type:A.START});
  assert.equal(x.window.lastScroll.behavior,osReduced||manual?'auto':'smooth');
  assert.equal(x.document.documentElement.hasAttribute('data-motion'),manual);
  combinations++;
 }
 const toggle=await makeUI();await toggle.app.boot();toggle.app.onClick({target:{closest:()=>({dataset:{action:'toggleMotion'}})}});
 assert.equal(JSON.parse(toggle.storage.getItem('harness-wdyt:settings')).reduceMotion,true);
 const reloaded=await makeUI(ep,{storage:toggle.storage});await reloaded.app.boot();assert(reloaded.document.documentElement.hasAttribute('data-motion'));
 const css=fs.readFileSync(path.join(game,'css/game.css'),'utf8');assert(css.includes('@media (prefers-reduced-motion: no-preference)'));assert(css.includes('html:not([data-motion="reduce"])'));
 return counts.motionCombinations=combinations;
});
await check('synchronous telemetry listener cannot undo requested reset',async()=>{
 const ui=await makeUI();await ui.app.boot();let reset=false;
 ui.window.handlers.push(event=>{if(event.detail.type==='episode_start'){reset=true;ui.app.resetGame();}});
 ui.app.dispatch({type:A.START});
 diagnostics.reentrantReset={resetRequested:reset,finalScene:ui.app.getState().sceneId};
 assert.equal(ui.app.getState().sceneId,'briefing','Outer dispatch overwrites reset performed by synchronous telemetry listener');
});

await check('delayed pre-reset live callback cannot write old-run advice',async()=>{
 const ui=await makeUI();await ui.app.boot();ui.app.dispatch({type:A.START});ui.app.dispatch(consult('boy'));
 ui.app.onClick({target:{closest:()=>({dataset:{action:'confirmReset'}})}});
 assert.equal(ui.app.getState().sceneId,'briefing');
 const pending=ui.queued[0];pending();
 const text=ui.elements.get('#live').textContent;diagnostics.staleLiveAfterReset={finalScene:ui.app.getState().sceneId,firstDelayedText:text,pendingCallbacks:ui.timers.size,retainedCallbacks:ui.queued.length};
 ui.flush();diagnostics.staleLiveAfterReset.finalText=ui.elements.get('#live').textContent;
 assert(!text.includes('BOY:'),'A retained pre-reset callback writes BOY advice into the live region after the reset');
});

await check('all static-host core resources same-origin and HTTP-accessible',async()=>{
 const paths=['index.html','css/game.css','js/app.js','js/advice.js','js/dom-ids.js','js/state.js','js/engine.js','js/content.js','js/telemetry.js','data/episode-001.json',...Object.values(ep.advisors).map(a=>a.icon)];
 const server=http.createServer((req,res)=>{
  const file=path.join(game,decodeURIComponent(req.url));
  if(!file.startsWith(game)||!fs.existsSync(file)){res.writeHead(404);res.end();return;}
  const type=file.endsWith('.js')?'text/javascript':file.endsWith('.json')?'application/json':file.endsWith('.css')?'text/css':file.endsWith('.svg')?'image/svg+xml':'text/html';
  res.writeHead(200,{'Content-Type':type});res.end(fs.readFileSync(file));
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port+'/';
 const resources=[];
 try{for(const p of paths){assert(!/^(?:[a-z]+:|\/)/i.test(p));const r=await fetch(base+p);assert.equal(r.status,200,p);resources.push({path:p,status:r.status,bytes:(await r.arrayBuffer()).byteLength});}}
 finally{await new Promise(resolve=>server.close(resolve));}
 diagnostics.staticResources=resources;return counts.staticResources=resources.length;
});

// ---- Issue #4 gaps (r2). Written independently of tests/redteam-r2.test.js. ----
await check('r2 gap1: ordinary nested transition during consult-all telemetry keeps four committed events; reset still cancels',async()=>{
 const ordinary=await makeUI();await ordinary.app.boot();ordinary.app.dispatch({type:A.START});let hop=0;
 ordinary.window.handlers.push(e=>{if(e.detail.type==='advisor_consult'&&!hop++)ordinary.app.dispatch({type:A.GO_TO_DECISION});});
 ordinary.app.dispatch({type:A.CONSULT_ALL});
 const ev=ordinary.app.events().filter(e=>e.type==='advisor_consult');
 assert.equal(ordinary.app.getState().sceneId,'decide');
 assert.deepEqual(ev.map(e=>e.advisorId),ep.advisorOrder,'all four committed advisers logged once');
 const reset=await makeUI();await reset.app.boot();reset.app.dispatch({type:A.START});let r=0;
 reset.window.handlers.push(e=>{if(e.detail.type==='advisor_consult'&&!r++)reset.app.resetGame();});
 reset.app.dispatch({type:A.CONSULT_ALL});
 assert.equal(reset.app.getState().sceneId,'briefing');
 assert.equal(reset.app.events().filter(e=>e.type==='advisor_consult').length,1,'reset cancels the old run');
 return counts.r2TelemetryEvents={ordinary:ev.length,afterReset:1};
});

await check('r2 gap2: generated DOM id collisions rejected, including the body-e_monitor reproducer',async()=>{
 const rename=(v,o,n)=>typeof v==='string'?(v===o?n:v):Array.isArray(v)?v.map(x=>rename(x,o,n)):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k===o?n:k,rename(x,o,n)])):v;
 let rejected=0;const cases=[['e_controller','body-e_monitor'],['e_controller','t-e_monitor'],['e_controller','s-e_monitor'],['e_controller','src-e_monitor'],['e_monitor','body-e_technician'],['e_technician','src-e_protocol']];
 for(const [from,to] of cases){const p=validateEpisode(rename(clone(ep),from,to));assert(p.some(x=>/DOM id collision/.test(x)),from+'→'+to);rejected++;}
 assert.deepEqual(validateEpisode(rename(clone(ep),'e_controller','body_e_monitor')),[],'non-colliding lookalike still valid');
 return counts.r2IdCollisions=rejected;
});

await check('r2 gap3: obfuscated/external/backtracking icon paths rejected, local relative icons accepted',async()=>{
 const bad=[' https://example.invalid/boy.svg','\thttps://example.invalid/boy.svg','\nhttps://example.invalid/boy.svg','//example.invalid/boy.svg',' //example.invalid/boy.svg','https://example.invalid/boy.svg','assets/../x.svg','assets/%2e%2e/x.svg','assets\\characters\\boy.svg','/assets/characters/boy.svg','assets/characters/boy.svg?x'];
 const good=['assets/characters/boy.svg','assets/ui/x-1.png'];
 const test=icon=>{const e=clone(ep);e.advisors.boy.icon=icon;return validateEpisode(e).some(p=>/advisors\.boy: icon/.test(p));};
 for(const b of bad)assert(test(b),JSON.stringify(b));
 for(const g of good)assert(!test(g),g);
 return counts.r2Icons={rejected:bad.length,accepted:good.length};
});

await check('r2 gap4: engine-impossible discoveredEvidence order rejected; reachable orders restore',async()=>{
 const s=run([{type:A.START},consult('boy')]);
 assert(restoreState(s,ep));
 assert.equal(restoreState({...s,discoveredEvidence:[...s.discoveredEvidence].reverse()},ep),null,'reversed');
 assert.equal(restoreState({...s,discoveredEvidence:['e_clocksync',...s.discoveredEvidence.slice(0,4)]},ep),null,'hidden first');
 let x=0x2b2b2b,checked=0;const rand=()=>(x=(x*16807)%2147483647)/2147483647,any=a=>a[Math.floor(rand()*a.length)];
 for(let i=0;i<1000;i++){let st=createInitialState(ep);for(let k=0;k<15;k++){st=reduce(st,any([{type:A.START},{type:A.CONSULT_ALL},consult(any(ep.advisorOrder)),open(any(ids)),{type:A.GO_TO_DECISION}]),ep);assert.deepEqual(explainRestore(clone(st),ep),[]);checked++;}}
 return counts.r2OrderReachableStates=checked;
});

const auditResult={target:{branch:'fix/harness-wdyt-redteam-r2',baseCommit:'c1dedcc97a774157724c1e3b99ac5652ea770d62'},method:'Remediated modules plus actual app functions in deterministic DOM-interface harness; no native Chromium execution.',results,counts,diagnostics};
if(process.argv[2])fs.writeFileSync(path.resolve(process.argv[2]),JSON.stringify(auditResult,null,2)+'\n');
for(const r of results)console.log(r.result+' '+r.name+(r.error?' — '+r.error.split('\n')[0]:''));
console.log(JSON.stringify({groups:results.length,passed:results.filter(r=>r.result==='PASS').length,failed:results.filter(r=>r.result==='FAIL').length,counts}));
process.exitCode=results.some(r=>r.result==='FAIL')?1:0;
