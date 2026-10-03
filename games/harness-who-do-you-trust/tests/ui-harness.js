// Deterministic DOM-interface harness for the actual app functions. This is
// deliberately not a native browser, layout, keyboard, or accessibility test.
import fs from 'node:fs';
import {validateEpisode} from '../js/content.js';
import {isAdvisor} from '../js/advice.js';
import {reduce, ACTIONS as A, isHybridUnlocked, isDecisionAvailable, selectAdvice, buildPostmortem} from '../js/engine.js';
import {createInitialState, createStore} from '../js/state.js';
import {createTelemetry, domEventSink} from '../js/telemetry.js';

const source = fs.readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
const body = source.replace(/^import .*;\n/gm, '').replace('\nboot();', '\n');

export function memoryStorage() {
  const data = new Map();
  return {getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key), data};
}

export function makeUI(episode, options = {}) {
  const elements = new Map(), listeners = new Map(), timers = new Map(), callbacks = [];
  const document = {
    activeElement: null,
    querySelector: selector => elements.get(selector) ?? null,
    getElementById: id => elements.get('#' + id) ?? null,
    addEventListener: (type, fn) => listeners.set(type, fn),
    documentElement: {
      attrs: new Map(),
      hasAttribute(key) { return this.attrs.has(key); },
      setAttribute(key, value) { this.attrs.set(key, value); },
      removeAttribute(key) { this.attrs.delete(key); },
    },
  };
  for (const id of ['scene', 'scene-title', 'motionToggle', 'live', 'helpDialog', 'resetDialog']) {
    elements.set('#' + id, {
      id, innerHTML: '', textContent: '', attributes: {},
      focus() { document.activeElement = this; },
      setAttribute(key, value) { this.attributes[key] = value; },
      showModal() { this.open = true; },
    });
  }
  const storage = options.storage ?? memoryStorage();
  const window = {
    handlers: [],
    scrollTo(args) { this.lastScroll = args; },
    dispatchEvent(event) { for (const fn of this.handlers) fn(event); return true; },
  };
  const dependencies = {
    document, window, localStorage: storage,
    matchMedia: () => ({matches: options.osReduced === true}),
    setTimeout(fn) { callbacks.push(fn); const id = callbacks.length; timers.set(id, fn); return id; },
    clearTimeout: id => timers.delete(id),
    async loadEpisode() {
      if (options.validate !== false) {
        const problems = validateEpisode(episode);
        if (problems.length) throw new Error(problems.join('\n'));
      }
      return structuredClone(episode);
    },
    reduce, A, isAdvisor, isHybridUnlocked, isDecisionAvailable, selectAdvice, buildPostmortem,
    createInitialState,
    createStore: ep => options.defaultStorage ? createStore(ep) : createStore(ep, storage),
    createTelemetry, domEventSink,
  };
  const create = new Function(...Object.keys(dependencies), body + '\nreturn {boot,dispatch,onClick,onChange,resetGame,render,getState:()=>state,events:()=>telemetry.events()};');
  const app = create(...Object.values(dependencies));
  return {
    app, document, window, elements, timers, callbacks, storage,
    click(action, id) { app.onClick({target: {closest: () => ({dataset: {action, id}})}}); },
    flush() {
      while (timers.size) {
        const [id, fn] = timers.entries().next().value;
        timers.delete(id); fn();
      }
    },
    html: () => elements.get('#scene').innerHTML,
    live: () => elements.get('#live').textContent,
  };
}

// Quote-aware tokenization for asserting attribute boundaries in rendered HTML.
// Entities remain inside their original quoted attribute; this does not execute HTML.
export function openingTags(html) {
  return [...html.matchAll(/<([a-z][\w:-]*)\b((?:"[^"]*"|'[^']*'|[^'">])*)>/gi)].map(([, name, text]) => ({
    name: name.toLowerCase(),
    attributes: [...text.matchAll(/([^\s=\/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'<>=`]+)))?/g)]
      .map(([, key, double, single, unquoted]) => [key.toLowerCase(), double ?? single ?? unquoted ?? '']),
  }));
}
