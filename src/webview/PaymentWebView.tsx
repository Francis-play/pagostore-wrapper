import React, { useRef, useState, useEffect } from "react"
import { WebView } from "react-native-webview"
import { buildInjector, CardData } from "./injector"
import PaymentEngine from "../core/PaymentEngine"

type Props = {
  card: CardData
  onProblem: () => void
}

export default function PaymentWebView({ card, onProblem }: Props) {

  const ref = useRef<WebView>(null)
  const [_ebanxTime, setEbanxTime] = useState<number | null>(null)
  const engineRef = useRef<PaymentEngine | null>(null)

  // Inicializar el engine cuando el WebView esté listo
  useEffect(() => {
    if (ref.current) {
      engineRef.current = new PaymentEngine(ref.current, card)
      engineRef.current.start()
    }
    
    return () => {
      engineRef.current?.stop()
    }
  }, [card]) // solo al montar

  function onMessage(e: any) {
    const msg = e.nativeEvent.data

    engineRef.current?.onWebMessage(msg)

    if (msg === "EBANX_TOKEN") {
      setEbanxTime(Date.now())
      setTimeout(() => {
        ref.current?.injectJavaScript(`
          if (!location.pathname.includes("/result")) {
            window.ReactNativeWebView.postMessage("PAYMENT_PROBLEM");
          }
          true;
        `)
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
      javaScriptEnabled
      domStorageEnabled
      sharedCookiesEnabled
      thirdPartyCookiesEnabled
    />
  )
}
