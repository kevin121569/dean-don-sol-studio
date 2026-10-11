/* The Librarian's return conversation. One page visit only: no cookies, storage,
   analytics, server requests, inference about finishing a sample, or generated copy.
   Original book previews and original actor remain unchanged. */
(() => {
  'use strict';
  const desk = document.getElementById('readingDesk');
  const pitch = document.getElementById('bookDialog');
  const adult = document.getElementById('adultWorld');
  const sampleLink = document.getElementById('readerExternal');
  if (!desk || !pitch || !adult || !sampleLink) return;

  const books = {
    distance: {title:'The Distance Between Thoughts', next:'god',
      thought:'A question about memory can lead to a question about what any mind can truly know.'},
    god: {title:'What God Could Not Know', next:'distance',
      thought:'From the limits of knowing to the mystery of remembering: another quiet puzzle awaits.'},
    harness: {title:'The Harness', next:'forty',
      thought:'If the choices surrounding artificial minds caught your attention, another story takes that question to a Missouri farm.'},
    forty: {title:'Forty Bales', next:'harness',
      thought:'From care on a quiet farm to four minds facing a dangerous reset—the next story raises the stakes.'},
    memory: {title:'The Last Memory', next:'stardust',
      thought:'If memory surviving across time intrigues you, this next story asks what an archive can—and cannot—preserve.'},
    stardust: {title:'Stardust', next:'memory',
      thought:'For another story about remembrance, consider a leap through time so vast that the world itself becomes unfamiliar.'},
    fight: {title:'Fight Your Way Through', next:'stops',
      thought:'Some survival skills stay with us long after the danger. This companion asks what happens when those habits must change.'},
    stops: {title:'When Fighting Stops Working', next:'fight',
      thought:'To understand the roots of resilience, here is a lived account of the difficult road on which it was learned.'}
  };
  const openedThisVisit = new Set();
  let pending = null;
  let suggestion = null;

  const panel = document.createElement('aside');
  panel.className = 'reading-journey-note';
  panel.setAttribute('aria-label', 'A follow-up from the Librarian');
  panel.hidden = true;
  panel.innerHTML =
    '<div class="reading-journey-eyebrow">THE LIBRARIAN · A THOUGHT BEFORE YOU GO</div>' +
    '<p class="reading-journey-copy" id="readingJourneyCopy" role="status" aria-live="polite"></p>' +
    '<div class="reading-journey-actions">' +
      '<button type="button" id="readingJourneyNext"></button>' +
      '<button type="button" class="reading-journey-dismiss" id="readingJourneyDismiss">Not now</button>' +
    '</div>' +
    '<p class="reading-journey-privacy">Based only on the sample opened during this visit. Nothing is saved.</p>';
  document.body.appendChild(panel);
  const copy = document.getElementById('readingJourneyCopy');
  const nextButton = document.getElementById('readingJourneyNext');

  function hide() {
    panel.hidden = true;
    suggestion = null;
  }

  function bookFromReader() {
    try {
      const parsed = new URL(sampleLink.href, location.href);
      if (parsed.origin !== location.origin) return null;
      const match = /^\/samples\/(distance|god|harness|forty|memory|stardust|fight|stops)\.html$/.exec(parsed.pathname);
      return match ? match[1] : null;
    } catch (_) {
      return null;
    }
  }

  function show(bookId) {
    if (adult.hidden || !books[bookId]) return;
    const source = books[bookId];
    if (openedThisVisit.has(source.next)) return; // Never pitch a sample they already opened.
    const next = books[source.next];
    suggestion = source.next;
    copy.textContent = 'Welcome back from the sample of ' + source.title + '. ' +
      source.thought + ' May I introduce you to ' + next.title + '?';
    nextButton.textContent = 'Meet ' + next.title;
    nextButton.setAttribute('aria-label', 'Hear the Librarian introduce ' + next.title);
    panel.hidden = false;
  }

  desk.addEventListener('close', () => {
    const last = bookFromReader();
    if (!last || adult.hidden) return;
    openedThisVisit.add(last);
    hide();
    if (pitch.open) {
      pending = last; // Let the original pitch return path finish before speaking up.
    } else {
      pending = null;
      show(last);
    }
  });

  pitch.addEventListener('close', () => {
    if (!pending) return;
    const bookId = pending;
    pending = null;
    show(bookId);
  });

  nextButton.addEventListener('click', () => {
    if (!suggestion || pitch.open) return;
    const next = suggestion;
    const trigger = document.querySelector('#adultBooks [data-book="' + next + '"]') || nextButton;
    hide();
    document.dispatchEvent(new CustomEvent('librarian:open-book', {detail:{id:next,trigger:trigger}}));
  });
  document.getElementById('readingJourneyDismiss').addEventListener('click', hide);
  document.addEventListener('librarian:reader-open', hide);
  document.querySelectorAll('[data-home],[data-enter="kids"]').forEach(button => {
    button.addEventListener('click', () => {pending = null;hide();});
  });
  window.addEventListener('hashchange', () => {
    if (location.hash !== '#adult') {pending = null;hide();}
  });
})();
