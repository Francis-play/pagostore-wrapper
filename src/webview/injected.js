(function () {

    if (window.__PH_INSTALLED__) return;
    window.__PH_INSTALLED__ = true;
  
    function send(type, data) {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({ type, data })
      );
    }
  
    // Detectar cambios de URL
    const pushState = history.pushState;
    history.pushState = function () {
      pushState.apply(history, arguments);
      send("NAV", location.href);
    };
  
    window.addEventListener("popstate", () => {
      send("NAV", location.href);
    });
  
    // Detectar fetch (EBANX token)
    const originalFetch = window.fetch;
  
    window.fetch = function () {
      const url = arguments[0];
  
      if (typeof url === "string" && url.includes("ebanx.com/ws/token")) {
        send("EBANX_TOKEN", url);
      }
  
      return originalFetch.apply(this, arguments);
    };
  
    // Detectar XHR también
    const open = XMLHttpRequest.prototype.open;
  
    XMLHttpRequest.prototype.open = function (method, url) {
  
      if (url && url.includes("ebanx.com/ws/token")) {
        send("EBANX_TOKEN", url);
      }
  
      return open.apply(this, arguments);
    };
  
  })();