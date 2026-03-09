import { useRef, useState } from "react";
import { WebViewMessageEvent } from "react-native-webview";

export function useWebViewController() {
  const timer = useRef<NodeJS.Timeout | null>(null);
  const [showWebView, setShowWebView] = useState(false);
  const [paymentState, setPaymentState] = useState<"idle" | "processing" | "success" | "error"
>("idle")

  function handleMessage(event: WebViewMessageEvent) {
    const msg = JSON.parse(event.nativeEvent.data);
    if (msg.type === "EBANX_TOKEN") {
      setPaymentState("processing")
      console.log("EBANX TOKEN detectado");

      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        console.log("timeout pago");
        setPaymentState("error")
        setShowWebView(true)
      }, 4000);
    }

    if (msg.type === "NAV") {
      const url = msg.data;
      if (url.includes("/result")) {
        setPaymentState("success")
        console.log("Pago finalizado");
        
        if (timer.current) clearTimeout(timer.current);
        setShowWebView(false);
      }
    }
  }

  return { showWebView, handleMessage };
}