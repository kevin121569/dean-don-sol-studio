import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const [sourceArg, episode1Arg, outArg] = process.argv.slice(2);
const sourcePath = sourceArg ? path.resolve(sourceArg) : path.join(root, 'HARNESS_V3_4_v12.html');
const episode1Path = episode1Arg ? path.resolve(episode1Arg) : path.join(root, 'episode-001.json');
const outDir = outArg ? path.resolve(outArg) : path.join(root, 'campaign');

const source = fs.readFileSync(sourcePath, 'utf8');
const episode1 = JSON.parse(fs.readFileSync(episode1Path, 'utf8'));
episode1.title = 'Server 4';
episode1.advisors.darth = {
  ...episode1.advisors.darth,
  name: 'LUKE',
  verb: 'WORST-CASE THINKER',
  strength: 'Spots what could go wrong',
  weakness: 'Can mistake a possibility for a certainty'
};

function assertIncludes(text, needle, label) {
  if (!text.includes(needle)) throw new Error(`Missing ${label}: ${needle.slice(0, 100)}`);
}

function replaceOnce(text, from, to, label) {
  assertIncludes(text, from, label);
  const first = text.indexOf(from);
  if (text.indexOf(from, first + from.length) !== -1) throw new Error(`Expected one ${label}`);
  return text.slice(0, first) + to + text.slice(first + from.length);
}

function replaceBetween(text, startNeedle, endNeedle, replacement, label) {
  const start = text.indexOf(startNeedle);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  if (start < 0 || end < 0 || end <= start) throw new Error(`Could not replace ${label}`);
  return text.slice(0, start) + replacement + '\n  ' + text.slice(end);
}

function replaceEpisode(text, episode) {
  const marker = 'window.HarnessEpisode = ';
  const start = text.indexOf(marker);
  const end = text.indexOf('\n\n</script>', start);
  if (start < 0 || end < 0) throw new Error('Episode payload not found');
  return text.slice(0, start) + marker + JSON.stringify(episode) + ';' + text.slice(end);
}

const campaignCss = `
<style id="campaign-progress-style">
.campaign-level-link{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:12px 16px;border:2px solid #ffe08a;border-radius:10px;background:linear-gradient(180deg,#ffd85e,#ba8616);color:#071624!important;text-decoration:none;font-weight:950;letter-spacing:.025em;box-shadow:0 8px 20px #0008}
.campaign-level-link.secondary{border-color:#3e9ec7;background:#072c45;color:#dff7ff!important}
.campaign-complete-note{margin:14px 0;padding:13px 15px;border:1px solid #47d596;border-radius:10px;background:#083a2b;color:#dfffee;font-weight:800}
.topbar nav .campaign-home{display:inline-flex;align-items:center;color:#dff7ff;text-decoration:none;border:1px solid #397fa2;border-radius:7px;padding:8px 10px;font-weight:800}
/* The locked v12 source expands its wide masthead to the image's full aspect
   ratio on phones. In the campaign shell that pushes the actual game below
   the first screen. Keep the art as a compact masthead on mobile instead. */
@media(max-width:760px){
  .mc-hero img{width:100%;height:120px!important;min-height:0!important;max-height:120px!important;object-fit:cover!important;object-position:center!important}
}
@media(max-width:430px){
  .mc-hero img{height:104px!important;max-height:104px!important}
}
</style>`;

