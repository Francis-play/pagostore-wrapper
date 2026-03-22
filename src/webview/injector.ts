export type CardData = {
  name: string
  number: string
  expiry: string
  email: string
  cvc?: string
  promo?: string
}

/**
 * El script se almacena como fragmentos de string en un array.
 * De esta forma Metro/Hermes nunca ve "history", "location" o "window"
 * como identificadores vivos al evaluar este módulo — solo existen
 * dentro del payload string que se envía al WebView en runtime.
 */
const SCRIPT_PARTS: string[] = [
  '(function(){',
  'var w=window;',
  'if(w.__PH_INSTALLED__)return;',
  'w.__PH_INSTALLED__=true;',
  'var phCard=JSON.parse(decodeURIComponent("__PAYLOAD__"));',
  'var paymentStarted=false,resultDetected=false;',
  'function send(t,d){try{w.ReactNativeWebView.postMessage(JSON.stringify({type:t,data:d!=null?d:null}));}catch(e){}}',
  'function currentUrl(){try{return w["loc"+"ation"].href;}catch(e){return "";}}',
  '(function historyWrap(){',
  'var hist=w["his"+"tory"];',
  'var _p=hist.pushState,_r=hist.replaceState;',
  'hist.pushState=function(){_p.apply(hist,arguments);send("NAV",currentUrl());};',
  'hist.replaceState=function(){_r.apply(hist,arguments);send("NAV",currentUrl());};',
  'w.addEventListener("popstate",function(){send("NAV",currentUrl());});',
  'send("NAV",currentUrl());',
  '})();',
  '(function xhrWrap(){',
  'var open=XMLHttpRequest.prototype.open;',
  'XMLHttpRequest.prototype.open=function(m,url){try{if(url&&url.includes("ebanx.com/ws/token"))send("EBANX_TOKEN",url);}catch(e){}return open.apply(this,arguments);};',
  '})();',
  '(function fetchWrap(){',
  'if(!w.fetch)return;',
  'var orig=w.fetch;',
  'w.fetch=function(input,init){try{var url=typeof input==="string"?input:(input&&input.url);if(url&&url.includes("ebanx.com/ws/token"))send("EBANX_TOKEN",url);}catch(e){}return orig.apply(w,arguments);};',
  '})();',
  'new MutationObserver(function(){',
  'if(w["loc"+"ation"].pathname.includes("/result")&&!resultDetected){',
  'resultDetected=true;send("PAY_SUCCESS",currentUrl());send("READY_FOR_NEXT",null);',
  'setTimeout(function(){paymentStarted=false;resultDetected=false;w.__PH_INSTALLED__=false;},500);}',
  '}).observe(document.documentElement,{childList:true,subtree:true});',
  'function setVal(el,v){if(!el)return;try{var s=Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype,"value").set;s.call(el,v);el.dispatchEvent(new Event("input",{bubbles:true}));el.dispatchEvent(new Event("change",{bubbles:true}));}catch(e){}}',
  'function waitFor(sel){return new Promise(function(resolve){var i=setInterval(function(){var el=document.querySelector(sel);if(el){clearInterval(i);resolve(el);}},200);});}',
  'async function autofill(){',
  'try{var href=currentUrl();if(!href.includes("/buy"))return;if(paymentStarted)return;',
  'await waitFor("input[name=\\"cardName\\"],input[name=\\"cardholder\\"],input[name=\\"card_number\\"]");',
  'var nEl=document.querySelector("input[name=\\"cardName\\"]")||document.querySelector("input[name=\\"cardholder\\"]");',
  'var numEl=document.querySelector("input[name=\\"cardNumber\\"]")||document.querySelector("input[name=\\"card_number\\"]")||document.querySelector("input[id*=\\"card\\"]");',
  'var expEl=document.querySelector("input[name=\\"cardDueDate\\"]")||document.querySelector("input[name=\\"expiry\\"]")||document.querySelector("input[name=\\"exp\\"]");',
  'var cvcEl=document.querySelector("input[name=\\"cardCVV\\"]")||document.querySelector("input[name=\\"cvv\\"]")||document.querySelector("input[name=\\"cvc\\"]");',
  'var emEl=document.querySelector("input[name=\\"email\\"]")||document.querySelector("input[type=\\"email\\"]");',
  'var proEl=phCard.promo?document.querySelector("input[name=\\"promoCode\\"]"):null;',
  'if(nEl)setVal(nEl,phCard.name);if(numEl)setVal(numEl,phCard.number);if(expEl)setVal(expEl,phCard.expiry);if(cvcEl)setVal(cvcEl,phCard.cvc);if(emEl)setVal(emEl,phCard.email);if(proEl)setVal(proEl,phCard.promo);',
  'send("CARD_FILLED",null);',
  'setTimeout(function(){var btn=Array.from(document.querySelectorAll("button")).find(function(b){return(b.innerText||"").includes("Proceder");});if(btn){btn.click();paymentStarted=true;send("PAY_CLICK",null);}},1200);',
  '}catch(e){send("FILL_ERROR",String(e));}}',
  'new MutationObserver(function(){if(currentUrl().includes("/buy")&&!paymentStarted)autofill();}).observe(document.documentElement,{childList:true,subtree:true});',
  'setTimeout(autofill,800);setTimeout(autofill,2000);setTimeout(autofill,3500);',
  '})();true;',
]

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

  return SCRIPT_PARTS.join('').replace('__PAYLOAD__', payload)
}
