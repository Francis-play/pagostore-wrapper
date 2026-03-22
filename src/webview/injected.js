/* eslint-disable */
// Este archivo exporta el script como STRING para inyectarlo en el WebView.
// NO debe ejecutarse como módulo JS — por eso usamos window["his"+"tory"]
// y window["loc"+"ation"] para que Hermes no resuelva esas referencias
// al evaluar el bundle de React Native.

const script = [
  '(function(){',
  'var w=window;',
  'if(w.__PH_INSTALLED__)return;',
  'w.__PH_INSTALLED__=true;',
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
  '})();true;',
].join('');

export default script;
