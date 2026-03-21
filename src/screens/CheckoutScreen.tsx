import React, { useRef, useEffect, useState, useCallback } from 'react'
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import PaymentWebView from '../components/PaymentWebView'
import { loadCard }   from '../security/cardStore'
import { usePaymentStore } from '../store/usePaymentStore'
import { purchaseQueue }   from '../core/purchaseQueue'
import { NavProp, RootStackParamList } from '../navigation/RootNavigator'
import { CardData }        from '../webview/injector'

type RouteParams = RootStackParamList['Checkout']

type PayState = 'idle' | 'filling' | 'processing' | 'success' | 'error'

const STATE_LABELS: Record<PayState, string> = {
  idle:       'Iniciando...',
  filling:    'Rellenando datos de tarjeta...',
  processing: 'Procesando pago...',
  success:    'Pago completado ✓',
  error:      'Error — revisa el WebView',
}

export default function CheckoutScreen() {
  const route      = useRoute()
  const navigation = useNavigation<NavProp<'Checkout'>>()
  const { cvc }    = route.params as RouteParams

  const { player, queue, pop } = usePaymentStore()

  const [card,       setCard]       = useState<CardData | null>(null)
  const [targetUrl,  setTargetUrl]  = useState<string | null>(null)
  const [payState,   setPayState]   = useState<PayState>('idle')
  const [showWV,     setShowWV]     = useState(false)
  const [progress,   setProgress]   = useState({ done: 0, total: 0 })

  const lastSuccess = useRef(false)

  // Load card from Keychain on mount
  useEffect(() => {
    loadCard().then(c => {
      if (!c) { setPayState('error'); return }
      // Merge cvc into card — cvc not stored in Keychain
      setCard({ ...c, cvc })
    }).catch(() => setPayState('error'))
  }, [cvc])

  // When card is ready, start the queue
  useEffect(() => {
    if (!card) return
    const item = pop()
    if (!item) { setPayState('error'); return }

    const total = queue.length + 1  // already popped one
    setProgress({ done: 0, total })
    setTargetUrl(item?.url)
    setPayState('idle')
  }, [card, pop, queue.length])

  const onEbanxCalled = useCallback(() => setPayState('processing'), [])

  const onPaymentSuccess = useCallback(() => {
    lastSuccess.current = true
    setPayState('success')
    setProgress(p => ({ ...p, done: p.done + 1 }))
    // READY_FOR_NEXT handler will decide whether to continue or navigate
  }, [])

  const onPossibleFailure = useCallback((reason?: string) => {
    console.warn('[Checkout] possible failure:', reason)
    setPayState('error')
    setShowWV(true)
  }, [])

  const onReadyForNext = useCallback(() => {
    // purchaseQueue decides: if more items, navigate to next URL; else finish
    const hasMore = purchaseQueue.onReadyForNext()
    if (!hasMore) {
      // All done — navigate to Result
      navigation.navigate('Result', { ok: lastSuccess.current })
    }
    // If hasMore, purchaseQueue injected new URL into WebView — stay on screen
    lastSuccess.current = false
  }, [navigation])

  const onUserInfo = useCallback((data: any) => {
    // User info resolved from inside WebView — update store if needed
    const pd = data?.player_id
    if (pd && !player) {
      // Unusual to get here without player, but handle gracefully
      console.log('[Checkout] got user info during payment', pd.nickname)
    }
  }, [player])

  // NAV /result from WebView navigation state change → handled by PaymentWebView internally
  // Extra handler: if payState still idle after 2s, show WebView for manual check
  useEffect(() => {
    const t = setTimeout(() => {
      if (payState === 'idle') setShowWV(true)
    }, 8000)
    return () => clearTimeout(t)
  }, [payState])

  const stateColor: Record<PayState, string> = {
    idle:       '#6b7280',
    filling:    '#3b82f6',
    processing: '#f59e0b',
    success:    '#22c55e',
    error:      '#ef4444',
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>

      {/* Always-mounted WebView */}
      {card && (
        <PaymentWebView
          visible={showWV}
          targetUrl={targetUrl}
          playerId={player?.loginId}
          card={card}
          onEbanxCalled={onEbanxCalled}
          onPaymentSuccess={onPaymentSuccess}
          onPossibleFailure={onPossibleFailure}
          onReadyForNext={onReadyForNext}
          onUserInfo={onUserInfo}
        />
      )}

      {/* Status overlay — visible when WebView is hidden */}
      {!showWV && (
        <View style={styles.statusWrap}>
          {payState !== 'success' && payState !== 'error' && (
            <ActivityIndicator size="large" color="#3b82f6" style={{ marginBottom: 20 }} />
          )}
          <Text style={[styles.stateText, { color: stateColor[payState] }]}>
            {STATE_LABELS[payState]}
          </Text>
          {progress.total > 1 && (
            <Text style={styles.progress}>
              {progress.done} / {progress.total} pagos
            </Text>
          )}
        </View>
      )}

    </View>
  )
}

const styles = StyleSheet.create({
  statusWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  stateText:  { fontSize: 17, fontWeight: '600', textAlign: 'center' },
  progress:   { fontSize: 14, color: '#6b7280', marginTop: 10 },
})
