### `04_Key_Motion_Proof_v2.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>04 Key Motion Proof v2 (Final Production Lock)</title>
<style>
  body { background: #F4F3EF; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; font-family: sans-serif; }
  
  /* Shared Positioning & Coordinate Context */
  .lock-stage {
    position: relative;
    width: 420px;
    height: 200px;
    display: flex;
    align-items: center;
    background: #EFEFEA;
    border: 1px solid #E2E2DC;
    border-radius: 8px;
    overflow: hidden;
  }

  /* Hidden Module: Genuinely hidden (opacity: 0, visibility: hidden) before unlock */
  .mystery-panel {
    position: absolute;
    left: 160px;
    top: 70px;
    width: 220px;
    height: 60px;
    background: #121212;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #F4F3EF;
    font-size: 14px;
    font-weight: 500;
    opacity: 0;
    visibility: hidden;
    transform: translateX(0);
    z-index: 1;
  }

  /* Keyhole & Latch Mechanism */
  .keyhole-slot {
    position: absolute;
    left: 160px;
    top: 82px;
    width: 8px;
    height: 18px;
    background: #000;
    border-radius: 3px;
    border: 1px solid #333;
    z-index: 2;
  }
  .latch-pin {
    position: absolute;
    left: 162px;
    top: 70px;
    width: 4px;
    height: 10px;
    background: #555;
    z-index: 1;
  }

  /* Key Character */
  .key-character {
    position: absolute;
    left: 20px;
    top: 82px;
    width: 50px;
    height: 20px;
    display: flex;
    align-items: center;
    transform-origin: 50px 10px;
    z-index: 3;
  }
  .key-bow { width: 16px; height: 16px; border: 3px solid #1A1A1A; border-radius: 50%; background: #2A2A2A; box-shadow: inset 1px 1px 2px rgba(255,255,255,0.2); }
  .key-shank { width: 28px; height: 5px; background: #1A1A1A; position: relative; }
  .key-bit { width: 6px; height: 8px; background: #1A1A1A; position: absolute; left: 22px; top: 5px; border-radius: 0 0 1px 1px; }

  /* Synchronized 1.5s Interactions on Stage Hover */
  .lock-stage:hover .key-character { animation: keyEngagementTurn 1.5s cubic-bezier(0.25, 1, 0.5, 1) forwards; }
  .lock-stage:hover .latch-pin { animation: latchRelease 1.5s cubic-bezier(0.25, 1, 0.5, 1) forwards; }
  .lock-stage:hover .mystery-panel { animation: revealModule 1.5s cubic-bezier(0.25, 1, 0.5, 1) forwards; }

  /* 
    1.5s (90 Frame) Choreography:
    0.0s - 0.4s: Key glides right; bit enters keyhole slot at left: 115px.
    0.4s - 0.8s: Key rotates 45deg inside keyhole slot.
    0.6s - 0.9s: Rotation drives latch pin drop (+8px).
    0.9s - 1.5s: Latch releases; mystery panel reveals & shifts (+16px); Key settles to 30deg.
  */
  @keyframes keyEngagementTurn {
    0% { left: 20px; transform: rotate(0deg); }
    26.6% { left: 115px; transform: rotate(0deg); }  /* Bit inserted into keyhole */
    53.3% { left: 115px; transform: rotate(45deg); } /* Rotation inside slot */
    100% { left: 115px; transform: rotate(30deg); }  /* Settled state: Seated Key */
  }
  @keyframes latchRelease {
    0%, 40% { top: 70px; }
    60%, 100% { top: 78px; } /* Driven by key rotation */
  }
  @keyframes revealModule {
    0%, 60% { opacity: 0; visibility: hidden; transform: translateX(0); }
    61% { opacity: 0; visibility: visible; }
    100% { opacity: 1; visibility: visible; transform: translateX(16px); }
  }

  /* Reduced Motion Accessibility Override */
  @media (prefers-reduced-motion: reduce) {
    .lock-stage:hover .key-character,
    .lock-stage:hover .latch-pin,
    .lock-stage:hover .mystery-panel {
      animation: none !important;
    }
  }
</style>
</head>
<body>
  <div style="position:absolute; top:20px; font-size:12px; color:#666;">HOVER OVER STAGE TO EXECUTE 1.5s UNLOCK</div>
  <div class="lock-stage">
    <div class="latch-pin"></div>
    <div class="keyhole-slot"></div>
    <div class="mystery-panel">Explore Advanced Module</div>
    <div class="key-character">
      <div class="key-bow"></div>
      <div class="key-shank"><div class="key-bit"></div></div>
    </div>
  </div>
</body>
</html>

```

---

### `01_Percy_Motion_Proof_Final.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>01 Percy Motion Proof Final (0.4s Reveal & Immediate Reduced Motion Settled Lock)</title>
<style>
  body { background: #F4F3EF; display: flex; justify-content: center; align-items: center; height: 100vh; font-family: monospace; font-size: 32px; margin: 0; }
  .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0; }
  .code-visual { color: #121212; display: flex; align-items: center; }
  .string-content { color: #2a6b3b; margin: 0 2px; }
  
  .percy-svg { fill: #121212; transition: fill 0.5s ease, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
  
  /* Normal motion: 0.4s reveal awaken as Percy */
  .code-visual.active .percy-svg { fill: #1A2B4C; }
  .code-visual.active .percy-svg.left { transform: scale(1.08) translateX(-1px); }
  .code-visual.active .percy-svg.right { transform: scale(1.08) translateX(1px); }

  /* prefers-reduced-motion: no transition; immediately render settled Percy container */
  @media (prefers-reduced-motion: reduce) {
    .percy-svg { transition: none !important; fill: #1A2B4C !important; }
    .percy-svg.left { transform: scale(1.08) translateX(-1px) !important; }
    .percy-svg.right { transform: scale(1.08) translateX(1px) !important; }
  }
</style>
</head>
<body>
  <code>
    <span class="sr-only">print("Hello")</span>
    <span class="code-visual" id="codeVisual" aria-hidden="true">
      <span>print</span>
      <svg class="percy-svg left" viewBox="0 0 20 60" width="12" height="36">
        <path d="M14 4 C 6 18, 6 42, 14 56 C 11 40, 11 20, 14 4 Z"/>
      </svg>
      <span class="string-content">"Hello"</span>
      <svg class="percy-svg right" viewBox="0 0 20 60" width="12" height="36">
        <path d="M6 4 C 14 18, 14 42, 6 56 C 9 40, 9 20, 6 4 Z"/>
      </svg>
    </span>
  </code>

<script>
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    document.getElementById('codeVisual').classList.add('active');
  } else {
    setTimeout(() => {
      document.getElementById('codeVisual').classList.add('active');
    }, 400);
  }
</script>
</body>
</html>

```

---

### `06_Character_Family_Board_Final.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>06 Character Family Board Final (All 7 Characters Restored)</title>
<style>
  body { background: #F4F3EF; font-family: sans-serif; padding: 40px; display: flex; justify-content: center; }
  .board { width: 880px; background: #FFFFFF; border: 1px solid #E2E2DC; padding: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
  .lane-title { font-size: 13px; font-weight: bold; letter-spacing: 1px; color: #121212; margin-bottom: 20px; border-bottom: 1px solid #E2E2DC; padding-bottom: 6px; text-transform: uppercase; }
  .lane { display: flex; justify-content: center; gap: 40px; margin-bottom: 48px; }
  .character-card { display: flex; flex-direction: column; align-items: center; gap: 12px; width: 120px; ²È="25±ÕÑ”ì‰½ÑÑ½´è´ÄÁÁàì±•™ĞèÍÁàì‰½É‘•Èµ±•™ĞèÉÁàÍ½±¥ÑÉ…¹ÍÁ…É•¹Ğì‰½É‘•ÈµÉ¥¡ĞèÉÁàÍ½±¥ÑÉ…¹ÍÁ…É•¹Ğì‰½É‘•ÈµÑ½ÀèÑÁàÍ½±¥€ŒÉÉÉìˆøğ½‘¥Øøğ½‘¥Øøğ½‘¥Øø4(€€€€€€€€ñ‘¥Ø±…ÍÌô‰±…‰•°ˆùA•¹¥°ğ½‘¥Øøñ‘¥Ø±…ÍÌô‰µ…Ñ•É¥…°ˆùÉ…Á¡¥Ñ”€¼]½½ğ½‘¥Øø4(€€€€€€ğ½‘¥Øø4(€€€€€€ñ‘¥Ø±…ÍÌô‰¡…É…Ñ•Èµ…Éˆø4(€€€€€€€€ñ‘¥Ø±…ÍÌô‰…ÍÍ•Ğµ½¹Ñ…¥¹•Èˆøñ‘¥Ø±…ÍÌô‰•É…Í•Èˆøğ½‘¥Øøğ½‘¥Øø4(€€€€€€€€ñ‘¥Ø±…ÍÌô‰±…‰•°ˆùÉ…Í•Èğ½‘¥Øøñ‘¥Ø±…ÍÌô‰µ…Ñ•É¥…°ˆùQ…Ñ¥±”A¥¹¬IÕ‰‰•Èğ½‘¥Øø4(€€€€€€ğ½‘¥Øø4(€€€€€€ñ‘¥Ø±…ÍÌô‰¡…É…Ñ•Èµ…Éˆø4(€€€€€€€€ñ‘¥Ø±…ÍÌô‰…ÍÍ•Ğµ½¹Ñ…¥¹•Èˆøñ‘¥Ø±…ÍÌô‰Á…Á•Èµ±¥Àˆøğ½‘¥Øøğ½‘¥Øø4(€€€€€€€€ñ‘¥Ø±…ÍÌô‰±…‰•°ˆùA…Á•È±¥Àğ½‘¥Øøñ‘¥Ø±…ÍÌô‰µ…Ñ•É¥…°ˆù	ÉÕÍ¡•MÑ••°]¥É”ğ½‘¥Øø4(€€€€€€ğ½‘¥Øø4(€€€€ğ½‘¥Øø4(€€ğ½‘¥Øø4(ğ½‰½‘äø4(ğ½¡Ñµ°ø4(4)€4(4(´´´4(4(ŒŒŒ€Àİ|Àá}A±…•µ•¹Ñ}5½­ÕÁÍ}¥¹…°¹¡Ñµ±€4(4)¡Ñµ°4(ğ…=QeA¡Ñµ°ø4(ñ¡Ñµ°±…¹œô‰•¸ˆø4(ñ¡•…ø4(ñµ•Ñ„¡…ÉÍ•Ğô‰UQ´àˆø4(ñÑ¥Ñ±”øÀÜ¼ÀàA±…•µ•¹Ğ5½­ÕÁÌ¥¹…°€¡•Í­Ñ½À€˜=™™¥¥…°€ÌÜÕààÄÈ5½‰¥±”Y¥•İÁ½ÉĞ¤ğ½Ñ¥Ñ±”ø4(ñÍÑå±”ø4(€‰½‘äì‰…­É½Õ¹è€ÉÉì™½¹Ğµ™…µ¥±äèÍ…¹ÌµÍ•É¥˜ì‘¥ÍÁ±…äè™±•àì…Àè€ĞÁÁàìÁ…‘‘¥¹œè€ĞÁÁàì©ÕÍÑ¥™äµ½¹Ñ•¹Ğè•¹Ñ•Èìô4(€€4(€€¼¨•Í­Ñ½À1…å½ÕĞ€¨¼4(€€¹‘•Í­Ñ½Àìİ¥‘Ñ è€ÜØÁÁàì‰…­É½Õ¹è€ì‰½àµÍ¡…‘½Üè€À€ÄÁÁà€ÌÁÁàÉ‰„ À°À°À°À¸Ä¤ì‰½É‘•ÈµÉ…‘¥ÕÌè€áÁàì½Ù•É™±½Üè¡¥‘‘•¸ìô4(€€¹¡•…‘•ÈìÁ…‘‘¥¹œè€ÈÁÁà€ÌÉÁàì‰½É‘•Èµ‰½ÑÑ½´è€ÅÁàÍ½±¥€ì‘¥ÍÁ±…äè™±•àì©ÕÍÑ¥™äµ½¹Ñ•¹ĞèÍÁ…”µ‰•Ñİ••¸ì…±¥¸µ¥Ñ•µÌè•¹Ñ•Èìô4(€€¹¥¹¬µ…¹¡½Èìİ¥‘Ñ è€ÈÁÁàì¡•¥¡Ğè€ÈÙÁàì‰…­É½Õ¹è€ŒÁÁÁì±¥ÀµÁ…Ñ èÁ½±å½¸ ÌÀ”€À°€ÜÀ”€À°€ÜÀ”€ÈÀ”°€äÀ”€ĞÀ”°€äÀ”€ÄÀÀ”°€ÄÀ”€ÄÀÀ”°€ÄÀ”€ĞÀ”°€ÌÀ”€ÈÀ”¤ìô4(€€4(€€¹½¹Ñ•¹Ğì‘¥ÍÁ±…äè™±•àìÁ…‘‘¥¹œè€ÌÉÁàì…Àè€ÌÉÁàìô4(€€¹Í¥‘•‰…Èìİ¥‘Ñ è€ÌÉÁàì‘¥ÍÁ±…äè™±•àì©ÕÍÑ¥™äµ½¹Ñ•¹Ğè•¹Ñ•Èìô4(€€4(€€¼¨Õ±°	½½­µ…É¬½µÁ½¹•¹Ğ€¨¼4(€€¹‰½½­µ…É¬µ½µÁ½¹•¹Ğìİ¥‘Ñ è€ÄÙÁàì¡•¥¡Ğè€ĞáÁàì‰…­É½Õ¹è€ŒÅÉÑìÁ½Í¥Ñ¥½¸èÉ•±…Ñ¥Ù”ìµ…É¥¸µÑ½Àè€àÁÁàìô4(€€¹‰½½­µ…É¬µ½µÁ½¹•¹Ğèé…™Ñ•Èì½¹Ñ•¹Ğè€œœìÁ½Í¥Ñ¥½¸è…‰Í½±ÕÑ”ì‰½ÑÑ½´è€Àì±•™Ğè€Àì‰½É‘•Èµ±•™Ğè€áÁàÍ½±¥ÑÉ…¹ÍÁ…É•¹Ğì‰½É‘•ÈµÉ¥¡Ğè€áÁàÍ½±¥ÑÉ…¹ÍÁ…É•¹Ğì‰½É‘•Èµ‰½ÑÑ½´è€ÙÁàÍ½±¥€ìô4(€€¹‰½½­µ…É¬µ½µÁ½¹•¹Ğèé‰•™½É”ì½¹Ñ•¹Ğè€œœìÁ½Í¥Ñ¥½¸è…‰Í½±ÕÑ”ìÑ½Àè€Àì±•™Ğè€Àìİ¥‘Ñ è€ÄÀÀ”ì¡•¥¡Ğè€ÑÁàì‰…­É½Õ¹è€ÕÀÔäìô4(€€4(€€¼¨AÉ½Ñ•Ñ•½µµ•É”i½¹”İ¥Ñ AÉ¥µ…Éä	Ud€¼=IHQ€¨¼4(€€¹½µµ•É”µé½¹”ìÁ…‘‘¥¹œè€ÈÑÁàì‰½É‘•Èè€ÉÁà‘…Í¡•€ŒÑÔÀìÁ½Í¥Ñ¥½¸èÉ•±…Ñ¥Ù”ìµ…É¥¸µ‰½ÑÑ½´è€ÌÉÁàìô4(€€¹‰Ñ¸µ‰ÕäµÁÉ¥µ…Éäì‰…­É½Õ¹è€ŒÄÈÄÈÄÈì½±½Èè€ì‰½É‘•Èè¹½¹”ìÁ…‘‘¥¹œè€ÄÉÁà€ÈáÁàì™½¹Ğµİ•¥¡Ğè‰½±ìÕÉÍ½ÈèÁ½¥¹Ñ•Èì‰½É‘•ÈµÉ…‘¥ÕÌè€ÑÁàìµ…É¥¸µÑ½Àè€ÄÉÁàìô4(€€4(€€¹½‘”µé½¹”ì‰…­É½Õ¹è€ÑÍìÁ…‘‘¥¹œè€ÈÑÁàì™½¹Ğµ™…µ¥±äèµ½¹½ÍÁ…”ì™½¹ĞµÍ¥é”è€ÈÁÁàì½±½Èè€ŒÄÈÄÈÄÈì‘¥ÍÁ±…äè™±•àì…±¥¸µ¥Ñ•µÌè•¹Ñ•Èìô4(4(€€¼¨5½‰¥±”1…å½ÕĞƒŠP=™™¥¥…°€ÌÜÕààÄÈY¥•İÁ½ÉĞ€¨¼4(€€¹µ½‰¥±”ìİ¥‘Ñ è€ÌÜÕÁàì¡•¥¡Ğè€àÄÉÁàì‰…­É½Õ¹è€ì‰½É‘•ÈµÉ…‘¥ÕÌè€ÌÙÁàì‰½É‘•Èè€áÁàÍ½±¥€ŒÄÈÄÈÄÈì½Ù•É™±½Üµäè…ÕÑ¼ì‰½àµÍ¥é¥¹œè‰½É‘•Èµ‰½àìô4(€€¹µ½‰¥±”µ½µµ•É”ìÁ…‘‘¥¹œè€ÈÁÁàìÑ•áĞµ…±¥¸è•¹Ñ•Èì‰½É‘•Èµ‰½ÑÑ½´è€ÅÁàÍ½±¥€ìô4(€€¹µ½‰¥±”µ±•ÍÍ½¸ìÁ…‘‘¥¹œè€ÈÑÁàì‰…­É½Õ¹è€ÑÍì™½¹Ğµ™…µ¥±äèµ½¹½ÍÁ…”ì™½¹ĞµÍ¥é”è€ÄáÁàì‘¥ÍÁ±…äè™±•àì©ÕÍÑ¥™äµ½¹Ñ•¹Ğè•¹Ñ•Èì…±¥¸µ¥Ñ•µÌè•¹Ñ•Èìô4(€€¹µ½‰¥±”µ™½½Ñ•ÈìÁ…‘‘¥¹œè€ÄÙÁàì‘¥ÍÁ±…äè™±•àì©ÕÍÑ¥™äµ½¹Ñ•¹Ğè•¹Ñ•Èì‰½É‘•ÈµÑ½Àè€ÅÁàÍ½±¥€ìô4(€€4(€€¼¨M•µ…¹Ñ¥Œ€ĞáàĞáÁà-•ä	ÕÑÑ½¸Q…É•Ğ€¨¼4(€€¹µ½‰¥±”µ­•äµÑ½Õ µÑ…É•Ğì4(€€€µ¥¸µİ¥‘Ñ è€ĞáÁàìµ¥¸µ¡•¥¡Ğè€ĞáÁàì‰…­É½Õ¹è¹½¹”ì‰½É‘•Èè¹½¹”ìÁ…‘‘¥¹œè€À€ÄÉÁàì4(€€€‘¥ÍÁ±…äè™±•àì…±¥¸µ¥Ñ•µÌè•¹Ñ•Èì…Àè€áÁàìÕÉÍ½ÈèÁ½¥¹Ñ•Èì‰½É‘•ÈµÉ…‘¥ÕÌè€ÑÁàì4(€ô4(€€¹µ½‰¥±”µ­•äµÑ½Õ µÑ…É•Ğé™½ÕÌµÙ¥Í¥‰±”ì½ÕÑ±¥¹”è€ÉÁàÍ½±¥€ŒÀÀÕ™Œìô4(ğ½ÍÑå±”ø4(ğ½¡•…ø4(ñ‰½‘äø4(€€4(€€ğ„´´M-Q=@5=-U@€´´ø4(€€ñ‘¥Ø±…ÍÌô‰‘•Í­Ñ½Àˆø4(€€€€ñ‘¥Ø±…ÍÌô‰¡•…‘•Èˆø4(€€€€€€ñ‘¥ØÍÑå±”ô‰™½¹Ğµİ•¥¡Ğè‰½±ìˆù%‘•„1…ˆ€¼…Ñ…±½œğ½‘¥Øø4(€€€€€€ñ‘¥Ø±…ÍÌô‰¥¹¬µ…¹¡½Èˆøğ½‘¥Øø4(€€€€ğ½‘¥Øø4(€€€€ñ‘¥Ø±…ÍÌô‰½¹Ñ•¹Ğˆø4(€€€€€€ñ‘¥Ø±…ÍÌô‰Í¥‘•‰…Èˆøñ‘¥Ø±…ÍÌô‰‰½½­µ…É¬µ½µÁ½¹•¹Ğˆøğ½‘¥Øøğ½‘¥Øø4(€€€€€€ñ‘¥ØÍÑå±”ô‰™±•àè€Äìˆø4(€€€€€€€€ñ‘¥Ø±…ÍÌô‰½µµ•É”µé½¹”ˆø4(€€€€€€€€€€ñ‘¥ØÍÑå±”ô‰™½¹ĞµÍ¥é”è€ÄÅÁàì½±½Èè€ŒÑÔÀì™½¹Ğµİ•¥¡Ğè‰½±ìµ…É¥¸µ‰½ÑÑ½´è€ÑÁàìˆùAI=QQ=55Ii=9ğ½‘¥Øø4(€€€€€€€€€€ñ ÈÍÑå±”ô‰µ…É¥¸è€À€À€áÁàìˆù%¹ÑÉ½‘ÕÑ½ÉäAåÑ¡½¸1½¥Œ€¡M…µÁ±”¤ğ½ Èø4(€€€€€€€€€€ñ‘¥ØÍÑå±”ô‰™½¹ĞµÍ¥é”è€ÈÁÁàì™½¹Ğµİ•¥¡Ğè‰½±ìˆøÈĞ¸ääğ½‘¥Øø4(€€€€€€€€€€ğ„´´AÉ¥µ…Éä	Ud€¼=IHQI•ÍÑ½É•€´´ø4(€€€€€€€€€€ñ‰ÕÑÑ½¸±…ÍÌô‰‰Ñ¸µ‰ÕäµÁÉ¥µ…Éäˆù	Ud9=\ğ½‰ÕÑÑ½¸ø4(€€€€€€€€ğ½‘¥Øø4(€€€€€€€€ñ‘¥Ø±…ÍÌô‰½‘”µé½¹”ˆø4(€€€€€€€€€€ñÍÁ…¸ùÁÉ¥¹Ğğ½ÍÁ…¸ø4(€€€€€€€€€€ñÍÙœÙ¥•İ	½àôˆÀ€À€ÈÀ€ØÀˆİ¥‘Ñ ôˆÄÀˆ¡•¥¡ĞôˆÈàˆÍÑå±”ô‰™¥±°èŒÅÉÑˆøñÁ…Ñ ô‰4ÄĞ€Ğ€Ø€Äà°€Ø€ĞÈ°€ÄĞ€ÔØ€ÄÄ€ĞÀ°€ÄÄ€ÈÀ°€ÄĞ€Ğhˆ¼øğ½ÍÙœø4(€€€€€€€€€€ñÍÁ…¸ÍÑå±”ô‰½±½Èè€ŒÉ„ÙˆÍˆìˆø‰!•±±¼ˆğ½ÍÁ…¸ø4(€€€€€€€€€€ñÍÙœÙ¥•İ	½àôˆÀ€À€ÈÀ€ØÀˆİ¥‘Ñ ôˆÄÀˆ¡•¥¡ĞôˆÈàˆÍÑå±”ô‰™¥±°èŒÅÉÑˆøñÁ…Ñ ô‰4Ø€Ğ€ÄĞ€Äà°€ÄĞ€ĞÈ°€Ø€ÔØ€ä€ĞÀ°€ä€ÈÀ°€Ø€Ğhˆ¼øğ½ÍÙœø4(€€€€€€€€ğ½‘¥Øø4(€€€€€€ğ½‘¥Øø4(€€€€ğ½‘¥Øø4(€€ğ½‘¥Øø4(4(€€ğ„´´5=	%15=-U@€ ÌÜÕààÄÈY¥•İÁ½ÉĞ¤€´´ø4(€€ñ‘¥Ø±…ÍÌô‰µ½‰¥±”ˆø4(€€€€ñ‘¥Ø±…ÍÌô‰µ½‰¥±”µ½µµ•É”ˆø4(€€€€€€ñ‘¥ØÍÑå±”ô‰İ¥‘Ñ è€ÄÈÁÁàì¡•¥¡Ğè€ÄØÁÁàì‰…­É½Õ¹è€ÉÉìµ…É¥¸è€À…ÕÑ¼€ÄÉÁàìˆøğ½‘¥Øø4(€€€€€€ñ ÌÍÑå±”ô‰µ…É¥¸è€Àìˆù1½¥Œ€˜MÑÉÕÑÕÉ”ğ½ Ìø4(€€€€€€ñ‘¥ØÍÑå±”ô‰µ…É¥¸è€áÁà€Àì™½¹Ğµİ•¥¡Ğè‰½±ìˆøÈĞ¸ääğ½‘¥Øø4(€€€€€€ñ‰ÕÑÑ½¸ÍÑå±”ô‰‰…­É½Õ¹è€ŒÄÈÄÈÄÈì½±½Èè€ìÁ…‘‘¥¹œè€ÄÉÁàìİ¥‘Ñ è€ÄÀÀ”ì‰½É‘•Èè¹½¹”ì™½¹Ğµİ•¥¡Ğè‰½±ì‰½É‘•ÈµÉ…‘¥ÕÌè€ÑÁàìˆùQ<IPğ½‰ÕÑÑ½¸ø4(€€€€ğ½‘¥Øø4(€€€€ñ‘¥Ø±…ÍÌô‰µ½‰¥±”µ±•ÍÍ½¸ˆø4(€€€€€€ğ„´´á…ĞÁÉ¥¹Ğ ‰!•±±¼ˆ¤İ¥Ñ ¥é¥•ÈA•Éä€´´ø4(€€€€€€ñÍÁ…¸ùÁÉ¥¹Ğğ½ÍÁ…¸ø4(€€€€€€ñÍÙœÙ¥•İ	½àôˆÀ€À€ÈÀ€ØÀˆİ¥‘Ñ ôˆäˆ¡•¥¡ĞôˆÈĞˆÍÑå±”ô‰™¥±°èŒÅÉÑˆøñÁ…Ñ ô‰4ÄĞ€Ğ€Ø€Äà°€Ø€ĞÈ°€ÄĞ€ÔØ€ÄÄ€ĞÀ°€ÄÄ€ÈÀ°€ÄĞ€Ğhˆ¼øğ½ÍÙœø4(€€€€€€ñÍÁ…¸ÍÑå±”ô‰½±½Èè€ŒÉ„ÙˆÍˆìˆø‰!•±±¼ˆğ½ÍÁ…¸ø4(€€€€€€ñÍÙœÙ¥•İ	½àôˆÀ€À€ÈÀ€ØÀˆİ¥‘Ñ ôˆäˆ¡•¥¡ĞôˆÈĞˆÍÑå±”ô‰™¥±°èŒÅÉÑˆøñÁ…Ñ ô‰4Ø€Ğ€ÄĞ€Äà°€ÄĞ€ĞÈ°€Ø€ÔØ€ä€ĞÀ°€ä€ÈÀ°€Ø€Ğhˆ¼øğ½ÍÙœø4(€€€€ğ½‘¥Øø4(€€€€ñ‘¥Ø±…ÍÌô‰µ½‰¥±”µ™½½Ñ•Èˆø4(€€€€€€ñ‰ÕÑÑ½¸±…ÍÌô‰µ½‰¥±”µ­•äµÑ½Õ µÑ…É•Ğˆ…É¥„µ±…‰•°ô‰U¹±½¬µåÍÑ•ÉäÁÕéé±”ˆø4(€€€€€€€€ñÍÙœİ¥‘Ñ ôˆÈĞˆ¡•¥¡ĞôˆÈĞˆÙ¥•İ	½àôˆÀ€À€Ğà€Ğàˆøñ¥É±”àôˆÄÈˆäôˆÈĞˆÈôˆÜˆ™¥±°ô‰¹½¹”ˆÍÑÉ½­”ôˆŒÅÅÅˆÍÑÉ½­”µİ¥‘Ñ ôˆÌ¸Ôˆ¼øñÉ•ĞàôˆÄäˆäôˆÈÈ¸Èˆİ¥‘Ñ ôˆÈÈˆ¡•¥¡ĞôˆÌ¸Ôˆ™¥±°ôˆŒÅÅÅˆ¼øñÉ•ĞàôˆÌÔˆäôˆÈÔ¸Üˆİ¥‘Ñ ôˆØˆ¡•¥¡ĞôˆÜˆ™¥±°ôˆŒÅÅÅˆ¼øğ½ÍÙœø4(€€€€€€€€ñÍÁ…¸ÍÑå±”ô‰™½¹ĞµÍ¥é”è€ÄÍÁàì™½¹Ğµİ•¥¡Ğè‰½±ì½±½Èè€ŒÄÈÄÈÄÈìˆùU¹±½¬AÕéé±”ğ½ÍÁ…¸ø4(€€€€€€ğ½‰ÕÑÑ½¸ø4(€€€€ğ½‘¥Øø4(€€ğ½‘¥Øø4(4(ğ½‰½‘äø4(ğ½¡Ñµ°ø4(4)€4(4(´´´4(4(ŒŒŒQ•±•µ•ÑÉå}5…ÑÉ¥á}¥¹…°¹ÍÙ€4(4)ÍØ4)ÍÍ•Ñ}%±½¹Ñ•áĞ±	É½İÍ•É}=L±AÉ½™¥±•É}AL±•ÍÍ¥‰¥±¥Ñå}M…¹¹•È±áÑ•É¹…±}•Á•¹‘•¹å}-±%¹±¥¹•})M}-±5•…ÍÕÉ•‘}AL±5•…ÍÕÉ•‘}1L±I5}…±±‰…­}MÑ…Ñ”4(ÀÅ}A•Éä±%Í½±…Ñ•‘}ÍÍ•Ğ±¡É½µ”€ÄÔĞ€¼µ…=L€ÄÔ±¡É½µ”•ÙQ½½±ÌA•É™½Éµ…¹”±á”½É”€Ğ¸à°À¸À°À¸Ä°ØÀ°À¸ÀÀ±MÑ…Ñ¥Œ€ €¤½¹Ñ…¥¹•È4(ÀÅ}A•Éä±%¹Ñ•É…Ñ•‘}1•…É¹¥¹}A…”±M…™…É¤€ÈÀ€¼¥=L€ÈÀ±M…™…É¤]•ˆ%¹ÍÁ•Ñ½ÈQ¥µ•±¥¹”±á”½É”€Ğ¸à°À¸À°À¸à°ØÀ°À¸ÀÀ±MÑ…Ñ¥Œ€ €¤½¹Ñ…¥¹•È4(ÀÉ}É…Í•È±%Í½±…Ñ•‘}ÍÍ•Ğ±¡É½µ”€ÄÔĞ€¼µ…=L€ÄÔ±¡É½µ”•ÙQ½½±ÌA•É™½Éµ…¹”±á”½É”€Ğ¸à°À¸À°À¸Ğ°ØÀ°À¸ÀÀ±%¹ÍÑ…¹ĞÁÉ¥¹Ğ ‰¼ˆ¤4(ÀÉ}É…Í•È±%¹Ñ•É…Ñ•‘}1•…É¹¥¹}A…”±M…™…É¤€ÈÀ€¼¥=L€ÈÀ±M…™…É¤]•ˆ%¹ÍÁ•Ñ½ÈQ¥µ•±¥¹”±á”½É”€Ğ¸à°À¸À°Ä¸Ä°ØÀ°À¸ÀÀ±%¹ÍÑ…¹ĞÁÉ¥¹Ğ ‰¼ˆ¤4(ÀÍ}	½½­µ…É¬±%Í½±…Ñ•‘}ÍÍ•Ğ±¡É½µ”€ÄÔĞ€¼µ…=L€ÄÔ±¡É½µ”•ÙQ½½±ÌA•É™½Éµ…¹”±á”½É”€Ğ¸à°À¸À°À¸È°ØÀ°À¸ÀÀ±MÑ…Ñ¥Œ5…É¥¸Q…ˆ4(ÀÍ}	½½­µ…É¬±%¹Ñ•É…Ñ•‘}…Ñ…±½}A…”±¡É½µ”€ÄÔĞ€¼µ…=L€ÄÔ±¡É½µ”•ÙQ½½±ÌA•É™½Éµ…¹”±á”½É”€Ğ¸à°À¸À°À¸Ô°ØÀ°À¸ÀÀ±MÑ…Ñ¥Œ5…É¥¸Q…ˆ4(ÀÑ}-•ä±%Í½±…Ñ•‘}ÍÍ•Ğ±¡É½µ”€ÄÔĞ€¼µ…=L€ÄÔ±¡É½µ”•ÙQ½½±ÌA•É™½Éµ…¹”±á”½É”€Ğ¸à°À¸À°À¸Ì°ØÀ°À¸ÀÀ±MÑ…Ñ¥Œ-•ä%½¸4(ÀÑ}-•ä±%¹Ñ•É…Ñ•‘}5½‰¥±•}	½½­}•Ñ…¥°±M…™…É¤€ÈÀ€¼¥=L€ÈÀ±M…™…É¤]•ˆ%¹ÍÁ•Ñ½ÈQ¥µ•±¥¹”±á”½É”€Ğ¸à°À¸À°À¸Ü°Ôà´ØÀ°À¸ÀÀ±MÑ…Ñ¥Œ-•ä%½¸4(4)€