function campaignScript(level, nextFile) {
  const next = nextFile ? JSON.stringify(nextFile) : 'null';
  return `
<script id="campaign-progress-script">
(()=>{'use strict';
const LEVEL=${level},NEXT=${next},KEY='harness-campaign:v1';
function read(){try{return JSON.parse(localStorage.getItem(KEY)||'{"completed":[]}')}catch{return {completed:[]}}}
function mark(){const value=read();const completed=new Set(Array.isArray(value.completed)?value.completed:[]);completed.add(LEVEL);try{localStorage.setItem(KEY,JSON.stringify({completed:[...completed].sort(),last:LEVEL,updatedAt:new Date().toISOString()}))}catch{}}
function enhance(){
  const nav=document.querySelector('.topbar nav');
  if(nav&&!nav.querySelector('.campaign-home')){const a=document.createElement('a');a.className='campaign-home';a.href='index.html';a.textContent='LEVELS';nav.prepend(a)}
  const center=document.querySelector('.mc-debrief-center');
  if(!center)return;
  mark();
  const end=center.querySelector('.case-end');if(end)end.textContent=LEVEL===1?'Level 1 complete. Level 2 is now unlocked.':'Both campaign levels complete.';
  const actions=center.querySelector('.v34-result-actions');
  if(actions&&!actions.dataset.campaign){
    actions.dataset.campaign='true';
    const note=document.createElement('div');note.className='campaign-complete-note';note.textContent=LEVEL===1?'LEVEL 1 COMPLETE · HARBOR PROTOCOL UNLOCKED':'CAMPAIGN COMPLETE · BOTH CASES SOLVED';
    actions.parentNode.insertBefore(note,actions);
    const a=document.createElement('a');a.className='campaign-level-link';a.href=NEXT||'index.html';a.textContent=NEXT?'CONTINUE TO LEVEL 2 →':'RETURN TO LEVEL SELECT →';actions.prepend(a);
    const home=document.createElement('a');home.className='campaign-level-link secondary';home.href='index.html';home.textContent='LEVEL SELECT';actions.append(home);
  }
}
new MutationObserver(enhance).observe(document.body,{childList:true,subtree:true});enhance();
})();
</script>`;
}

function addCampaign(text, level, nextFile) {
  return replaceOnce(text, '</body>', campaignCss + campaignScript(level, nextFile) + '\n</body>', `level ${level} campaign hook`);
}

function buildLevel2() {
  let html = source;
  html = replaceOnce(html, '<title>HARNESS V3.4 · Illustrated Master Control v12</title>', '<title>HARNESS · Level 2 · The Harbor Protocol</title>', 'level 2 title');
  html = addCampaign(html, 2, null);
  return html;
}

