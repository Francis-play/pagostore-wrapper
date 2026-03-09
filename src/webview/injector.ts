export type CardData = {
  name: string;
  number: string;
  expiry: string;
  email: string;
};

export function buildInjector(card: CardData) {
  const payload = encodeURIComponent(
    JSON.stringify({
      name: card.name,
      number: card.number.replace(/\s+/g, ''),
      expiry: card.expiry,
      email: card.email,
    }),
  );

  return `
(function () {

  if (window.__PH_INSTALLED__) return;
  window.__PH_INSTALLED__ = true;

  const phCard = JSON.parse(decodeURIComponent("${payload}"));

  function send(type, data) {
    try {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({ type: type, data: data })
      );
    } catch (e) {}
  }

  function currentUrl() {
    try {
      return location.href;
    } catch(e) {
      return "";
    }
  }

  /* ---------------- NAVIGATION DETECTION ---------------- */

  (function historyHook() {

    const push = history.pushState;
    const replace = history.replaceState;

    history.pushState = function () {
      push.apply(this, arguments);
      send("NAV", currentUrl());
    };

    history.replaceState = function () {
      replace.apply(this, arguments);
      send("NAV", currentUrl());
    };

    window.addEventListener("popstate", function () {
      send("NAV", currentUrl());
    });

    send("NAV", currentUrl());

  })();


  /* ---------------- XHR DETECTION ---------------- */

  (function xhrHook() {

    const open = XMLHttpRequest.prototype.open;

    XMLHttpRequest.prototype.open = function(method, url) {

      try {
        if (url && url.includes("ebanx.com/ws/token")) {
          send("EBANX_TOKEN", url);
        }
      } catch(e){}

      return open.apply(this, arguments);
    };

  })();


  /* ---------------- FETCH DETECTION ---------------- */

  (function fetchHook(){

    if (!window.fetch) return;

    const originalFetch = window.fetch;

    window.fetch = function(input, init){

      try {

        const url =
          typeof input === "string"
            ? input
            : (input && input.url);

        if (url && url.includes("ebanx.com/ws/token")) {
          send("EBANX_TOKEN", url);
        }

      } catch(e){}

      return originalFetch.apply(this, arguments);

    };

  })();


  /* ---------------- AUTOFILL ---------------- */

  function setInputValue(el, value) {

    if (!el) return;

    try {

      const nativeSetter =
        Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value"
        ).set;

      nativeSetter.call(el, value);

      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));

    } catch(e) {}

  }


  function tryAutofill() {

    try {

      if (!location.href.includes("/buy")) return;

      const number =
        document.querySelector('input[name="card_number"]') ||
        document.querySelector('input[id*="card"]');

      const name =
        document.querySelector('input[name="cardholder"]') ||
        document.querySelector('input[name="name"]');

      const expiry =
        document.querySelector('input[name="expiry"]') ||
        document.querySelector('input[name="exp"]');

      const email =
        document.querySelector('input[type="email"]');

      if (number) setInputValue(number, phCard.number);
      if (name) setInputValue(name, phCard.name);
      if (expiry) setInputValue(expiry, phCard.expiry);
      if (email) setInputValue(email, phCard.email);

    } catch(e){}

  }


  /* ---------------- AUTOFILL OBSERVER ---------------- */

  const observer = new MutationObserver(function(){

    tryAutofill();

  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });


  setTimeout(tryAutofill, 1000);
  setTimeout(tryAutofill, 2000);
  setTimeout(tryAutofill, 3500);

})();
true;
`;
}
