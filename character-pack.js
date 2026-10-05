(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!$('link[data-character-pack]')) {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'character-pack.css?v=1';
    css.dataset.characterPack = 'v1';
    document.head.appendChild(css);
  }

  const books = $('#books');
  if (books && !$('.cp-bookmark', books)) {
    const bookmark = document.createElement('span');
    bookmark.className = 'cp-bookmark';
    bookmark.setAttribute('aria-hidden', 'true');
    books.appendChild(bookmark);
  }

  const studio = $('#studio');
  if (studio && !$('.cp-ink-anchor', studio)) {
    const ink = document.createElement('span');
    ink.className = 'cp-ink-anchor';
    ink.setAttribute('aria-hidden', 'true');
    ink.innerHTML = '<span class="cp-cork"></span><span class="cp-glass"></span>';
    studio.appendChild(ink);
  }

  const labMachine = $('#lab .machine');
  if (labMachine && !$('.cp-learning', labMachine)) {
    const learning = document.createElement('div');
    learning.className = 'cp-learning';
    learning.innerHTML = `
      <div class="cp-learning-head">
        <strong>Living Learning Objects</strong>
        <span>Objects teach by doing what they already do.</span>
      </div>
      <code class="cp-code" id="cpPercyCode">
        <span class="cp-sr-only">print("Hello")</span>
        <span aria-hidden="true">print</span>
        <svg class="cp-percy-svg cp-percy-left" viewBox="0 0 20 60" width="10" height="30" aria-hidden="true"><path d="M14 4 C 6 18, 6 42, 14 56 C 11 40, 11 20, 14 4 Z"/></svg>
        <span class="cp-code-string" aria-hidden="true">"Hello"</span>
        <svg class="cp-percy-svg cp-percy-right" viewBox="0 0 20 60" width="10" height="30" aria-hidden="true"><path d="M6 4 C 14 18, 14 42, 6 56 C 9 40, 9 20, 6 4 Z"/></svg>
      </code>
      <div class="cp-learning-row" aria-label="Learning objects">
        <div class="cp-object" role="img" aria-label="Percy the Parenthesis Princess, represented by one pair of parentheses">
          <span class="cp-object-asset" aria-hidden="true">
            <svg viewBox="0 0 44 60" width="34" height="46">
              <path d="M18 4 C 10 18, 10 42, 18 56 C 15 40, 15 20, 18 4 Z" fill="#1A2B4C"/>
              <path d="M26 4 C 34 18, 34 42, 26 56 C 29 40, 29 20, 26 4 Z" fill="#1A2B4C"/>
            </svg>
          </span>
          <span>PERcy</span>
        </div>
        <div class="cp-object" role="img" aria-label="Pencil">
          <span class="cp-object-asset" aria-hidden="true"><span class="cp-pencil"></span></span>
          <span>Pencil</span>
        </div>
        <div class="cp-object" role="img" aria-label="Eraser">
          <span class="cp-object-asset" aria-hidden="true"><span class="cp-eraser"></span></span>
          <span>Eraser</span>
        </div>
        <div class="cp-object" role="img" aria-label="Paper Clip">
          <span class="cp-object-asset" aria-hidden="true"><span class="cp-paperclip"></span></span>
          <span>Paper Clip</span>
        </div>
      </div>`;
    labMachine.appendChild(learning);

    const percy = $('#cpPercyCode');
    if (percy) {
      if (reduceMotion) percy.classList.add('is-active');
      else window.setTimeout(() => percy.classList.add('is-active'), 400);
    }
  }

  const mysteryMachine = $('#reading-mystery .machine');
  if (mysteryMachine && !$('.cp-key-link', mysteryMachine)) {
    const key = document.createElement('a');
    key.className = 'cp-key-link';
    key.href = '/missing-page/';
    key.setAttribute('aria-label', 'Unlock The Missing Page puzzle');
    key.innerHTML = `
      <svg class="cp-key-svg" width="24" height="24" viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="12" cy="24" r="7" fill="none" stroke="#1A1A1A" stroke-width="3.5"/>
        <rect x="19" y="22.2" width="22" height="3.5" fill="#1A1A1A"/>
        <rect x="35" y="25.7" width="6" height="7" fill="#1A1A1A"/>
      </svg>
      <span>Unlock puzzle</span>`;
    mysteryMachine.appendChild(key);
  }
})();