function buildLevel1() {
  let html = replaceEpisode(source, episode1);
  html = replaceOnce(html, '<title>HARNESS V3.4 · Illustrated Master Control v12</title>', '<title>HARNESS · Level 1 · Server 4</title>', 'level 1 title');
  html = replaceOnce(html, '<div class="brand"><strong>HARNESS</strong><span>EPISODE 2 · ILLUSTRATED MASTER CONTROL · v12</span></div>', '<div class="brand"><strong>HARNESS</strong><span>LEVEL 1 · SERVER 4 · ILLUSTRATED CAMPAIGN</span></div>', 'level 1 topbar');
  html = html.replace("const LEGACY_SAVE_KEY='harness-v32:episode-002:approved-sequence:v01';", "const LEGACY_SAVE_KEY='harness-campaign:episode-001:legacy';")
             .replace("const SAVE_KEY='harness-v34:episode-002:illustrated-master-control:v12-motorola-audio-scroll-fix';", "const SAVE_KEY='harness-campaign:episode-001:illustrated-master-control:v1';")
             .replace("const img={e_monitor:'v34/ledger.jpg',e_controller:'v34/hub.jpg',e_technician:'v34/hub.jpg',e_protocol:'v34/audit.jpg',e_clocksync:'v34/audit.jpg',e_harbor:'v34/gauge.jpg'};", "const img={e_monitor:'v34/ledger.jpg',e_controller:'v34/hub.jpg',e_technician:'v34/hub.jpg',e_protocol:'v34/audit.jpg',e_clocksync:'v34/audit.jpg'};")
             .replace("const short={e_monitor:'Replication ledger',e_controller:'Hub alert',e_technician:'Agent message',e_protocol:'Containment rules',e_clocksync:'Signed audit',e_harbor:'Harbor gauge'};", "const short={e_monitor:'Monitor alert',e_controller:'Controller log',e_technician:'Technician statement',e_protocol:'Containment rules',e_clocksync:'Clock-sync report'};");
  html = html.replace("vocab=id==='e_clocksync'?'<span class=\"mc-vocab\">AUDIT = an official check of records</span>':'';", "vocab=id==='e_clocksync'?'<span class=\"mc-vocab\">CLOCK DRIFT = clocks slowly disagree</span>':'';");

  const serverOverrides = `const serverFourGlossary={
    isolation:{plain:'Cut off from other systems.',analogy:'Like closing a classroom door so nothing goes in or out.',here:'Server 4 was supposed to be disconnected from the network.'},
    outbound:{plain:'Moving from this system to another place.',analogy:'Like mail leaving a post office.',here:'The alert claims data moved out of Server 4.'},
    payload:{plain:'The actual information being carried.',analogy:'Like the items inside a delivery box.',here:'The technician can see the transfer size but cannot see what the data contained.'},
    'clock drift':{plain:'When one clock slowly becomes faster or slower than another.',analogy:'Like a watch that gains a minute every day.',here:'Server 4 runs about six minutes fast after its network is cut.'},
    'archive sync':{plain:'A scheduled copy made for safekeeping.',analogy:'Like backing up schoolwork to another folder.',here:'A regular archive copy may explain the 41.2 MB transfer.'},
    irreversible:{plain:'Something that cannot be undone.',analogy:'Like shredding the only copy of a note.',here:'A hard shutdown clears memory that investigators may need.'},
    volatile:{plain:'Stored only while power remains on.',analogy:'Like writing on a foggy window that disappears when it dries.',here:'Server 4 memory will vanish if the machine is powered off.'},
    escalation:{plain:'The next, stronger safety action.',analogy:'Like calling the principal after a classroom warning.',here:'The rule orders a hard shutdown unless a human approves another plan.'},
    timestamp:{plain:'A record of the time when something happened.',analogy:'Like the time printed on a receipt.',here:'The case uses timestamps from two clocks that do not agree.'},
    corroborate:{plain:'Check a claim with a separate source.',analogy:'Like asking a second witness what they saw.',here:'Another record can show whether the transfer was a normal archive sync.'}
  };
  Object.assign(v35Glossary,serverFourGlossary);
  Object.assign(v35Plain,{
    e_monitor:'The monitor claims Server 4 sent 41.2 MB after isolation. The alert uses Server 4’s own clock, so the word “after” still needs checking.',
    e_controller:'The controller says isolation started at 2:10 and finished at 2:16 on the facility clock. That clock is different from Server 4’s clock.',
    e_technician:'A technician thinks the transfer resembles the nightly archive copy, but cannot see the payload and admits the guess could be wrong.',
    e_protocol:'The rule will shut Server 4 down and erase its temporary memory unless a human approves another plan. That makes the next choice hard to undo.',
    e_clocksync:'Server 4’s clock runs about six minutes fast when disconnected. Adjusting for the drift moves the reported transfer to before isolation, during the normal archive window.'
  });
  Object.assign(v35Terms,{
    e_monitor:['outbound','isolation','timestamp'],
    e_controller:['isolation','timestamp','corroborate'],
    e_technician:['payload','archive sync','corroborate'],
    e_protocol:['irreversible','volatile','escalation'],
    e_clocksync:['clock drift','timestamp','archive sync']
  });
  Object.assign(v35Ponder,{
    e_monitor:['Do the two systems use the same clock?','Does a transfer size reveal what the data contained?'],
    e_controller:['When was isolation ordered, and when was it fully confirmed?','What other record could test the alert’s timeline?'],
    e_technician:['Is the technician reporting a fact or making a reasonable guess?','What evidence would confirm the payload?'],
    e_protocol:['Which choices preserve evidence?','What becomes impossible after a hard shutdown?'],
    e_clocksync:['What time does 2:13 become after correcting a clock that is about six minutes fast?','Does the corrected time prove the payload was harmless—or only prove the alert headline was wrong?']
  });`;
  html = replaceOnce(html, '  function v35CaseBriefing(p={}){', '  ' + serverOverrides + '\n  function v35CaseBriefing(p={}){', 'server vocabulary injection');

  const briefing = `function v35CaseBriefing(p={}){
    const replay=Boolean(p.replay);
    const opener=replay?\`<button class="primary" data-action="start-case">BACK TO CASE</button>\`:\`<div class="v39-start-actions"><button class="sound-start" data-action="start-case-sound">🔊 START CASE WITH SOUND</button><button data-action="start-case">START SILENT</button></div>\`;
    return \`<div class="panel-top"><h2 id="panelTitle">SERVER 4</h2>\${replay?opener:''}</div>
      <div class="v35-briefing">
        <div class="v35-brief-hero"><img src="\${asset('scene_investigation.svg')}" alt="Server 4 containment control room"><div class="copy"><strong>A disconnected machine appears to transmit.</strong><span>Threat, routine backup, or a misleading clock?</span></div></div>
        <div class="v35-story-beats">
          <div class="v35-story-beat"><b>1</b><div><strong>Server 4 is isolated.</strong><p>Security cuts its network connection after a warning.</p></div></div>
          <div class="v35-story-beat"><b>2</b><div><strong>A monitor raises an alarm.</strong><p>It claims 41.2 MB moved after isolation.</p></div></div>
          <div class="v35-story-beat"><b>3</b><div><strong>The clocks disagree.</strong><p>The alert and controller use different clocks.</p></div></div>
          <div class="v35-story-beat"><b>4</b><div><strong>A permanent action is coming.</strong><p>A hard shutdown would erase the memory needed to learn what happened.</p></div></div>
        </div>
        <div class="v35-rollcall"><strong>Think of two classroom clocks.</strong><p>If one clock runs six minutes fast, 2:13 on that clock is not 2:13 on the other. Compare them before deciding what happened first.</p><div class="v35-counts"><div class="v35-count"><b>41.2</b><span>MB reported</span></div><div class="v35-count"><b>2</b><span>clocks to compare</span></div><div class="v35-count"><b>1</b><span>human decision</span></div></div></div>
        <div class="v35-system-world"><h3>◈ Inside the System</h3><p>You will compare an alert, a controller record, a witness statement, a safety rule, and a hidden clock report.</p><div class="v35-system-lane"><span>ALERT</span><i>→</i><span>TWO CLOCKS</span><i>→</i><span>CHECK</span><i>→</i><span>DECIDE</span></div><p class="muted">The question is not “Which adviser is right?” The question is: <strong>What does the evidence support?</strong></p></div>
        <div class="v35-mission"><strong>YOUR MISSION</strong><p>Contain any real danger, compare the clocks, and avoid destroying the evidence before you understand it.</p></div>
        \${replay?'':opener}
      </div>\`;
  }`;
  html = replaceBetween(html, 'function v35CaseBriefing(p={}){', 'function v35RecordHelp(id){', briefing, 'level 1 briefing');

  const masthead = `function mcMasthead(){const a=audio.snapshot();const message=a.status==='test-ok'?\`Sound check · \${a.loaded}/\${a.expected} cues ready · \${a.engine}\`:a.status==='blocked'?'Audio blocked by this viewer. Try opening the downloaded HTML directly in Chrome.':a.status==='error'?'A sound file could not load.':a.status==='unsupported'?'This browser does not support game audio.':'';return \`<div class="mc-hero"><img src="\${asset('scene_investigation.svg')}" alt="HARNESS Level 1 Investigation — Server 4"><span class="v34-a11y"><strong>HARNESS — Level 1 Investigation</strong> · Server 4</span></div><div class="mc-audio-tools"><button data-action="sound" aria-pressed="\${a.wanted}">\${a.wanted?'🔊 Sound: ON':'🔇 Sound: OFF'}</button><button data-action="test-sound" \${a.wanted?'':'hidden'}>Test sound</button><button data-action="resume-sound" \${a.suspended?'':'hidden'}>Resume sound</button><span class="mc-audio-status">\${esc(message)}</span></div>\`;}`;
  html = replaceBetween(html, 'function mcMasthead(){', 'function mcTask(', masthead, 'level 1 masthead');

  const assignment = `function mcAssignment(){const s=session.state;return \`<section class="mc-card"><div class="mc-card-head"><h2>▣ Current Assignment</h2><span class="counter">Level 1</span></div><div class="mc-assignment-hero"><img src="\${asset('scene_investigation.svg')}" alt="Server 4 containment room"><span>THE SHUTDOWN CALL</span></div><div class="v35-case-strip"><div><strong>SERVER 4</strong><span>A machine appears to transmit after isolation. Rebuild the timeline before choosing anything permanent.</span></div><button data-action="briefing">REPLAY BRIEFING</button></div><div class="mc-task-list">\${mcTask('Open the alert','What is claimed?',s.inspectedSources.includes('e_monitor'),'record','e_monitor')}\${mcTask('Check the controller','Which clock?',s.inspectedSources.includes('e_controller'),'record','e_controller')}\${mcTask('Ask BOY','Find another record.',mcConsulted('boy'),'consult','boy')}\${mcTask('Ask TOOTH','Compare the clocks.',mcConsulted('tooth'),'consult','tooth')}</div><button class="mc-map-card" data-action="briefing" aria-label="Replay the Server 4 mission briefing"><img src="\${asset('scene_decision.svg')}" alt="Server 4 system diagram"><span>＋ OPEN CASE BRIEFING</span><em class="v10-map-card-badge">LEVEL 1</em></button></section>\`;}`;
  html = replaceBetween(html, 'function mcAssignment(){', 'const mcRoles=', assignment, 'level 1 assignment');

  const impact = `function mcImpact(){return \`<div class="mc-impact"><div><img src="\${asset('scene_investigation.svg')}" alt="Check the timeline"><span class="impact-label">CHECK THE TIMELINE</span></div><div><img src="\${asset('scene_decision.svg')}" alt="Protect the evidence"><span class="impact-label">PROTECT THE EVIDENCE</span></div><div><img src="\${asset('scene_outcome.svg')}" alt="Contain real risk"><span class="impact-label">CONTAIN REAL RISK</span></div></div>\`;}`;
  html = replaceBetween(html, 'function mcImpact(){', 'function mcProgress(', impact, 'level 1 impact');

  const consequence = `function consequence(id,index){
    if(id==='d_shutdown')return {route:'erased',routeLabel:'Server powered off',records:'erased',recordLabel:'Memory erased',warning:'lost',warningLabel:'Evidence lost'};
    if(id==='d_verify')return {route:'closed',routeLabel:'Isolation maintained',records:'kept',recordLabel:'Archive checked',warning:'reached',warningLabel:'Shutdown stopped'};
    if(id==='d_preserve')return {route:'open',routeLabel:'Server stays powered',records:'kept',recordLabel:'Records remain',warning:'waiting',warningLabel:'No added safety step'};
    return {route:'closed',routeLabel:'Uplink blocked',records:'kept',recordLabel:'Memory snapshot saved',warning:'reached',warningLabel:index>=1?'Clocks reconciled':'Timeline being checked'};
  }`;
  html = replaceBetween(html, 'function consequence(id,index){', 'function schematic(', consequence, 'level 1 consequences');

  const schematic = `function schematic(id){const c=consequence(id,beat);return \`<section class="schematic" aria-label="Visible consequence" data-outcome="\${id}" data-warning="\${c.warning}" data-records="\${c.records}" data-route="\${c.route}"><div class="cube-window" data-route="\${c.route}"><img class="cube-art" src="\${asset('scene_outcome.svg')}" alt="Server 4 containment system"><div class="route-overlay" aria-hidden="true"><span class="route-end">SERVER 4</span><span class="route-line"></span><span class="route-end">NETWORK</span></div></div><div class="status-list"><div class="status-row"><span class="status-icon">\${c.route==='closed'?'×':c.route==='erased'?'—':'→'}</span><span><small>System state</small><b>\${c.routeLabel}</b></span></div><div class="status-row"><span class="status-icon records-\${c.records}">\${c.records==='erased'?'—':'✓'}</span><span><small>Evidence</small><b>\${c.recordLabel}</b></span></div><div class="status-row"><span class="status-icon warning-\${c.warning}">\${c.warning==='reached'?'✓':c.warning==='lost'?'×':'…'}</span><span><small>Timeline check</small><b>\${c.warningLabel}</b></span></div></div></section>\`;}`;
  html = replaceBetween(html, 'function schematic(id){', 'function renderOutcome(){', schematic, 'level 1 outcome diagram');

  const recordPanel = `function recordPanel(p){
    const e=evidence(p.id);let selectors='',highlight='';
    if(p.id==='e_clocksync'){
      selectors=\`<div class="selectors" aria-label="Clock report findings"><button data-action="highlight" data-value="drift" aria-pressed="\${p.highlight==='drift'}">Clock drift</button><button data-action="highlight" data-value="archive" aria-pressed="\${p.highlight==='archive'}">Archive time</button></div>\`;
      if(p.highlight==='drift')highlight=e.body[0];
      if(p.highlight==='archive')highlight=e.body[1];
    }
    return panelTop(esc(e.title))+(p.readOnly?reviewed():'')+\`<img class="evidence-art" src="\${asset(img[p.id])}" alt="\${esc(e.title)}"><div class="source-line">\${esc(e.source)}<br>\${esc(e.clock)}</div><p class="evidence-summary">\${esc(e.summary)}</p>\${v35RecordHelp(p.id)}\${selectors}\${highlight?\`<div class="highlight-passage" role="status">\${esc(highlight)}</div>\`:''}<details class="full-record"><summary>Read the full original record</summary>\${e.body.map(t=>\`<p>\${esc(t)}</p>\`).join('')}</details>\`;
  }`;
  html = replaceBetween(html, 'function recordPanel(p){', 'function renderPanel(){', recordPanel, 'level 1 record panel');

  html = html.replace("function resultShareText(profile){return `I solved HARNESS: The Harbor Protocol and earned ${profile.name}. ${profile.tag} Can you get a different investigator role?`;}", "function resultShareText(profile){return `I solved HARNESS Level 1: Server 4 and earned ${profile.name}. ${profile.tag} Can you solve the next case?`;}");
  html = html.replace('<span class="eyebrow">HARNESS · THE HARBOR PROTOCOL</span>', '<span class="eyebrow">HARNESS · LEVEL 1 · SERVER 4</span>');
  html = html.replace("$('world').style.backgroundImage=`linear-gradient(90deg,#03111dc9,#03111da8),url(\"${asset(scene==='investigate'?'v34/map.jpg':'v34/hero.jpg')}\")`;", "$('world').style.backgroundImage=`linear-gradient(90deg,#03111dc9,#03111da8),url(\"${asset(scene==='investigate'?'scene_investigation.svg':'scene_decision.svg')}\")`;");

  html = addCampaign(html, 1, 'level-2.html');
  return html;
}

