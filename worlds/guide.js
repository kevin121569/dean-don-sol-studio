/* Character-guided Worlds hub — user initiated, no telemetry, no external services. */
(() => {
  'use strict';
  const portal = document.getElementById('portal');
  if (!portal) return;
  const theater = portal.querySelector('[data-theater]');
  const choices = [...portal.querySelectorAll('[data-guide-destination]')];
  const dialogue = portal.querySelector('[data-guide-dialogue]');
  const launch = portal.querySelector('[data-guide-launch]');
  const stageCaption = portal.querySelector('[data-stage-caption]');
  const skip = portal.querySelector('[data-guide-skip]');
  const replay = portal.querySelector('[data-guide-replay]');
  const start = document.querySelector('[data-portal-start]');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const destinations = {
    books: { href: '#books', name: 'Books', text: 'Percy keeps the chapters in order. Curley knows where the strange ideas hide. Your next stop: the books.' },
    games: { href: '#games', name: 'Games', text: 'Tooth says inspect the evidence first. Curley says the games are this way. You make the decisions.' },
    films: { href: '#films', name: 'Films', text: 'Lights, camera, inconvenient questions. Don Sol will show you the movie projects and teasers.' },
    animation: { href: '#animation', name: 'Animation', text: 'Percy opens a new pair of possibilities. Meet the animated worlds in development.' }
  };
  let selected = 'games';
  let completion = null;
  function cancelPending() {
    if (completion !== null) {
      window.clearTimeout(completion);
      completion = null;
    }
  }
  function finish() {
    cancelPending();
    theater.classList.remove('is-running');
    theater.classList.add('is-complete');
    stageCaption.textContent = 'Curley: “Yes. Look that one.”';
  }
  function choose(which, play = true) {
    if (!Object.prototype.hasOwnProperty.call(destinations, which)) return;
    selected = which;
    const next = destinations[which];
    choices.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.guideDestination === which)));
    launch.href = next.href;
    launch.textContent = 'Explore ' + next.name + ' →';
    dialogue.textContent = next.text;
    cancelPending();
    theater.classList.remove('is-running', 'is-complete');
    if (reduce.matches || !play) {
      finish();
      return;
    }
    // Restart one-shot CSS keyframes. Motion never starts before a user gesture.
    void theater.offsetWidth;
    theater.classList.add('is-running');
    stageCaption.textContent = 'One straight pen enters the wormhole…';
    completion = window.setTimeout(finish, 1680);
  }
  choices.forEach(button => {
    button.addEventListener('click', () => choose(button.dataset.guideDestination));
  });
  skip.addEventListener('click', finish);
  replay.addEventListener('click', () => choose(selected));
  if (start) {
    start.addEventListener('click', () => {
      choose(selected);
    });
  }
  // Respect a preference changed while the page is open.
  const onMotionChange = () => {
    if (reduce.matches) finish();
  };
  if (reduce.addEventListener) reduce.addEventListener('change', onMotionChange);
  else if (reduce.addListener) reduce.addListener(onMotionChange);
  // The initial still image needs no animation and the quick links work without JS.
  choices.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.guideDestination === selected)));
  launch.href = destinations[selected].href;
  launch.textContent = 'Explore ' + destinations[selected].name + ' →';
  dialogue.textContent = 'Don Sol: “Welcome to the Lab. Choose a door. Curley knows the shortcuts.”';
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && completion !== null) finish();
  });
})();
