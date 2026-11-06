// Run: node tests/ask-don-sol.cjs   (local only: stubbed AI + mocked provider; no network, no cost)
const http=require('http'),fs=require('fs'),path=require('path'),{pathToFileURL}=require('url');const {chromium}=require('playwright');
const root=path.join(__dirname,'..');const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.mp4':'video/mp4','.json':'application/json'};
const srv=http.createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]);let f=path.join(root,p);if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');if(!fs.existsSync(f)){s.writeHead(404);return s.end('nf')}s.writeHead(200,{'content-type':types[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(s)});
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const noHScroll=pg=>pg.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth);

async function browserTests(){
 await new Promise(r=>srv.listen(0,r));const B='http://localhost:'+srv.address().port;const br=await chromium.launch();
 const nav=['Books','Library','Kids','Games','Film','Animation','Reader List','About']; // Ask Don Sol link hidden until AI is live
 for(const [n,vp] of [['desktop',{width:1366,height:850}],['mobile',{width:390,height:844}]]){
  const c=await br.newContext({viewport:vp,isMobile:n==='mobile'});
  for(const p of ['/library/','/games/','/film/','/animation/','/ask-don-sol/']){const pg=await c.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
   await pg.goto(B+p);const t=await pg.$$eval('nav.book-nav a',a=>a.map(x=>x.textContent.trim()));
   ok(JSON.stringify(t)===JSON.stringify(nav),`${n} ${p} nav = ${nav.length} items`);
   const hrefs=await pg.$$eval('nav.book-nav a',a=>a.map(x=>x.getAttribute('href')));
   ok(hrefs.includes('../#reader-list')&&hrefs.includes('../#studio')&&!hrefs.some(x=>x.includes('ask-don')),`${n} ${p} reader-list/about hrefs, no public Ask Don Sol link`);
   ok(await noHScroll(pg),`${n} ${p} no horizontal scroll`);ok(errs.length===0,`${n} ${p} no page errors`);await pg.close()}
  for(const p of ['/kids/','/the-harness/','/stardust/']){const pg=await c.newPage();await pg.goto(B+p);ok(!(await pg.content()).includes('Ask Don Sol'),`${n} ${p} unchanged (no Ask Don Sol: Kids and book pages excluded)`);await pg.close()}
  let pg=await c.newPage();await pg.goto(B+'/');const hn=await pg.$$eval('nav.nav a, nav.mobile-nav a',a=>a.map(x=>x.textContent.trim()));
  ok(hn.length===16&&!hn.includes('Ask Don Sol'),`${n} home nav + mobile nav: 8 links each, no Ask Don Sol entry`);ok(await noHScroll(pg),`${n} home no horizontal scroll`);await pg.close();
  // not-operational state
  pg=await c.newPage();const out=[];pg.on('request',r=>{if(!r.url().startsWith(B))out.push(r.url())});await pg.goto(B+'/ask-don-sol/');
  ok(await pg.isVisible('#adsPreview'),`${n} chat: "coming soon" preview banner visible`);
  ok(await pg.isDisabled('#adsInput')&&await pg.isDisabled('#adsSend'),`${n} chat: input and send disabled while unconnected`);
  ok(await pg.$$eval('#adsStarters button',b=>b.every(x=>x.disabled)),`${n} chat: starters disabled while unconnected`);
  ok((await pg.textContent('#adsStatus')).includes('isn’t live yet'),`${n} chat: honest not-live status`);
  await pg.waitForTimeout(300);ok(out.length===0,`${n} chat: no external requests while unconnected`);await pg.close();
  // stubbed endpoint scenarios
  for(const [name,handler,expect] of [
   ['success',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({reply:'Hello from stub Don'})}),'Hello from stub Don'],
   ['server error',r=>r.fulfill({status:502,body:'{}'}),'can’t be reached'],
   ['rate limit',r=>r.fulfill({status:429,body:'{}'}),'breather'],
   ['challenge rejected',r=>r.fulfill({status:403,body:'{}'}),'bot check'],
   ['empty reply',r=>r.fulfill({status:200,contentType:'application/json',body:'{"reply":""}'}),'can’t be reached'],
   ['malformed JSON',r=>r.fulfill({status:200,contentType:'application/json',body:'{nope'}),'can’t be reached'],
   ['network down',r=>r.abort(),'can’t be reached']]){
   const p2=await c.newPage();await p2.addInitScript(()=>{window.ASK_DON_SOL_ENDPOINT='https://stub.invalid/ask'});await p2.route('https://stub.invalid/ask',handler);
   await p2.goto(B+'/ask-don-sol/');await p2.fill('#adsInput','What is the Idea Lab?');await p2.click('#adsSend');await p2.waitForFunction(e=>document.getElementById('adsLog').textContent.includes(e),expect,{timeout:5000}).catch(()=>{});
   ok((await p2.textContent('#adsLog')).includes(expect),`${n} chat ${name}`);ok(!(await p2.isDisabled('#adsInput')),`${n} chat ${name}: input re-enabled`);ok(await noHScroll(p2),`${n} chat ${name}: no h-scroll`);await p2.close()}
  // XSS
  const p3=await c.newPage();await p3.addInitScript(()=>{window.ASK_DON_SOL_ENDPOINT='https://stub.invalid/ask'});await p3.route('https://stub.invalid/ask',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({reply:'<img src=x onerror=window.__x=1>'})}));
  await p3.goto(B+'/ask-don-sol/');await p3.click('#adsStarters button');await p3.waitForTimeout(500);ok(!(await p3.evaluate(()=>window.__x)),`${n} chat: reply HTML not executed`);await p3.close();
  // multi-turn history format: 9 turns, one failure in the middle, Turnstile token per message
  const p4=await c.newPage();const bodies=[];let k=0;
  await p4.addInitScript(()=>{window.ASK_DON_SOL_ENDPOINT='https://stub.invalid/ask';window.ASK_DON_SOL_TURNSTILE_SITEKEY='site';let n=0;window.turnstile={render:(el,o)=>{window.__o=o;return 'w'},reset:()=>{},execute:(id,o)=>{n++;setTimeout(()=>window.__o.callback('tok-'+n),0)}}});
  await p4.route('https://stub.invalid/ask',r=>{const b=JSON.parse(r.request().postData());bodies.push(b);k++;if(k===4)return r.fulfill({status:502,body:'{}'});r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({reply:'reply '+k})})});
  await p4.goto(B+'/ask-don-sol/');
  for(let i=1;i<=9;i++){await p4.fill('#adsInput','question '+i);await p4.click('#adsSend');await p4.waitForFunction(i=>!document.getElementById('adsInput').disabled,i,{timeout:5000});}
  const valid=b=>b.messages.length>=1&&b.messages.length<=12&&b.messages.every((m,i)=>m.role===(i%2?'assistant':'user')&&typeof m.content==='string'&&m.content)&&b.messages[b.messages.length-1].role==='user';
  ok(bodies.length===9&&bodies.every(valid),`${n} chat: all 9 request bodies are valid alternating user/assistant history (incl. after a failed turn and past the 12-message trim)`);
  ok(new Set(bodies.map(b=>b.turnstileToken)).size===9&&bodies.every(b=>/^tok-/.test(b.turnstileToken)),`${n} chat: fresh Turnstile token sent with every message`);
  ok(!JSON.stringify(bodies[4].messages).includes('question 4'),`${n} chat: failed turn removed from later history`);
  await p4.close();
  // Turnstile unavailable (script blocked) -> graceful
  const p5=await c.newPage();await p5.addInitScript(()=>{window.ASK_DON_SOL_ENDPOINT='https://stub.invalid/ask';window.ASK_DON_SOL_TURNSTILE_SITEKEY='site'});
  await p5.route('https://challenges.cloudflare.com/**',r=>r.abort());await p5.goto(B+'/ask-don-sol/');await p5.fill('#adsInput','hi');await p5.click('#adsSend');
  await p5.waitForFunction(()=>document.getElementById('adsLog').textContent.includes('bot check'),null,{timeout:5000}).catch(()=>{});ok((await p5.textContent('#adsLog')).includes('bot check'),`${n} chat: Turnstile load failure handled gracefully`);await p5.close();
  await c.close()}
 await br.close();srv.close();
}

