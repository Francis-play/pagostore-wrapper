import React, { useRef, useEffect, useState } from 'react'
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import { loadCard }   from '../security/cardStore'
import { usePaymentStore } from '../store/usePaymentStore'
import { buildBuyUrl }     from '../utils/buildBuyUrl'
import { buildInjector }   from '../webview/injector'
import { useWebView }      from '../context/WebViewContext'
import { NavProp, RootStackParamList } from '../navigation/RootNavigator'
import { CardData }        from '../webview/injector'
import { Icon } from '../components/Icon'
import { colors, spacing, fontSize, fontWeight, radii } from '../theme/tokens'

const APP_ID = 100067

type RouteParams = RootStackParamList['Checkout']

type PayState = 'idle' | 'filling' | 'processing' | 'success' | 'error'

const STATE_LABELS: Record<PayState, string> = {
  idle:       'Iniciando...',
  filling:    'Rellenando datos de tarjeta...',
  processing: 'Procesando pago...',
  success:    'Pago completado',
  error:      'Error — revisa el WebView',
}

const stateColor: Record<PayState, string> = {
  idle:       colors.gray500,
  filling:    colors.primary,
  processing: colors.warning,
  success:    colors.successLight,
  error:      colors.error,
}

export default function CheckoutScreen() {
  const route      = useRoute()
  const navigation = useNavigation<NavProp<'Checkout'>>()
  const { cvc }    = route.params as RouteParams

  const player = usePaymentStore(s => s.player)

  const {
    mountWebView, unmountWebView, sendCommand,
    navigateTo, visible, setVisible,
    setMessageHandler,
  } = useWebView()

  const [card,       setCard]       = useState<CardData | null>(null)
  const [payState,   setPayState]   = useState<PayState>('idle')
  const [progress,   setProgress]   = useState({ done: 0, total: 0 })

  const lastSuccess = useRef(false)
  const lastItem    = useRef<{ channel: number; itemId: number } | null>(null)
  const injectorInjected = useRef(false)
  const pendingGoBack    = useRef<{ channel: number; itemId: number } | null>(null)

  useEffect(() => {
    mountWebView()
    return () => {
      unmountWebView()
      injectorInjected.current = false
    }
  }, [])

  useEffect(() => {
    loadCard().then(c => {
      if (!c) { setPayState('error'); return }
      setCard({ ...c, cvc })
    }).catch(() => setPayState('error'))
  }, [cvc])

  useEffect(() => {
    setMessageHandler((msg) => {
      if (msg.type === 'EBANX_TOKEN') {
        setPayState('processing')
      }
      if (msg.type === 'PAY_SUCCESS') {
        lastSuccess.current = true
        setPayState('success')
        setProgress(p => ({ ...p, done: p.done + 1 }))
      }
      if (msg.type === 'READY_FOR_NEXT') {
        const { queue } = usePaymentStore.getState()
        if (queue.length === 0) {
          navigation.navigate('Result', { ok: lastSuccess.current })
          lastSuccess.current = false
          return
        }
        const next = usePaymentStore.getState().pop()
        if (!next) return

        const sameItem = lastItem.current
          && next.channel === lastItem.current.channel
          && next.itemId  === lastItem.current.itemId

        if (sameItem) {
          sendCommand({ type: 'GO_BACK' })
          pendingGoBack.current = { channel: next.channel, itemId: next.itemId }
        } else {
          navigateTo(buildBuyUrl(APP_ID, next.channel, next.itemId))
        }
        lastItem.current = { channel: next.channel, itemId: next.itemId }
        setPayState('idle')
        lastSuccess.current = false
      }
      if (msg.type === 'GO_BACK_FAILED' && pendingGoBack.current) {
        const next = pendingGoBack.current
        pendingGoBack.current = null
        navigateTo(buildBuyUrl(APP_ID, next.channel, next.itemId))
      }
    })
    return () => setMessageHandler(null)
  }, [navigation])

  useEffect(() => {
    if (!card) return
    const { queue, pop: storePop } = usePaymentStore.getState()
    const item = storePop()
    if (!item) { setPayState('error'); return }

    const total = queue.length
    setProgress({ done: 0, total })
    lastItem.current = { channel: item.channel, itemId: item.itemId }

    if (!injectorInjected.current) {
      sendCommand({ type: 'INJECTOR', script: buildInjector(card) })
      injectorInjected.current = true
    }

    navigateTo(buildBuyUrl(APP_ID, item.channel, item.itemId))
    setPayState('idle')
  }, [card])

  useEffect(() => {
    const t = setTimeout(() => {
      if (payState === 'idle') setVisible(true)
    }, 8000)
    return () => clearTimeout(t)
  }, [payState])

  return (
    <View style={{ flex: 1, backgroundColor: colors.gray50 }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxxl }}>
        {payState !== 'success' && payState !== 'error' && (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginBottom: spacing.xl }} />
        )}
        <Text style={{ fontSize: fontSize.xxl, fontWeight: fontWeight.semibold, textAlign: 'center', color: stateColor[payState] }}>
          {STATE_LABELS[payState]}
        </Text>
        {payState === 'success' && <View style={{ alignItems: 'center', marginTop: spacing.sm }}><Icon name="check" size={24} color={colors.successLight} /></View>}
        {progress.total > 1 && (
          <Text style={{ fontSize: fontSize.md, color: colors.gray500, marginTop: spacing.md }}>
            {progress.done} / {progress.total} pagos
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={{
          position: 'absolute', bottom: spacing.xl, left: spacing.lg,
          width: 40, height: 40, borderRadius: 20,
          backgroundColor: colors.overlay,
          alignItems: 'center', justifyContent: 'center', zIndex: 100,
        }}
        onPress={() => setVisible(!visible)}
      >
        <Icon name="search" size={18} color={colors.white} />
      </TouchableOpacity>
    </View>
  )
}
