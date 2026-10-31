/* One owner for Android Back. Replace case history entries so the case menu
   cannot reopen a finished or abandoned case when the player presses Back. */
(() => {
  "use strict";
  const isCase = /(?:^|\/)(?:case|play)\.html$/.test(location.pathname);
  const isMenu = /(?:^|\/)index\.html$/.test(location.pathname);
  if (!isCase && !isMenu) return;

  const bridge = window.Capacitor;
  const nativeApp = bridge?.Plugins?.App ?? bridge?.registerPlugin?.("App");
  let leaving = false;

  if (isCase) {
    const toCaseMenu = () => {
      if (leaving) return;
      leaving = true;
      // No residual case entry should survive underneath the selector.
      location.replace("./index.html");
    };
    // Browser/WebView fallback: one guarded history entry for the open case.
    history.pushState({harnessCaseBackGuard: true}, "", location.href);
    window.addEventListener("popstate", toCaseMenu);
    try {
      const handle = nativeApp?.addListener?.("backButton", toCaseMenu);
      if (handle?.catch) void handle.catch(() => {});
    } catch { /* history fallback still works */ }

    // Explicit case links also replace the case entry, including Continue
    // to next case and the frozen Case 1/2 return-to-menu controls.
    document.addEventListener("click", event => {
      const anchor = event.target?.closest?.("a[href]");
      if (!anchor) return;
      const target = new URL(anchor.href, location.href);
      if (target.origin !== location.origin) return;
      const campaignPath = /(?:^|\/)(?:index|case|play)\.html$/;
      if (!campaignPath.test(target.pathname) || leaving) return;
      event.preventDefault();
      leaving = true;
      location.replace(target.href);
    });
  }

  if (isMenu) {
    // On Android a Back press at the top-level selector should leave HARNESS,
    // not navigate to a stale case in WebView history.
    try {
      const handle = nativeApp?.addListener?.("backButton", () => {
        if (leaving) return;
        if (typeof nativeApp.exitApp === "function") {
          leaving = true;
          const result = nativeApp.exitApp();
          if (result?.catch) void result.catch(() => { leaving = false; });
        }
      });
      if (handle?.catch) void handle.catch(() => {});
    } catch { /* on web, the browser retains its ordinary Back behavior */ }
  }
})();