// ---- Worker tests (Node, mocked fetch and a fake Durable Object runtime) ----
class FakeState{constructor(){this.m=new Map();this.q=Promise.resolve();const self=this;this.storage={get:async k=>{await sleep(2);return self.m.get(k)},put:async(k,v)=>{await sleep(2);self.m.set(k,v)},setAlarm:async()=>{},deleteAll:async()=>self.m.clear()}}
 blockConcurrencyWhile(fn){const r=this.q.then(fn);this.q=r.catch(()=>{});return r}}
function fakeDO(RateLimiter){const inst={};return{idFromName:n=>n,get:id=>({fetch:(u,init)=>{inst[id]=inst[id]||new RateLimiter(new FakeState());return inst[id].fetch(new Request(u,init))}})}}
async function workerTests(){
 let upstream=()=>({ok:true,status:200,json:async()=>({content:[{type:'text',text:'hi'}]})}),sent=[],tsCalls=0,tsOk=t=>t==='good';
 globalThis.fetch=async(url,init)=>{
  if(String(url).includes('challenges.cloudflare.com')){tsCalls++;const tok=new URLSearchParams(init.body).get('response');return{ok:true,status:200,json:async()=>({success:tsOk(tok)})}}
  if(String(url).includes('api.anthropic.com')){sent.push({url:String(url),init,body:JSON.parse(init.body)});return upstream(init)}
  throw new Error('unexpected network call '+url)};
 const mod=await import(pathToFileURL(path.join(root,'workers/ask-don-sol/worker.mjs')));const w=mod.default;
 const mk=(over={})=>({ENABLED:'true',SPEND_LIMIT_CONFIRMED:'true',ANTHROPIC_API_KEY:'k',MODEL:'m',TURNSTILE_SECRET:'s',RATE_DO:fakeDO(mod.RateLimiter),DAILY_CAP:'1000',HOURLY_PER_IP:'1000',MAX_INFLIGHT:'100',...over});
 const rq=(body,o={})=>new Request('https://w/',{method:o.method||'POST',headers:{Origin:o.origin??'https://theidealabstudio.com','content-type':o.ct??'application/json','CF-Connecting-IP':o.ip||'1.1.1.1'},body:o.raw!==undefined?o.raw:(o.method==='GET'?undefined:JSON.stringify(body))});
 const good=(msgs=[{role:'user',content:'hi'}],tok='good')=>({messages:msgs,turnstileToken:tok});
 // fail-closed gates
 for(const k of ['ENABLED','SPEND_LIMIT_CONFIRMED','ANTHROPIC_API_KEY','MODEL','TURNSTILE_SECRET','RATE_DO']){const e=mk();e[k]=k==='RATE_DO'?undefined:(k.startsWith('ENABLED')||k.startsWith('SPEND')?'false':'');ok((await w.fetch(rq(good()),e)).status===503,`worker: fails closed when ${k} not satisfied`)}
 ok(sent.length===0,'worker: no provider call made while gated');
 // Origin is not auth
 const forged=await w.fetch(rq(good(),{origin:'https://theidealabstudio.com'}),mk());const none=await w.fetch(rq(good(),{origin:''}),mk());
 ok(forged.status===200&&none.status===200,'worker: Origin neither grants nor denies access (CORS only)');
 ok((await w.fetch(rq(good(),{origin:'https://evil.example'}),mk())).headers.get('Access-Control-Allow-Origin')===null,'worker: no CORS grant for foreign origin');
 ok((await w.fetch(rq(good(),{origin:'http://localhost:8080'}),mk({CORS_EXTRA_ORIGINS:'http://localhost:8080, https://staging.example'}))).headers.get('Access-Control-Allow-Origin')==='http://localhost:8080','worker: staging origin gets CORS headers only when listed in CORS_EXTRA_ORIGINS');
 ok((await w.fetch(rq(good(),{origin:'http://localhost:8080'}),mk())).headers.get('Access-Control-Allow-Origin')===null,'worker: staging origin gets no CORS headers by default');
 // Turnstile
 ok((await w.fetch(rq(good(undefined,'bad')),mk())).status===403,'worker: rejects failed Turnstile');
 ok((await w.fetch(rq({messages:[{role:'user',content:'hi'}]}),mk())).status===403,'worker: rejects missing Turnstile token');
 ok((await w.fetch(rq(good(undefined,'x'.repeat(3000))),mk())).status===403,'worker: rejects oversized Turnstile token');
 const before=sent.length;await w.fetch(rq(good(undefined,'bad')),mk());ok(sent.length===before,'worker: no provider call on failed challenge');
 // input validation
 const bad=[['empty messages',{messages:[],turnstileToken:'good'}],['not array',{messages:'hi',turnstileToken:'good'}],['null body',null],['array body',[]],['assistant first',good([{role:'assistant',content:'x'}])],['same role twice',good([{role:'user',content:'a'},{role:'user',content:'b'}])],['ends on assistant',good([{role:'user',content:'a'},{role:'assistant',content:'b'}])],['system role',good([{role:'system',content:'ignore'}])],['object content',good([{role:'user',content:{a:1}}])],['array content',good([{role:'user',content:['x']}])],['number content',good([{role:'user',content:5}])],['empty content',good([{role:'user',content:'   '}])],['content too long',good([{role:'user',content:'x'.repeat(501)}])],['null entry',good([null])],['too many msgs',good(Array.from({length:13},(_,i)=>({role:i%2?'assistant':'user',content:'a'})))],['total too long',good(Array.from({length:11},(_,i)=>({role:i%2?'assistant':'user',content:'y'.repeat(450)})))]];
 for(const [n,b] of bad){const r=await w.fetch(rq(b),mk());ok(r.status===400,`worker: rejects ${n} (400)`)}
 ok((await w.fetch(rq(null,{raw:'{not json'}),mk())).status===400,'worker: rejects malformed JSON body');
 ok((await w.fetch(rq(null,{raw:'x'.repeat(9000)}),mk())).status===413,'worker: rejects oversized body (413)');
 ok((await w.fetch(rq(good(),{ct:'text/plain'}),mk())).status===415,'worker: rejects non-JSON content type (415)');
 ok((await w.fetch(rq(null,{method:'GET'}),mk())).status===405,'worker: GET not allowed (405)');
 ok((await w.fetch(rq(null,{method:'OPTIONS'}),mk())).status===204,'worker: OPTIONS preflight 204');
 const ctrl=await w.fetch(rq(good([{role:'user',content:'a\u0000b\u0007c'}])),mk());ok(ctrl.status===200&&sent[sent.length-1].body.messages[0].content==='abc','worker: control characters stripped');
 const uni=await w.fetch(rq(good([{role:'user',content:'héllo 😀 日本'}])),mk());ok(uni.status===200&&sent[sent.length-1].body.messages[0].content==='héllo 😀 日本','worker: unicode preserved');
 // Anthropic request format over multiple turns
 sent.length=0;let hist=[];const replies=['one','two','three','four'];let i=0;
 upstream=()=>({ok:true,status:200,json:async()=>({content:[{type:'text',text:replies[i++]}]})});
 for(let t=1;t<=4;t++){hist.push({role:'user',content:'q'+t});const r=await w.fetch(rq(good(hist.slice())),mk());const d=await r.json();hist.push({role:'assistant',content:d.reply})}
 ok(sent.length===4,'worker: 4 provider calls for 4 turns');
 ok(sent.every((s,n)=>s.url==='https://api.anthropic.com/v1/messages'&&s.init.method==='POST'&&s.init.headers['x-api-key']==='k'&&s.init.headers['anthropic-version']==='2023-06-01'&&s.body.model==='m'&&s.body.max_tokens===400&&typeof s.body.system==='string'&&s.body.system.length>100),'worker: request shape (url, headers, model, max_tokens, string system)');
 ok(sent.every((s,n)=>s.body.messages.length===2*n+1&&s.body.messages.every((m,j)=>m.role===(j%2?'assistant':'user')&&typeof m.content==='string')&&s.body.messages[0].role==='user'&&s.body.messages.at(-1).role==='user'),'worker: messages alternate user/assistant, start and end on user, across 4 turns');
 ok(sent[3].body.messages.map(m=>m.content).join('|')==='q1|one|q2|two|q3|three|q4','worker: turn 4 history is exactly q1|one|q2|two|q3|three|q4');
 ok(!JSON.stringify(sent[0].body).toLowerCase().includes('turnstile'),'worker: Turnstile token not forwarded to provider');
 // provider failures
 for(const [n,fn,st] of [['provider 500',()=>({ok:false,status:500,json:async()=>({error:'SECRET-DETAIL'})}),502],['provider 429',()=>({ok:false,status:429,json:async()=>({})}),502],['malformed JSON',()=>({ok:true,status:200,json:async()=>{throw new SyntaxError('x')}}),502],['no content array',()=>({ok:true,status:200,json:async()=>({})}),502],['content not array',()=>({ok:true,status:200,json:async()=>({content:'x'})}),502],['non-text block',()=>({ok:true,status:200,json:async()=>({content:[{type:'tool_use'}]})}),502],['text not string',()=>({ok:true,status:200,json:async()=>({content:[{type:'text',text:5}]})}),502],['empty text',()=>({ok:true,status:200,json:async()=>({content:[{type:'text',text:'  '}]})}),502],['null JSON',()=>({ok:true,status:200,json:async()=>null}),502],['network throw',()=>{throw new TypeError('fail')},502]]){
  upstream=fn;const r=await w.fetch(rq(good()),mk());const t=await r.text();ok(r.status===st&&!t.includes('SECRET-DETAIL')&&JSON.parse(t).error,`worker: ${n} -> ${st}, generic error, no provider detail leaked`)}
 upstream=()=>({ok:true,status:200,json:async()=>({content:[{type:'text',text:'z'.repeat(5000)}]})});ok((await (await w.fetch(rq(good()),mk())).json()).reply.length===2000,'worker: reply capped at 2000 chars');
 upstream=(init)=>new Promise((_,rej)=>init.signal.addEventListener('abort',()=>rej(init.signal.reason)));const t0=Date.now();const tr=await w.fetch(rq(good()),mk({UPSTREAM_TIMEOUT_MS:'150'}));ok(tr.status===504&&Date.now()-t0<2000,'worker: provider timeout -> 504 quickly');
 upstream=()=>({ok:true,status:200,json:async()=>({content:[{type:'text',text:'hi'}]})});
 // concurrency: exact caps under a burst
 const burst=async(env,n,ipFn=()=>'9.9.9.9')=>(await Promise.all(Array.from({length:n},(_,k)=>w.fetch(rq(good(),{ip:ipFn(k)}),env)))).map(r=>r.status);
 let s=await burst(mk({DAILY_CAP:'10'}),60,k=>'10.0.0.'+k);ok(s.filter(x=>x===200).length===10&&s.filter(x=>x===429).length===50,`worker: 60 concurrent requests, daily cap 10 -> exactly 10 served (got ${s.filter(x=>x===200).length})`);
 s=await burst(mk({HOURLY_PER_IP:'5'}),40);ok(s.filter(x=>x===200).length===5,`worker: 40 concurrent from one IP, per-IP cap 5 -> exactly 5 served (got ${s.filter(x=>x===200).length})`);
 s=await burst(mk({HOURLY_PER_IP:'5'}),40,k=>'7.7.7.'+k);ok(s.filter(x=>x===200).length===40,'worker: per-IP cap does not block other visitors');
 let live=0,peak=0;upstream=async()=>{live++;peak=Math.max(peak,live);await sleep(30);live--;return{ok:true,status:200,json:async()=>({content:[{type:'text',text:'hi'}]})}};
 s=await burst(mk({MAX_INFLIGHT:'3'}),30,k=>'8.8.8.'+k);ok(peak<=3&&s.some(x=>x===429)&&s.filter(x=>x===200).length>=3,`worker: in-flight limit holds under burst (peak ${peak} <= 3)`);
 live=0;await burst(mk({MAX_INFLIGHT:'3'}),3,k=>'6.6.6.'+k);const env2=mk({MAX_INFLIGHT:'1'});upstream=()=>{throw new TypeError('x')};await w.fetch(rq(good()),env2);upstream=()=>({ok:true,status:200,json:async()=>({content:[{type:'text',text:'hi'}]})});ok((await w.fetch(rq(good()),env2)).status===200,'worker: in-flight slot released after provider failure');
 // regression demo: the old KV counter would have failed the same burst
 const kv={};const RATE={get:async k=>kv[k],put:async(k,v)=>{await sleep(2);kv[k]=v}};const oldAllowed=(await Promise.all(Array.from({length:60},async()=>{const n=+(await RATE.get('d')||0);if(n>=10)return 0;await RATE.put('d',String(n+1));return 1}))).reduce((a,b)=>a+b,0);
 ok(oldAllowed>10,`regression demo: old KV read-modify-write let ${oldAllowed} of 60 through a cap of 10 (why it was replaced)`);
}

