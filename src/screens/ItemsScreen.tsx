import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import { usePaymentStore }         from '../store/usePaymentStore'
import { formatPrice }             from '../services/mapItems'
import { buy }                     from '../purchase/buy'
import { NavProp, RootStackParamList } from '../navigation/RootNavigator'
import { REGIONS }                 from '../config/regions'

type RouteParams = RootStackParamList['Items']

export default function ItemsScreen() {
  const route      = useRoute()
  const navigation = useNavigation<NavProp<'Items'>>()
  const params     = route.params as RouteParams

  const { player } = usePaymentStore()
  const [cvc, setCvc] = useState('')

  const region = REGIONS.find(r => r.code === params.region)

  const totalDiamonds = (params.diamonds + params.bonusDiamonds) * params.qty
  const priceStr      = formatPrice(params.price * params.qty, params.currencySymbol)

  const onConfirm = () => {
    if (cvc.trim().length < 3) {
      Alert.alert('CVC inválido', 'El CVC debe tener 3 o 4 dígitos.')
      return
    }
    if (!player) {
      Alert.alert('Sin jugador', 'Inicia sesión primero en la pantalla principal.')
      return
    }

    buy({
      appId:     100067,
      channelId: params.channelId,
      itemId:    params.itemId,
      qty:       params.qty,
    })

    // CVC travels as nav param — never stored
    navigation.navigate('Checkout', { cvc: cvc.trim() })
  }

  return (
    <View style={styles.container}>

      {/* Summary card */}
      <View style={styles.card}>
        <Text style={styles.mainItem}>
          {params.diamonds} 💎
          {params.bonusDiamonds > 0 && (
            <Text style={styles.bonus}> (+{params.bonusDiamonds})</Text>
          )}
          {params.qty > 1 && <Text style={styles.qty}> × {params.qty}</Text>}
        </Text>
        {params.qty > 1 && (
          <Text style={styles.totalDiamonds}>{totalDiamonds} 💎 en total</Text>
        )}

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Región</Text>
          <Text style={styles.detailVal}>{region?.flag} {region?.label}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Precio</Text>
          <Text style={styles.detailVal}>{priceStr}</Text>
        </View>
        {params.promo && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Promo</Text>
            <Text style={[styles.detailVal, styles.promoVal]}>{params.promo}</Text>
          </View>
        )}
      </View>

      {/* Player */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Para</Text>
        {player
          ? <Text style={styles.playerInfo}>{player.nickname}  ·  {player.loginId}</Text>
          : <Text style={styles.playerMissing}>⚠ Sin jugador activo — inicia sesión en Home</Text>
        }
      </View>

      {/* CVC */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>CVC de tu tarjeta</Text>
        <TextInput
          value={cvc}
          onChangeText={t => setCvc(t.replace(/\D/g, '').slice(0, 4))}
          placeholder="•••"
          placeholderTextColor="#9ca3af"
          keyboardType="numeric"
          secureTextEntry
          maxLength={4}
          style={styles.cvcInput}
        />
        <Text style={styles.cvcHint}>No se almacena. Solo se usa durante el pago.</Text>
      </View>

      <TouchableOpacity
        style={[styles.btnConfirm, (!player || cvc.length < 3) && styles.btnDisabled]}
        onPress={onConfirm}
        disabled={!player || cvc.length < 3}
      >
        <Text style={styles.btnText}>Confirmar compra</Text>
      </TouchableOpacity>

    </View>
  )
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  card:           { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  mainItem:       { fontSize: 26, fontWeight: '700', color: '#111827', marginBottom: 4 },
  bonus:          { fontSize: 18, color: '#16a34a' },
  qty:            { fontSize: 18, color: '#3b82f6' },
  totalDiamonds:  { fontSize: 13, color: '#6b7280', marginBottom: 8 },
  detailRow:      { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderTopWidth: 1, borderColor: '#f3f4f6' },
  detailLabel:    { fontSize: 13, color: '#6b7280' },
  detailVal:      { fontSize: 13, fontWeight: '600', color: '#111827' },
  promoVal:       { color: '#16a34a' },
  sectionLabel:   { fontSize: 12, fontWeight: '600', color: '#6b7280', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 },
  playerInfo:     { fontSize: 15, fontWeight: '600', color: '#111827' },
  playerMissing:  { fontSize: 13, color: '#f59e0b' },
  cvcInput:       { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 22, color: '#111827', letterSpacing: 8, textAlign: 'center', width: 120, marginBottom: 8 },
  cvcHint:        { fontSize: 11, color: '#9ca3af' },
  btnConfirm:     { backgroundColor: '#3b82f6', borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 8 },
  btnDisabled:    { backgroundColor: '#93c5fd' },
  btnText:        { fontSize: 16, fontWeight: '700', color: '#fff' },
})
