// src/components/PaymentWebView.tsx
import React, {useRef, useCallback, useEffect} from 'react';
import {View, ActivityIndicator, StyleSheet} from 'react-native';
import {
  WebView,
  WebViewMessageEvent,
  WebViewNavigation,
} from 'react-native-webview';

type Props = {
  visible: boolean; // control de visibilidad (mostrado solo en /buy)
  targetUrl: string | null; // URL construida /buy?... , si null no navega
  onEbanxCalled: () => void;
  onPaymentSuccess: () => void;
  onPossibleFailure: (reason?: string) => void;
  injectCard?: {
    // si queremos autofill desde RN
    name: string;
    number: string; // sin espacios
    expiry: string; // MM/AAAA
    cvc?: string; // no guardamos cvc; se puede pasar en tiempo real
    email: string;
    promo?: string | null;
  } | null;
};

const injectedBefore = `
(function() {
  // Hook XMLHttpRequest
  (function(open) {
    XMLHttpRequest.prototype.open = function(method, url) {
      try {
        if (typeof url === 'string' && url.includes('customer.ebanx.com/ws/token')) {
          window.ReactNativeWebView.postMessage(JSON.stringify({type:'EBANX_CALLED', url}));
        }
      } catch(e){}
      return open.apply(this, arguments);
    };
  })(XMLHttpRequest.prototype.open);

  // Hook fetch
  const originalFetch = window.fetch;
  window.fetch = function() {
    try {
      const url = arguments[0];
      if (typeof url === 'string' && url.includes('customer.ebanx.com/ws/token')) {
        window.ReactNativeWebView.postMessage(JSON.stringify({type:'EBANX_CALLED', url}));
      }
    } catch(e){}
    return originalFetch.apply(this, arguments);
  };

  // helper to find inputs by name safely
  window.__ph_find = function(name) {
    try {
      return document.querySelector('input[name="'+name+'"]') || null;
    } catch(e){ return null; }
  };

  // listen for RN commands
  window.__ph_handleCommand = function(cmdStr) {
    try {
      const cmd = JSON.parse(cmdStr);
      if (cmd.type === 'FILL_CARD') {
        const data = cmd.data;
        const setVal = (name, val) => {
          const el = window.__ph_find(name);
          if (el) {
            el.focus();
            el.value = val;
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.blur();
            return true;
          }
          return false;
        };
        setVal('cardName', data.name || '');
        setVal('cardNumber', data.number || '');
        setVal('cardDueDate', data.expiry || '');
        setVal('cardCVV', data.cvc || '');
        setVal('email', data.email || '');
        if (data.promo) setVal('promoCode', data.promo);
        // notify RN that fill finished
        window.ReactNativeWebView.postMessage(JSON.stringify({type:'FILL_DONE'}));
      }

      if (cmd.type === 'CLICK_PAY') {
        // find button by text
        const btn = [...document.querySelectorAll('button')].find(b => (b.innerText||'').includes('Proceder'));
        if (btn) { btn.click(); window.ReactNativeWebView.postMessage(JSON.stringify({type:'CLICKED_PAY'})); }
        else window.ReactNativeWebView.postMessage(JSON.stringify({type:'CLICK_PAY_NOT_FOUND'}));
      }

      if (cmd.type === 'DO_LOGIN') {
        // try to find player id input by placeholder
        const input = [...document.querySelectorAll('input')].find(i => (i.placeholder||'').includes('ID del jugador'));
        if (input) {
          input.value = cmd.playerId || '';
          input.dispatchEvent(new Event('input',{bubbles:true}));
          // try find login button with text 'Entrar' or similar
          const loginBtn = [...document.querySelectorAll('button')].find(b => (b.innerText||'').match(/Entrar|Iniciar sesión|Login|Ingresar|Acceder/i));
          if (loginBtn) { loginBtn.click(); window.ReactNativeWebView.postMessage(JSON.stringify({type:'LOGIN_CLICKED'})); }
          else window.ReactNativeWebView.postMessage(JSON.stringify({type:'LOGIN_BTN_NOT_FOUND'}));
        } else {
          window.ReactNativeWebView.postMessage(JSON.stringify({type:'LOGIN_INPUT_NOT_FOUND'}));
        }
      }
    } catch(e) {
      window.ReactNativeWebView.postMessage(JSON.stringify({type:'CMD_ERROR', error: ''+e}));
    }
  };

})();
true; // note: keep as last expression
`;

export default function PaymentWebView(props: Props) {
  const webRef = useRef<WebView | null>(null);
  const ebanxTimer = useRef<NodeJS.Timeout | null>(null);
  const seenEbanx = useRef(false);

  // handle messages from WebView
  const onMessage = useCallback(
    (e: WebViewMessageEvent) => {
      try {
        const msg = JSON.parse(e.nativeEvent.data);
        if (msg.type === 'EBANX_CALLED') {
          seenEbanx.current = true;
          props.onEbanxCalled();
          // start 4s timer to wait /result
          if (ebanxTimer.current) {
            clearTimeout(ebanxTimer.current);
          }
          ebanxTimer.current = setTimeout(() => {
            // if still on buy page (no redirect to /result), notify possible failure
            webRef.current?.injectJavaScript(
              `window.ReactNativeWebView.postMessage(JSON.stringify({type:'CHECK_URL', url:location.href}));true;`,
            );
            props.onPossibleFailure('ebanx_timeout');
          }, 4000);
        }

        if (msg.type === 'FILL_DONE') {
          // nothing for now
        }

        if (msg.type === 'CLICKED_PAY') {
          // user attempted payment
        }

        if (msg.type === 'CMD_ERROR') {
          console.warn('WebView CMD_ERROR', msg.error);
        }

        if (msg.type === 'CHECK_URL') {
          // forwarded by injected JS checking location
          // handled in onNavigationStateChange too
        }
      } catch (err) {
        console.warn('webview onMessage parse error', err);
      }
    },
    [props],
  );

  const onNavChange = useCallback(
    (nav: WebViewNavigation) => {
      const u = nav.url || '';
      if (u.includes('/result')) {
        // success: clear timers and notify
        if (ebanxTimer.current) {
          clearTimeout(ebanxTimer.current);
          ebanxTimer.current = null;
        }
        props.onPaymentSuccess();
      }
      // show WebView only when target url is buy; parent controls visibility
    },
    [props],
  );

  // expose helpers to parent via ref if needed (skipped here)
  useEffect(() => {
    // when targetUrl changes, navigate
    if (props.targetUrl && webRef.current) {
      webRef.current.injectJavaScript(
        `window.location.href = ${JSON.stringify(props.targetUrl)}; true;`,
      );
    }
  }, [props.targetUrl]);

  // on mount, inject hooks
  return (
    <View
      style={[styles.container, {display: props.visible ? 'flex' : 'none'}]}>
      <WebView
        ref={webRef}
        source={{uri: 'https://pagostore.garena.com'}}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        injectedJavaScriptBeforeContentLoaded={injectedBefore}
        onMessage={onMessage}
        onNavigationStateChange={onNavChange}
        startInLoadingState
        renderLoading={() => <ActivityIndicator size="large" color="#ff3b3b" />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
});
