import { useRef, useState } from 'react'
import { WebViewMessageEvent } from 'react-native-webview'

export type PaymentState = 'idle' | 'filling' | 'processing' | 'success' | 'error'

export function useWebViewController() {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [showWebView,   setShowWebView]   = useState(false)
  const [paymentState,  setPaymentState]  = useState<PaymentState>('idle')
  const [fillError,     setFillError]     = useState<string | null>(null)

  function handleMessage(event: WebViewMessageEvent) {
    let msg: { type: string; data?: any }
    try { msg = JSON.parse(event.nativeEvent.data) } catch { return }

    switch (msg.type) {

      case 'CARD_FILLED':
        setPaymentState('filling')
        break

      case 'PAY_CLICK':
        setPaymentState('processing')
        break

      case 'FILL_ERROR':
        setPaymentState('error')
        setFillError(String(msg.data || 'Error desconocido'))
        break

      case 'EBANX_TOKEN':
      case 'EBANX_CALLED':
        setPaymentState('processing')
        if (timer.current) clearTimeout(timer.current)
        timer.current = setTimeout(() => {
          setPaymentState('error')
          setShowWebView(true)
        }, 4000)
        break

      case 'PAY_SUCCESS':
        setPaymentState('success')
        if (timer.current) clearTimeout(timer.current)
        setShowWebView(false)
        break

      case 'NAV': {
        const url: string = msg.data || ''
        if (url.includes('/result')) {
          setPaymentState('success')
          if (timer.current) clearTimeout(timer.current)
          setShowWebView(false)
        }
        break
      }

      default:
        break
    }
  }

  return { showWebView, paymentState, fillError, handleMessage }
}
