import React, { createContext, useCallback, useContext, useRef, useState } from 'react'
import { StyleSheet } from 'react-native'
import { WebView, WebViewMessageEvent } from 'react-native-webview'
import injected from '../webview/injected'

type MessageHandler = (msg: { type: string; data?: any }) => void

type WebViewContextType = {
  mountWebView:   () => void
  unmountWebView: () => void
  mounted:        boolean
  sendCommand:    (cmd: object) => void
  navigateTo:     (url: string) => void
  visible:        boolean
  setVisible:     (v: boolean) => void
  setMessageHandler: (handler: MessageHandler | null) => void
}

const WebViewContext = createContext<WebViewContextType | null>(null)

export function useWebView(): WebViewContextType {
  const ctx = useContext(WebViewContext)
  if (!ctx) throw new Error('useWebView must be used within WebViewProvider')
  return ctx
}

export function WebViewProvider({ children }: { children: React.ReactNode }) {
  const wref = useRef<any>(null)
  const [mounted, setMounted]   = useState(false)
  const [visible, setVisible]   = useState(false)
  const handlerRef = useRef<MessageHandler | null>(null)
  const mountCount  = useRef(0)

  const injectJS = useCallback((js: string) => {
    try { wref.current?.injectJavaScript(js) } catch {}
  }, [])

  const sendCommand = useCallback((cmd: object) => {
    injectJS(`window.__ph_handleCommand(${JSON.stringify(JSON.stringify(cmd))}); true;`)
  }, [injectJS])

  const navigateTo = useCallback((url: string) => {
    injectJS(`window.location.href = ${JSON.stringify(url)}; true;`)
  }, [injectJS])

  const mountWebView = useCallback(() => {
    mountCount.current++
    setMounted(true)
  }, [])

  const unmountWebView = useCallback(() => {
    mountCount.current = Math.max(0, mountCount.current - 1)
    if (mountCount.current === 0) {
      setMounted(false)
      setVisible(false)
    }
  }, [])

  const setMessageHandler = useCallback((handler: MessageHandler | null) => {
    handlerRef.current = handler
  }, [])

  const onMessage = useCallback((e: WebViewMessageEvent) => {
    let msg: { type: string; data?: any }
    try { msg = JSON.parse(e.nativeEvent.data) } catch { return }
    handlerRef.current?.(msg)
  }, [])

  return (
    <WebViewContext.Provider value={{
      mounted, mountWebView, unmountWebView,
      sendCommand, navigateTo,
      visible, setVisible,
      setMessageHandler,
    }}>
      {children}
      {mounted && (
        <WebView
          ref={(r) => { wref.current = r }}
          source={{ uri: 'https://pagostore.garena.com' }}
          style={[styles.hidden, !visible && styles.hidden]}
          injectedJavaScript={injected}
          onMessage={onMessage}
          javaScriptEnabled
          domStorageEnabled
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          originWhitelist={['*']}
        />
      )}
    </WebViewContext.Provider>
  )
}

const styles = StyleSheet.create({
  hidden: {
    width: 0,
    height: 0,
    position: 'absolute',
  },
})
