/* Build G: additive feedback for shared Cases 3–5; no puzzle rules or case data changed. */
(() => {
  "use strict";
  let primaryIds = null;
  let previousCount = null;
  let hasScrolled = false;
  let cue = null;
  let marker = null;
  let scheduled = false;
  let audioContext = null;
  let soundWanted = false;
  let toast = null;
  let toastTimer = null;

  function soundContext() {
    if (!audioContext) {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return null;
      try { audioContext = new Audio(); } catch { return null; }
    }
    if (audioContext.state === "suspended") void audioContext.resume().catch(() => {});
    return audioContext;
  }

  function tone(frequency = 680, volume = 0.008, duration = 0.065, delay = 0) {
    if (!soundWanted || !audioContext || audioContext.state !== "running") return;
    try {
      const start = audioContext.currentTime + delay + 0.01;
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.01);
    } catch {}
  }

  function playChime() {
    if (!soundWanted) return;
    tone(523.25, 0.024, 0.27);
    tone(659.25, 0.024, 0.27, 0.15);
  }

  function showToast() {
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "harness-tap-feedback";
      toast.setAttribute("role", "status");
      toast.textContent = "Clue opened ✓";
    }
    document.body.append(toast);
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { if (toast) toast.hidden = true; }, 850);
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

    // Preserve hidden clue eligibility; only label an existing, already revealed clue.
    const hidden = cards.find(card => !primaryIds.includes(card.dataset.id));
    for (const card of cards) {
      const ready = card === hidden && count === 4 && !card.classList.contains("inspected");
      card.classList.toggle("harness-fifth-pulse", Boolean(ready));
      let label = card.querySelector(".harness-new-lead");
      if (ready && !label) {
        label = document.createElement("span");
        label.className = "harness-new-lead";
        label.textContent = "Something new to search for";
        card.append(label);
      } else if (!ready && label) {
        label.remove();
      }
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

    // Shared cases have no original sound switch. Default OFF until explicitly enabled.
    let switchButton = document.getElementById("harnessSharedSound");
    if (!switchButton) {
      switchButton = document.createElement("button");
      switchButton.type = "button";
      switchButton.id = "harnessSharedSound";
      switchButton.className = "harness-sound-toggle";
      switchButton.setAttribute("aria-label", "Toggle clue confirmation sound");
      grid.insertAdjacentElement("beforebegin", switchButton);
    }
    switchButton.textContent = soundWanted ? "🔊 Sound: ON" : "🔇 Sound: OFF";
    switchButton.setAttribute("aria-pressed", String(soundWanted));
  }

  function queue() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(refresh);
  }

  document.addEventListener("click", event => {
    if (event.target.closest?.("#harnessSharedSound")) {
      soundWanted = !soundWanted;
      if (soundWanted) soundContext();
      queue();
      return;
    }
    const card = event.target.closest?.(".evidence-card");
    if (!card) return;
    if (soundWanted) {
      soundContext();
      tone(650, 0.008, 0.055);
    }
    // Only acknowledge a successfully opened record, not an inert or blocked tap.
    setTimeout(() => {
      const drawer = document.querySelector(".drawer:not([hidden])");
      if (drawer) showToast();
    }, 80);
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
  window.addEventListener("pagehide", () => {
    observer.disconnect();
    clearInterval(timer);
    clearTimeout(toastTimer);
    void audioContext?.close();
  }, {once: true});
  queue();
})();
