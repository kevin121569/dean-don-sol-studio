/* Additive QA-only discoverability for the shared Case 3–5 renderer. */
(() => {
  "use strict";
  let primaryIds = null;
  let previousCount = null;
  let hasScrolled = false;
  let cue = null;
  let marker = null;
  let scheduled = false;
  let audioContext = null;

  function playChime() {
    if (!audioContext || audioContext.state !== "running") return;
    try {
      const start = audioContext.currentTime + 0.01;
      for (const [frequency, delay] of [[523.25, 0], [659.25, 0.15]]) {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.type = "sine";
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0.0001, start + delay);
        gain.gain.exponentialRampToValueAtTime(0.025, start + delay + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + delay + 0.27);
        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        oscillator.start(start + delay);
        oscillator.stop(start + delay + 0.28);
      }
    } catch { /* Respect browser audio blocking without interrupting the case. */ }
  }

  function refresh() {
    scheduled = false;
    if (!document.body) return;
    if (!cue) {
      cue = document.createElement("div");
      cue.className = "harness-scroll-cue";
      cue.innerHTML = '<span class="arrow" aria-hidden="true">↓</span><span>Scroll for more</span>';
      cue.setAttribute("role", "status");
      document.body.append(cue);
    }
    cue.hidden = hasScrolled || document.documentElement.scrollHeight - window.innerHeight < 28 || Boolean(document.querySelector(".drawer:not([hidden])"));

    const grid = document.querySelector(".evidence-grid");
    const cards = [...document.querySelectorAll(".evidence-card")];
    if (!grid || cards.length < 4) return;
    if (!primaryIds) primaryIds = cards.slice(0, 4).map(card => card.dataset.id);
    const primary = cards.filter(card => primaryIds.includes(card.dataset.id));
    const count = primary.filter(card => card.classList.contains("inspected")).length;
    if (previousCount !== null && previousCount < 4 && count === 4) playChime();
    previousCount = count;

    // Only an already-unlocked hidden card can pulse; never reveal evidence here.
    const hidden = cards.find(card => !primaryIds.includes(card.dataset.id));
    for (const card of cards) {
      card.classList.toggle("harness-fifth-pulse", Boolean(card === hidden && count === 4 && !card.classList.contains("inspected")));
    }
    if (count === 4) {
      if (!marker) {
        marker = document.createElement("div");
        marker.className = "harness-four-marker";
        marker.textContent = "Four clues checked—look deeper";
        marker.setAttribute("role", "status");
      }
      if (marker.previousElementSibling !== grid) grid.insertAdjacentElement("afterend", marker);
    } else if (marker?.isConnected) marker.remove();
  }

  function queue() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(refresh);
  }

  // Initialize the audio context only during the actual fourth-clue tap.
  document.addEventListener("click", event => {
    const card = event.target.closest?.(".evidence-card");
    if (!card || !primaryIds?.includes(card.dataset.id) || card.classList.contains("inspected")) return;
    const inspected = [...document.querySelectorAll(".evidence-card.inspected")].filter(item => primaryIds.includes(item.dataset.id)).length;
    if (inspected !== 3 || audioContext) return;
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (Audio) { audioContext = new Audio(); void audioContext.resume().catch(() => {}); }
    } catch {}
  }, true);

  window.addEventListener("scroll", event => {
    if ((event.target?.scrollTop ?? window.scrollY) > 5) {
      hasScrolled = true;
      if (cue) cue.hidden = true;
    }
  }, true);

  const observer = new MutationObserver(queue);
  if (document.body) observer.observe(document.body, {childList: true, subtree: true});
  const timer = setInterval(queue, 400);
  window.addEventListener("pagehide", () => {observer.disconnect(); clearInterval(timer); void audioContext?.close();}, {once: true});
  queue();
})();