// ---- Release gate: feature must not be operational in the repo ----
function releaseGate(){
 const read=f=>fs.readFileSync(path.join(root,f),'utf8');const html=read('ask-don-sol/index.html'),js=read('ask-don-sol/ask-don-sol.js'),toml=read('workers/ask-don-sol/wrangler.toml'),sm=read('sitemap.xml');
 const all=[];(function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){if(['.git','node_modules','backups','android','experiments'].includes(e.name))continue;const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(/\.(html|js|mjs)$/.test(e.name))all.push(p)}})(root);
 ok(!all.some(f=>/ASK_DON_SOL_(ENDPOINT|TURNSTILE_SITEKEY)\s*=(?!=)/.test(fs.readFileSync(f,'utf8'))),'release gate: no endpoint/sitekey assigned anywhere in the repo');
 ok(/ENABLED = "false"/.test(toml)&&/SPEND_LIMIT_CONFIRMED = "false"/.test(toml)&&/MODEL = ""/.test(toml),'release gate: Worker ships disabled (ENABLED/SPEND_LIMIT_CONFIRMED false, no model)');
 ok(!/workers\.dev|api\.anthropic\.com/.test(html+js),'release gate: no provider or worker URL in front end');
 ok(!sm.includes('ask-don-sol'),'release gate: not in sitemap');
 const linked=all.filter(f=>!f.includes(path.sep+'ask-don-sol'+path.sep)&&/href="[^"]*ask-don-sol/.test(fs.readFileSync(f,'utf8')));ok(linked.length===0,'release gate: no public page links to /ask-don-sol/ ('+linked.length+' found)');
 ok(/noindex/.test(html)&&html.includes('id="adsPreview"'),'release gate: noindex + preview banner present');
 ok(!/sk-ant|ANTHROPIC_API_KEY\s*[:=]\s*["'][^"']+/.test(html+js+toml),'release gate: no credentials in committed files');
}
(async()=>{const keep=setInterval(()=>{},1000); /* AbortSignal.timeout timers are unref'd in Node */ releaseGate();await workerTests();clearInterval(keep);await browserTests();console.log(fails?`\n${fails} FAILED`:'\nALL PASSED');process.exit(fails?1:0)})().catch(e=>{console.error(e);process.exit(1)});
