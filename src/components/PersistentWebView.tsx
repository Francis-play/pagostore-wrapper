import React, { forwardRef, useImperativeHandle, useRef } from 'react'
import { StyleSheet } from 'react-native'
import { WebView } from 'react-native-webview'
import injected from '../webview/injected'

type Props = {
  onMessage?: (event: any) => void
}

const PersistentWebView = forwardRef<any, Props>(({ onMessage }, ref) => {

  const wref = useRef<any>(null)

  // Expone injectJavaScript y getRef al padre de forma segura
  useImperativeHandle(ref, () => ({
    injectJavaScript: (js: string) => {
      try {
        if (wref.current?.injectJavaScript) {
          wref.current.injectJavaScript(js)
        }
      } catch {}
    },
    getRef: () => wref.current,
  }))

  return (
    <WebView
      ref={wref}
      source={{ uri: 'https://pagostore.garena.com' }}
      style={styles.hidden}
      injectedJavaScript={injected}
      onMessage={onMessage}
      javaScriptEnabled
      domStorageEnabled
      sharedCookiesEnabled
      thirdPartyCookiesEnabled
      originWhitelist={['*']}
    />
  )

})

export default PersistentWebView

const styles = StyleSheet.create({
  hidden: {
    width: 0,
    height: 0,
    position: 'absolute',
  },
})