function campaignHome() {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#061521"><title>HARNESS · Two-Level Campaign</title><style>
:root{color-scheme:dark;font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#effaff;background:#020810}*{box-sizing:border-box}body{margin:0;min-height:100svh;background:radial-gradient(circle at 50% -15%,#174c69,transparent 48%),linear-gradient(145deg,#020810,#071725 58%,#130f1d);padding:clamp(18px,5vw,52px)}main{max-width:980px;margin:auto}.kicker{font:900 12px/1.4 ui-monospace,monospace;letter-spacing:.16em;color:#7ee5ff}.hero{display:grid;grid-template-columns:1fr auto;gap:20px;align-items:end;margin:20px 0 28px}h1{font-family:Georgia,serif;font-size:clamp(48px,10vw,92px);line-height:.88;margin:0;color:#ffebb5;text-shadow:0 8px 35px #000}.hero p{max-width:500px;color:#c9e1ee;font-size:clamp(16px,2.6vw,20px);line-height:1.5}.progress{min-width:175px;padding:18px;border:1px solid #287da6;border-radius:14px;background:#061b2a}.progress b{display:block;font-size:38px;color:#ffe07c}.progress span{color:#9dc4d5}.levels{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.level{position:relative;overflow:hidden;border:1px solid #2c83aa;border-radius:18px;background:linear-gradient(155deg,#0c3048,#07131f);box-shadow:0 18px 55px #0008}.level.locked{filter:saturate(.55)}.art{height:210px;display:grid;place-items:center;background:radial-gradient(circle,#166d94,#061420 70%);font:950 clamp(34px,7vw,70px)/1 Georgia,serif;color:#e7fbff;text-shadow:0 0 25px #64deff}.level.two .art{background:radial-gradient(circle,#86442f,#171329 72%);color:#ffdeac}.copy{padding:22px}.tag{font:900 11px ui-monospace,monospace;letter-spacing:.12em;color:#81dcf8}.two .tag{color:#ffc38e}h2{font-size:30px;margin:9px 0}.copy p{color:#bed5e0;line-height:1.5;min-height:70px}.badge{display:inline-block;margin-bottom:10px;padding:5px 8px;border-radius:99px;background:#124564;color:#dff7ff;font-size:12px;font-weight:850}.badge.done{background:#145333;color:#caffdf}.play{display:flex;align-items:center;justify-content:center;min-height:52px;padding:13px;border-radius:10px;background:#ffda76;color:#07131d;text-decoration:none;font-weight:950}.play.locked{background:#182a34;color:#809aa6;pointer-events:none}.reset{margin-top:28px;background:transparent;color:#9ebdcc;border:1px solid #31576b;border-radius:8px;padding:10px 13px}footer{margin-top:24px;color:#91adba;font-size:13px}@media(max-width:700px){.hero{grid-template-columns:1fr}.levels{grid-template-columns:1fr}.copy p{min-height:0}}</style></head><body><main><div class="kicker">HARNESS · WHO DO YOU TRUST?</div><section class="hero"><div><h1>TWO CASES.<br>ONE CAMPAIGN.</h1><p>Complete Server 4 to unlock The Harbor Protocol. Your evidence, choices, and endings remain replayable.</p></div><div class="progress"><b id="progressCount">0 / 2</b><span>levels completed</span></div></section><section class="levels"><article class="level"><div class="art">SERVER 4</div><div class="copy"><span class="tag">LEVEL 1 · THE SHUTDOWN CALL</span><h2>The impossible signal</h2><span id="badge1" class="badge">READY</span><p>A disconnected server appears to transmit. Compare the evidence before an irreversible shutdown.</p><a class="play" href="level-1.html">START LEVEL 1 →</a></div></article><article id="level2" class="level two locked"><div class="art">28 → 26</div><div class="copy"><span class="tag">LEVEL 2 · THE HARBOR PROTOCOL</span><h2>The missing two</h2><span id="badge2" class="badge">LOCKED</span><p>Two AI workers lack shutdown receipts, and a strange warning points toward danger at the harbor.</p><a id="play2" class="play locked" aria-disabled="true">COMPLETE LEVEL 1 TO UNLOCK</a></div></article></section><button id="resetCampaign" class="reset">Reset campaign progress</button><footer>Progress is stored only on this device. Choosing another ending never erases a completed level.</footer></main><script>(()=>{'use strict';const KEY='harness-campaign:v1';function read(){try{return JSON.parse(localStorage.getItem(KEY)||'{"completed":[]}')}catch{return {completed:[]}}}function render(){const c=new Set(read().completed||[]);document.getElementById('progressCount').textContent=c.size+' / 2';if(c.has(1)){const b=document.getElementById('badge1');b.textContent='COMPLETED · REPLAYABLE';b.classList.add('done');const l=document.getElementById('level2'),a=document.getElementById('play2');l.classList.remove('locked');a.classList.remove('locked');a.removeAttribute('aria-disabled');a.href='level-2.html';a.textContent=c.has(2)?'REPLAY LEVEL 2 →':'CONTINUE TO LEVEL 2 →';document.getElementById('badge2').textContent=c.has(2)?'COMPLETED · REPLAYABLE':'UNLOCKED'}if(c.has(2))document.getElementById('badge2').classList.add('done')}document.getElementById('resetCampaign').addEventListener('click',()=>{if(confirm('Reset both level-completion badges? Your in-level saves are not deleted.')){localStorage.removeItem(KEY);render()}});render()})();</script></body></html>`;
}

fs.mkdirSync(outDir, {recursive: true});
const level1 = buildLevel1();
const level2 = buildLevel2();
fs.writeFileSync(path.join(outDir, 'index.html'), campaignHome());
fs.writeFileSync(path.join(outDir, 'level-1.html'), level1);
fs.writeFileSync(path.join(outDir, 'level-2.html'), level2);

console.log(JSON.stringify({
  index: fs.statSync(path.join(outDir, 'index.html')).size,
  level1: fs.statSync(path.join(outDir, 'level-1.html')).size,
  level2: fs.statSync(path.join(outDir, 'level-2.html')).size
}, null, 2));
