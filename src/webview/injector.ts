export type CardData = {
  name: string
  number: string
  expiry: string
  email: string
  cvc?: string
  promo?: string
}

export function buildInjector(card: CardData): string {
  const payload = encodeURIComponent(
    JSON.stringify({
      name:   card.name,
      number: card.number.replace(/\s+/g, ''),
      expiry: card.expiry,
      email:  card.email,
      cvc:    card.cvc ?? '',
      promo:  card.promo ?? '',
    })
  )

  return `
(function () {
  if (window.__PH_INSTALLED__) return;
  window.__PH_INSTALLED__ = true;

  const phCard = JSON.parse(decodeURIComponent("${payload}"));
  let paymentStarted = false;
  let resultDetected = false;

  function send(type, data) {
    try {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({ type: type, data: data ?? null })
      );
    } catch (e) {}
  }

  function currentUrl() {
    try { return location.href; } catch (e) { return ''; }
  }

  /* NAVIGATION HOOKS */
  (function historyHook() {
    const push    = history.pushState;
    const replace = history.replaceState;
    history.pushState = function () { push.apply(this, arguments); send('NAV', currentUrl()); };
    history.replaceState = function () { replace.apply(this, arguments); send('NAV', currentUrl()); };
    window.addEventListener('popstate', function () { send('NAV', currentUrl()); });
    send('NAV', currentUrl());
  })();

  /* XHR HOOK */
  (function xhrHook() {
    const open = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, url) {
      try { if (url && url.includes('ebanx.com/ws/token')) send('EBANX_TOKEN', url); } catch (e) {}
      return open.apply(this, arguments);
    };
  })();

  /* FETCH HOOK */
  (function fetchHook() {
    if (!window.fetch) return;
    const orig = window.fetch;
    window.fetch = function (input, init) {
      try {
        const url = typeof input === 'string' ? input : (input && input.url);
        if (url && url.includes('ebanx.com/ws/token')) send('EBANX_TOKEN', url);
      } catch (e) {}
      return orig.apply(this, arguments);
    };
  })();

  /* RESULT DETECTION — sends PAY_SUCCESS + READY_FOR_NEXT */
  new MutationObserver(function () {
    if (location.pathname.includes('/result') && !resultDetected) {
      resultDetected = true;
      send('PAY_SUCCESS', currentUrl());
      send('READY_FOR_NEXT', null);
      // Reset flags after short delay so next purchase can reuse session
      setTimeout(function () {
        paymentStarted  = false;
        resultDetected  = false;
        window.__PH_INSTALLED__ = false;
      }, 500);
    }
  }).observe(document.documentElement, { childList: true, subtree: true });

  /* AUTOFILL */
  function setInputValue(el, value) {
    if (!el) return;
    try {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(el, value);
      el.dispatchEvent(new Event('input',  { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    } catch (e) {}
  }

  function waitFor(selector) {
    return new Promise(function (resolve) {
      var i = setInterval(function () {
        var el = document.querySelector(selector);
        if (el) { clearInterval(i); resolve(el); }
      }, 200);
    });
  }

  async function autofill() {
    try {
      if (!location.href.includes('/buy')) return;
      if (paymentStarted) return;

      await waitFor('input[name="cardName"], input[name="cardholder"], input[name="card_number"]');

      var nameEl   = document.querySelector('input[name="cardName"]')    || document.querySelector('input[name="cardholder"]');
      var numberEl = document.querySelector('input[name="cardNumber"]')  || document.querySelector('input[name="card_number"]') || document.querySelector('input[id*="card"]');
      var expiryEl = document.querySelector('input[name="cardDueDate"]') || document.querySelector('input[name="expiry"]')      || document.querySelector('input[name="exp"]');
      var cvcEl    = document.querySelector('input[name="cardCVV"]')     || document.querySelector('input[name="cvv"]')         || document.querySelector('input[name="cvc"]');
      var emailEl  = document.querySelector('input[name="email"]')       || document.querySelector('input[type="email"]');
      var promoEl  = phCard.promo ? document.querySelector('input[name="promoCode"]') : null;

      if (nameEl)   setInputValue(nameEl,   phCard.name);
      if (numberEl) setInputValue(numberEl, phCard.number);
      if (expiryEl) setInputValue(expiryEl, phCard.expiry);
      if (cvcEl)    setInputValue(cvcEl,    phCard.cvc);
      if (emailEl)  setInputValue(emailEl,  phCard.email);
      if (promoEl)  setInputValue(promoEl,  phCard.promo);

      send('CARD_FILLED', null);

      setTimeout(function () {
        var btn = Array.from(document.querySelectorAll('button'))
          .find(function (b) { return (b.innerText || '').includes('Proceder'); });
        if (btn) { btn.click(); paymentStarted = true; send('PAY_CLICK', null); }
      }, 1200);

    } catch (e) {
      send('FILL_ERROR', String(e));
    }
  }

  new MutationObserver(function () {
    if (location.href.includes('/buy') && !paymentStarted) autofill();
  }).observe(document.documentElement, { childList: true, subtree: true });

  setTimeout(autofill, 800);
  setTimeout(autofill, 2000);
  setTimeout(autofill, 3500);

})();
true;
`
}
