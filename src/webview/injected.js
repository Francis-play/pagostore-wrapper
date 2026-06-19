/* eslint-disable no-undef */
(function () {
  if (window.__PH_INSTALLED__) return;
  window.__PH_INSTALLED__ = true;

  function send(type, data) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type, data }));
  }

  // NAV: pushState, replaceState, popstate and initial
  (function historyWrap() {
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
        if (url && url.includes("customer.ebanx.com/ws/token")) send("EBANX_TOKEN", url);
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
        if (url && url.includes("customer.ebanx.com/ws/token")) send("EBANX_TOKEN", url);
      } catch (e) {}
      return _fetch.apply(this, arguments);
    };
  })();

  // Command handler: DO_LOGIN, FETCH_USER_INFO
  window.__ph_handleCommand = function (cmdStr) {
    try {
      var cmd = JSON.parse(cmdStr);

      if (cmd.type === "DO_LOGIN") {
        var input = Array.from(document.querySelectorAll("input"))
          .find(function (i) {
            return (i.placeholder || "").toLowerCase().includes("id del jugador") ||
                   (i.placeholder || "").toLowerCase().includes("player id");
          });
        if (input) {
          input.value = cmd.playerId || "";
          input.dispatchEvent(new Event("input", { bubbles: true }));
          var btn = Array.from(document.querySelectorAll("button"))
            .find(function (b) { return (b.innerText || "").match(/Entrar|Login|Ingresar|Acceder|Continuar/i); });
          if (btn) {
            btn.click();
            send("LOGIN_CLICKED");
          } else {
            send("LOGIN_BTN_NOT_FOUND");
          }
        } else {
          send("LOGIN_INPUT_NOT_FOUND");
        }
      }

      if (cmd.type === "FETCH_USER_INFO") {
        fetch("/api/auth/get_user_info/multi")
          .then(function (r) { return r.json(); })
          .then(function (data) { send("USER_INFO", data); })
          .catch(function (e) { send("USER_INFO_ERROR", String(e)); });
      }

      if (cmd.type === "CLEAR_SESSION") {
        try { localStorage.clear(); } catch (e) {}
        try { sessionStorage.clear(); } catch (e) {}
        try { document.cookie.split(";").forEach(function(c) {
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        }); } catch (e) {}
        send("SESSION_CLEARED");
      }

      if (cmd.type === "GO_BACK") {
        if (window.history.length >= 1) {
          window.history.back();
        } else {
          send("GO_BACK_FAILED");
        }
      }

      if (cmd.type === "EXTRACT_COOKIES") {
        send("COOKIES", document.cookie);
      }

      if (cmd.type === "INJECTOR") {
        try { eval(cmd.script); } catch (e) {}
      }

    } catch (e) {
      send("CMD_ERROR", String(e));
    }
  };

})();
