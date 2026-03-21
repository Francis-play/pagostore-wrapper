import React, { createContext, useRef } from "react"
import { WebView } from "react-native-webview"
import PersistentWebView from "../components/PersistentWebView"
import { useWebViewController } from "../webview/useWebViewController"

export const WebViewContext = createContext<any>(null)

// WebViewProvider: usado por CheckoutScreen para el flujo de pago manual
// (muestra/oculta el WebView según EBANX_TOKEN y NAV /result)
export function WebViewProvider({ children }: any) {

  const webviewRef = useRef<WebView>(null)
  const { handleMessage } = useWebViewController()

  return (
    <WebViewContext.Provider value={{ webviewRef }}>

      {children}

      <PersistentWebView
        ref={webviewRef}
        onMessage={handleMessage}
      />

    </WebViewContext.Provider>
  )
}
