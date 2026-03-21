import React, { useRef, useCallback, useEffect } from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { WebView, WebViewMessageEvent, WebViewNavigation } from 'react-native-webview'
import { buildInjector, CardData } from '../webview/injector'

export type PaymentWebViewProps = {
  visible: boolean
  targetUrl: string | null
  playerId?: string | null
  card: CardData
  onEbanxCalled: () => void
  onPaymentSuccess: () => void
  onPossibleFailure: (reason?: string) => void
  onReadyForNext?: () => void
  onUserInfo?: (data: any) => void
}

/**
 * JS injected before content loads.
 * Hooks XHR + fetch for EBANX detection.
 * Exposes window.__ph_handleCommand for RN → WebView commands:
 *   DO_LOGIN(playerId) — injects player ID and clicks login button
 *   FETCH_USER_INFO    — fetches /api/auth/get_user_info/multi from inside WebView
 */
const PRE_INJECT = `
(function() {
  if (window.__PH_CMD__) return;
  window.__PH_CMD__ = true;

  (function xhrHook(open) {
    XMLHttpRequest.prototype.open = function(method, url) {
      try {
        if (typeof url === 'string' && url.includes('customer.ebanx.com/ws/token'))
          window.ReactNativeWebView.postMessage(JSON.stringify({type:'EBANX_CALLED'}));
      } catch(e){}
      return open.apply(this, arguments);
    };
  })(XMLHttpRequest.prototype.open);

  (function fetchHook() {
    if (!window.fetch) return;
    const orig = window.fetch;
    window.fetch = function() {
      try {
        const url = typeof arguments[0] === 'string' ? arguments[0] : (arguments[0] && arguments[0].url);
        if (url && url.includes('customer.ebanx.com/ws/token'))
          window.ReactNativeWebView.postMessage(JSON.stringify({type:'EBANX_CALLED'}));
      } catch(e){}
      return orig.apply(this, arguments);
    };
  })();

  window.__ph_handleCommand = function(cmdStr) {
    try {
      const cmd = JSON.parse(cmdStr);

      if (cmd.type === 'DO_LOGIN') {
        const input = Array.from(document.querySelectorAll('input'))
          .find(i => (i.placeholder||'').toLowerCase().includes('id del jugador') ||
                     (i.placeholder||'').toLowerCase().includes('player id'));
        if (input) {
          input.value = cmd.playerId || '';
          input.dispatchEvent(new Event('input',{bubbles:true}));
          const btn = Array.from(document.querySelectorAll('button'))
            .find(b => (b.innerText||'').match(/Entrar|Login|Ingresar|Acceder|Continuar/i));
          if (btn) { btn.click(); window.ReactNativeWebView.postMessage(JSON.stringify({type:'LOGIN_CLICKED'})); }
          else window.ReactNativeWebView.postMessage(JSON.stringify({type:'LOGIN_BTN_NOT_FOUND'}));
        } else {
          window.ReactNativeWebView.postMessage(JSON.stringify({type:'LOGIN_INPUT_NOT_FOUND'}));
        }
      }

      if (cmd.type === 'FETCH_USER_INFO') {
        fetch('/api/auth/get_user_info/multi')
          .then(r => r.json())
          .then(data => window.ReactNativeWebView.postMessage(JSON.stringify({type:'USER_INFO', data})))
          .catch(e  => window.ReactNativeWebView.postMessage(JSON.stringify({type:'USER_INFO_ERROR', error: String(e)})));
      }

    } catch(e) {
      window.ReactNativeWebView.postMessage(JSON.stringify({type:'CMD_ERROR', error:''+e}));
    }
  };

})();
true;
`

export default function PaymentWebView({
  visible,
  targetUrl,
  playerId,
  card,
  onEbanxCalled,
  onPaymentSuccess,
  onPossibleFailure,
  onReadyForNext,
  onUserInfo,
}: PaymentWebViewProps) {

  const webRef     = useRef<WebView | null>(null)
  const ebanxTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const loginDone  = useRef(false)

  const inject = useCallback((js: string) => {
    webRef.current?.injectJavaScript(js + '; true;')
  }, [])

  const sendCommand = useCallback((cmd: object) => {
    inject(`window.__ph_handleCommand(${JSON.stringify(JSON.stringify(cmd))})`)
  }, [inject])

  // When targetUrl changes → navigate and reset login flag
  useEffect(() => {
    if (targetUrl && webRef.current) {
      loginDone.current = false
      inject(`window.location.href = ${JSON.stringify(targetUrl)}`)
    }
  }, [targetUrl, inject])

  const onLoad = useCallback(() => {
    if (playerId && !loginDone.current) {
      setTimeout(() => sendCommand({ type: 'DO_LOGIN', playerId }), 600)
    }
  }, [playerId, sendCommand])

  const onMessage = useCallback((e: WebViewMessageEvent) => {
    let msg: { type: string; data?: any }
    try { msg = JSON.parse(e.nativeEvent.data) } catch { return }

    switch (msg.type) {
      case 'LOGIN_CLICKED':
        loginDone.current = true
        // After login, fetch user info from inside the WebView
        setTimeout(() => sendCommand({ type: 'FETCH_USER_INFO' }), 1200)
        break

      case 'LOGIN_INPUT_NOT_FOUND':
      case 'LOGIN_BTN_NOT_FOUND':
        loginDone.current = true  // already logged in, carry on
        break

      case 'USER_INFO':
        onUserInfo?.(msg.data)
        break

      case 'EBANX_CALLED':
        onEbanxCalled()
        if (ebanxTimer.current) clearTimeout(ebanxTimer.current)
        ebanxTimer.current = setTimeout(() => {
          inject(`window.ReactNativeWebView.postMessage(JSON.stringify({type:'CHECK_URL',url:location.href}))`)
          onPossibleFailure('ebanx_timeout')
        }, 4000)
        break

      case 'PAY_SUCCESS':
        if (ebanxTimer.current) { clearTimeout(ebanxTimer.current); ebanxTimer.current = null }
        break

      case 'READY_FOR_NEXT':
        onReadyForNext?.()
        break

      case 'CMD_ERROR':
        console.warn('[PaymentWebView] CMD_ERROR', msg.data)
        break
    }
  }, [inject, sendCommand, onEbanxCalled, onPossibleFailure, onReadyForNext, onUserInfo])

  const onNavChange = useCallback((nav: WebViewNavigation) => {
    if ((nav.url || '').includes('/result')) {
      if (ebanxTimer.current) { clearTimeout(ebanxTimer.current); ebanxTimer.current = null }
      onPaymentSuccess()
    }
  }, [onPaymentSuccess])

  return (
    <View style={[styles.container, !visible && styles.hidden]}>
      <WebView
        ref={ref => (webRef.current = ref)}
        source={{ uri: 'https://pagostore.garena.com' }}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        injectedJavaScriptBeforeContentLoaded={PRE_INJECT + buildInjector(card)}
        onMessage={onMessage}
        onNavigationStateChange={onNavChange}
        onLoad={onLoad}
        startInLoadingState
        renderLoading={() => <ActivityIndicator size="large" color="#e53e3e" />}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hidden:    { position: 'absolute', width: 0, height: 0, opacity: 0 },
})
