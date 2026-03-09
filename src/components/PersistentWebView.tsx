import React, { forwardRef } from "react"
import { StyleSheet } from "react-native"
import { WebView } from "react-native-webview"
import injected from "../webview/injected"

const PersistentWebView = forwardRef<any, any>(
({ onMessage }, ref) => {

  return (

    <WebView
      ref={ref}

      source={{
        uri: "https://pagostore.garena.com"
      }}

      injectedJavaScript={injected}

      onMessage={onMessage}

      style={styles.hidden}

      javaScriptEnabled
      domStorageEnabled

    />

  )
})

export default PersistentWebView

const styles = StyleSheet.create({

  hidden:{
    width:0,
    height:0,
    position:"absolute"
  }

})