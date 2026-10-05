(() => {
  const filters = document.getElementById('filters');
  const filterResult = document.getElementById('filterResult');
  if (!filters || !filterResult) return;

  if (!document.querySelector('link[data-adult-wormhole]')) {
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = 'adult-wormhole.css?v=1';
    stylesheet.dataset.adultWormhole = 'v1';
    document.head.appendChild(stylesheet);
  }

  const module = document.createElement('section');
  module.id = 'adultWormhole';
  module.className = 'adult-wormhole';
  module.hidden = true;
  module.setAttribute('aria-labelledby', 'adultWormholeTitle');
  module.innerHTML = `
    <div class="aw-copy">
      <p class="eyebrow">THE RABBIT HOLE SHELF</p>
      <h3 id="adultWormholeTitle">Go in straight. <em>Come out bent.</em></h3>
      <p>For the books that rearrange the furniture in your head. The thought stays the same object; the angle changes after it passes through.</p>
    </div>
    <div class="aw-stage-card">
      <div class="aw-visual" role="img" aria-label="Optical refraction demonstration: one thought enters straight, crosses a brass seam, and emerges bent by three and a half degrees.">
        <div class="aw-stage-label">Adult catalog / optical refraction</div>
        <div class="aw-seam" aria-hidden="true"></div>
        <div class="aw-layer aw-layer-left" aria-hidden="true">
          <div class="aw-mover" data-aw-mover="left">
            <div class="aw-object aw-object-straight">
              <span class="aw-rule"></span><span>COGNITIVE PARADIGM</span><span class="aw-rule"></span>
            </div>
          </div>
        </div>
        <div class="aw-layer aw-layer-right" aria-hidden="true">
          <div class="aw-bend-space">
            <div class="aw-mover" data-aw-mover="right">
              <div class="aw-object aw-object-bent">
                <span class="aw-rule"></span><span>COGNITIVE PARADIGM</span><span class="aw-rule"></span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="aw-footer">
        <span class="aw-tagline">Same thought. Different angle.</span>
        <button class="aw-replay" type="button" aria-label="Replay wormhole transformation">Replay transformation</button>
      </div>
    </div>`;

  filterResult.insertAdjacentElement('afterend', module);

  const movers = [...module.querySelectorAll('[data-aw-mover]')];
  const replay = module.querySelector('.aw-replay');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let hasPlayed = false;

  function play() {
    if (reducedMotion.matches) return;
    movers.forEach(mover => mover.classList.remove('play'));
    void module.offsetWidth;
    movers.forEach(mover => mover.classList.add('play'));
    hasPlayed = true;
  }

  function setVisible(show) {
    module.hidden = !show;
    if (show && !hasPlayed) play();
  }

  filters.addEventListener('click', event => {
    const button = event.target.closest('[data-filter]');
    if (!button) return;
    setVisible(button.dataset.filter === 'fiction');
  });

  replay.addEventListener('click', play);

  // Respect the already-active chip if this script is ever loaded after state restoration.
  const active = filters.querySelector('[data-filter].active');
  setVisible(active?.dataset.filter === 'fiction');
})();
