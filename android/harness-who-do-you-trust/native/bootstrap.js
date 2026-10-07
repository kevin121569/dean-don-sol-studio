import { Preferences } from '@capacitor/preferences';
import { App } from '@capacitor/app';

const PREFIX = 'harness-wdyt:';
const cache = new Map();
let dirty = new Map();
let writeChain = Promise.resolve();
let flushRequested = false;
let flushTimer = null;
const FLUSH_DEBOUNCE_MS = 250;

async function hydrate() {
  const { keys } = await Preferences.keys();
  const ours = keys.filter(key => key.startsWith(PREFIX));
  await Promise.all(ours.map(async key => {
    const { value } = await Preferences.get({ key });
    if (value !== null) cache.set(key, value);
  }));
}

function installStorageBridge() {
  const backend = {
    getItem(key) { return cache.has(key) ? cache.get(key) : null; },
    setItem(key, value) {
      const v = String(value);
      cache.set(key, v);
      dirty.set(key, v);
      scheduleFlush();
    },
    removeItem(key) {
      cache.delete(key);
      dirty.set(key, null);
      scheduleFlush();
    },
  };
  Object.defineProperty(globalThis, '__HARNESS_NATIVE_STORAGE__', { value: backend, configurable: false });
}

function scheduleFlush() {
  if (flushTimer !== null) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flush();
  }, FLUSH_DEBOUNCE_MS);
}

async function flush() {
  if (flushTimer !== null) { clearTimeout(flushTimer); flushTimer = null; }
  flushRequested = true;
  writeChain = writeChain.then(async () => {
    while (flushRequested) {
      flushRequested = false;
      const pending = [...dirty.entries()];
      if (!pending.length) continue;
      for (const [key, value] of pending) {
        if (dirty.get(key) === value) dirty.delete(key);
      }
      const results = await Promise.allSettled(pending.map(([key, value]) =>
        value === null ? Preferences.remove({ key }) : Preferences.set({ key, value })
      ));
      results.forEach((result, i) => {
        if (result.status === 'rejected') {
          const [key, value] = pending[i];
          if (!dirty.has(key)) dirty.set(key, value);
        }
      });
      if (dirty.size) flushRequested = true;
    }
  });
  return writeChain;
}

function installLifecycle() {
  App.addListener('appStateChange', ({ isActive }) => {
    if (!isActive) void flush();
  });
  App.addListener('backButton', ({ canGoBack }) => {
    const openDialog = document.querySelector('dialog[open]');
    if (openDialog) { openDialog.close(); return; }
    const back = document.querySelector('[data-action="back"]:not([disabled])');
    if (back) { back.click(); return; }
    if (canGoBack) { history.back(); return; }
    // At the root screen, Android Back should behave like a normal app exit/background action.
    void flush().finally(() => App.minimizeApp());
  });
}

try {
  await hydrate();
  installStorageBridge();
  // The locked app already calls createStore(episode) with no explicit backend. Shadow only
  // localStorage at the wrapper boundary so state.js receives the hydrated synchronous cache
  // without any change to state.js/app.js or reducer semantics.
  Object.defineProperty(globalThis, 'localStorage', { value: globalThis.__HARNESS_NATIVE_STORAGE__, configurable: true });
  installLifecycle();
} catch {
  // Native persistence must never prevent play. app.js will fall back to web storage.
}

await import('../www/js/app.js');
