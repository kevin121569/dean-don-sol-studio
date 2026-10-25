(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const books = window.IL_BOOKS || [];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  // Publishing statuses are rendered from the current catalog HTML/data.
  // Do not overwrite them here; this script only handles interaction.

  // Keep the homepage film section current without forcing a full static rebuild.
  const film = $('#film');
  if (film) {
    const filmCopy = $('div', film);
    const lede = filmCopy ? $('.lede-sm', filmCopy) : null;
    if (lede) lede.textContent = 'Four AIs. One human in the middle. A containment system that may save everyone by erasing the thing nobody knows how to measure.';
    const statusRow = $('.status-row', film);
    if (statusRow) statusRow.innerHTML = '<span class="status ready">Feature screenplay complete</span><span class="status ready">Novel submitted to Google Play Books</span>';
    const reel = $('#reel');
    if (reel) reel.innerHTML = '<article class="frame"><h3>GOOD LUCK WITH THAT</h3><p>A backhoe reverses through the future while one wall survives long enough to keep the joke.</p></article><article class="frame"><h3>HUMAN API</h3><p>Boy finds. Tooth verifies. Darth attacks. Don orchestrates. Kevin decides.</p></article><article class="frame"><h3>SERVER 4</h3><p>No one is sure. Somebody still has to pull the plug.</p></article><article class="frame"><h3>THE BOOK IS BACK</h3><p><a class="btn primary small" href="/the-harness/clips.html">Watch motion teasers</a> <a class="btn ghost small" href="/samples/harness.html">Read excerpt</a></p></article>';
  }

  // Catalog cards are HTML; JavaScript only filters the reader shelves.
  $('#filters').addEventListener('click', e => {
    const button = e.target.closest('[data-filter]');
    if (!button) return;
    $$('.chip', $('#filters')).forEach(chip => {
      chip.classList.toggle('active', chip === button);
      chip.setAttribute('aria-pressed', String(chip === button));
    });
    $$('.book', $('#bookGrid')).forEach(card => {
      card.hidden = button.dataset.filter !== 'all' && card.dataset.shelf !== button.dataset.filter;
    });
    const count = $$('.book:not([hidden])', $('#bookGrid')).length;
    $('#filterResult').textContent = button.dataset.filter === 'all' ? `Showing all ${count} books.` : `Showing ${count} ${count === 1 ? 'book' : 'books'} in ${button.textContent.toLowerCase()}.`;
  });
  const mobile = $('#mobileNav'), menu = $('#menu');
  function setMenu(open) {
    mobile.hidden = !open;
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.textContent = open ? '✕' : '☰';
    document.body.classList.toggle('mobile-menu-open', open);
  }
  menu.onclick = () => setMenu(mobile.hidden);
  mobile.onclick = e => { if (e.target.closest('a')) setMenu(false); };
  const aiNames = $$('.win b').map(b => b.textContent);
  const replies = ['I have an idea. Show the others.', 'I have questions. Send them back to Don.', 'Let’s check what could go wrong.', 'I have the context. Here is another angle.'];
  let pastes = 0, autoplayStopped = false, timer;
  function handoff(index) {
    $$('.win').forEach(w => w.classList.toggle('flash', Number(w.dataset.win) === index));
    $(`.win[data-win="${index}"] p`).textContent = replies[index];
    $('#pasteCount').textContent = String(++pastes);
    $('#apiStatus').textContent = `Kevin pasted the message to ${aiNames[index]}.`;
  }
  $('#wins').onclick = e => {
    const win = e.target.closest('[data-win]');
    if (!win) return;
    autoplayStopped = true; clearTimeout(timer); handoff(Number(win.dataset.win));
  };
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect(); let index = 0;
      function next() {
        if (autoplayStopped) return;
        handoff(index++);
        if (index < 4) timer = setTimeout(next, 1000);
        else $('#apiStatus').textContent = 'One round complete. Click a window to keep the conversation going.';
      }
      next();
    }, {threshold:0.3});
    observer.observe($('#wins'));
  }
  const librarianFilm = $('#librarianHeroFilm');
  const librarianReplay = $('#librarianHeroReplay');
  if (librarianFilm && librarianReplay) {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reducedMotion.matches) librarianFilm.pause();
    librarianReplay.onclick = () => {
      try { librarianFilm.currentTime = 0; librarianFilm.play().catch(() => {}); } catch (_) {}
    };
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) librarianFilm.pause();
    });
  }
  $('#year').textContent = new Date().getFullYear();
})();

(() => {
  const characterPack = document.createElement('script');
  characterPack.src = 'character-pack.js?v=1';
  characterPack.async = false;
  document.head.appendChild(characterPack);
})();

(() => {
  const wormhole = document.createElement('script');
  wormhole.src = 'adult-wormhole.js?v=1';
  wormhole.async = false;
  document.head.appendChild(wormhole);
})();
