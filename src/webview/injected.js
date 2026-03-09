(function () {
  if (window.__PH_INSTALLED__) return;
  window.__PH_INSTALLED__ = true;

  function send(type, data) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type, data }));
  }

  // NAV: pushState, replaceState, popstate and initial
  (function históryWrap() {
    const _push = history.pushState;
    const _replace = history.replaceState;
    history.pushState = function () { _push.apply(this, arguments); send("NAV", location.href); };
    history.replaceState = function () { _replace.apply(this, arguments); send("NAV", location.href); };
    window.addEventListener("popstate", () => send("NAV", location.href));
    // initial
    send("NAV", location.href);
  })();

  // Detect XHR
  (function xhrWrap() {
    const open = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, url) {
      try {
        if (url && url.includes("ebanx.com/ws/token")) send("EBANX_TOKEN", url);
      } catch (e) {}
      return open.apply(this, arguments);
    };
  })();

  // Detect fetch
  (function fetchWrap() {
    if (!window.fetch) return;
    const _fetch = window.fetch;
    window.fetch = function (input, init) {
      try {
        const url = typeof input === "string" ? input : (input && input.url);
        if (url && url.includes("ebanx.com/ws/token")) send("EBANX_TOKEN", url);
      } catch (e) {}
      return _fetch.apply(this, arguments);
    };
  })();

})();