/* Route the Android system Back gesture to the current five-case selector, never the QA splash. */
(() => {
  "use strict";
  if (!/(?:^|\/)(?:case|play)\.html$/.test(location.pathname)) return;
  let leaving = false;
  const toCaseMenu = () => {
    if (leaving) return;
    leaving = true;
    location.replace("./index.html");
  };

  // A browser/WebView history fallback for devices where the native listener is unavailable.
  history.pushState({harnessCaseBackGuard: true}, "", location.href);
  window.addEventListener("popstate", toCaseMenu);

  // The App plugin is installed in the isolated QA Android wrapper.
  const bridge = window.Capacitor;
  const nativeApp = bridge?.Plugins?.App ?? bridge?.registerPlugin?.("App");
  try {
    const handle = nativeApp?.addListener?.("backButton", toCaseMenu);
    if (handle?.catch) void handle.catch(() => {});
  } catch { /* guarded web-history fallback remains active */ }
})();
