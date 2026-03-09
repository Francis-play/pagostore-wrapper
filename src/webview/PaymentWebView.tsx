import React, { useRef, useState } from "react"
import { WebView } from "react-native-webview"
import { buildInjector } from "./injector"

export default function PaymentWebView({ card, onProblem }) {
  const ref = useRef<WebView>(null)
  const [ebanxTime, setEbanxTime] = useState<number | null>(null)
  const engineRef = useRef<PaymentEngine | null>(null)

  engineRef.current = new PaymentEngine(ref.current,card)
  engineRef.current.start()

  function onMessage(e) {
    const msg = e.nativeEvent.data
    engineRef.current?.onWebMessage(msg)

    if (msg === "EBANX_TOKEN") {
      setEbanxTime(Date.now())
      setTimeout(() => {

      ref.current?.injectJavaScript(`if(!location.pathname.includes("/result")){
      window.ReactNativeWebView.postMessage("PAYMENT_PROBLEM")
    }`)
      }, 4000)
    }

    if (msg === "PAY_SUCCESS") {
      console.log("pago exitoso")
    }

    if (msg === "PAYMENT_PROBLEM") {
      console.log("posible problema de pago")
      onProblem()
    }
  }

  return (
    <WebView
      ref={ref}
      source={{ uri: "https://pagostore.garena.com" }}
      injectedJavaScriptBeforeContentLoaded={buildInjector(card)}
      onMessage={onMessage}
    />
  )
}