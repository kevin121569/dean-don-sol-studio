(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const books = window.IL_BOOKS || [];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
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
  }
  menu.onclick = () => setMenu(mobile.hidden);
  mobile.onclick = e => { if (e.target.closest('a')) setMenu(false); };
  const toothLines = ['Don calls this a studio. I call it nine deadlines wearing a trench coat.', 'The domain works. Apparently standards are optional.', 'I reviewed the catalog. Several books contain feelings. Unfortunate.', 'Ask Sol for a recommendation. Then ask me why he is wrong.'];
  $('#toothBtn').onclick = () => { $('#heroSpeech').textContent = toothLines[Math.floor(Math.random() * toothLines.length)]; };
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
  const lab = window.IL_LAB;
  let current = [lab.who[0], lab.what[0], lab.rule[0]], pins = [];
  const choose = a => a[Math.floor(Math.random() * a.length)];
  function showIdea() {
    $('#who').textContent = current[0]; $('#what').textContent = current[1]; $('#rule').textContent = current[2];
    $('#idea').textContent = `What if ${current[0]} ${current[1]}, ${current[2]}?`;
  }
  $('#spin').onclick = () => { current = [choose(lab.who), choose(lab.what), choose(lab.rule)]; showIdea(); };
  $('#pin').onclick = () => {
    const idea = $('#idea').textContent;
    if (!pins.includes(idea)) pins.unshift(idea);
    pins = pins.slice(0, 6);
    $('#pins').innerHTML = pins.map(item => `<div class="pin-item">${esc(item)}</div>`).join('');
  };
  // Recommendations are drawn from this local catalog, with no API calls.
  const scrim = $('#scrim'), panel = $('#concierge'), answer = $('#answer');
  let returnFocus;
  function open() {
    returnFocus = document.activeElement; scrim.hidden = panel.hidden = false;
    document.body.style.overflow = 'hidden'; $('#closeConcierge').focus();
  }
  function close() {
    scrim.hidden = panel.hidden = true; document.body.style.overflow = ''; returnFocus?.focus();
  }
  $$('[data-open-concierge]').forEach(button => { button.onclick = open; });
  $('#closeConcierge').onclick = close; scrim.onclick = close;
  document.addEventListener('keydown', e => {
    if (panel.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    if (e.key === 'Tab') {
      const controls = $$('button,a[href]', panel), first = controls[0], last = controls.at(-1);
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  const picks = [['Bend my brain','distance'],['Make me laugh about AI','harness'],['Hit me emotionally','memory'],['Give me something true','fight'],['For kids','questions'],['Give me a wild card','random']];
  $('#choices').innerHTML = picks.map(([title,id]) => `<button type="button" data-pick="${id}">${title}</button>`).join('');
  $('#choices').onclick = e => {
    const button = e.target.closest('[data-pick]'); if (!button) return;
    const book = button.dataset.pick === 'random' ? choose(books) : books.find(b => b.id === button.dataset.pick);
    answer.innerHTML = `<b>${esc(book.title)}</b><p>${esc(book.blurb)}</p><span class="status ${esc(book.group)}">${esc(book.status)}</span><div class="book-actions"><a class="btn primary small" href="/${book.slug}/">Explore this book</a></div>`;
  };
  $('#year').textContent = new Date().getFullYear();
})();
