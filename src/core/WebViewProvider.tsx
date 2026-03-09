import React, { createContext, useRef, useEffect } from "react"
import { WebView } from "react-native-webview"
import PersistentWebView from "../components/PersistentWebView"
import { purchaseQueue } from "../purchase/purchaseQueue"
import { useWebViewController } from "../webview/useWebViewController"

export const WebViewContext = createContext<any>(null)

export function WebViewProvider({ children }: any) {

  const webviewRef = useRef<WebView>(null)

  const { handleMessage } = useWebViewController()

  useEffect(() => {
    purchaseQueue.attachWebView(webviewRef.current)
  }, [])

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