import React, { useState } from 'react'
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import { usePaymentStore }         from '../store/usePaymentStore'
import { formatPrice }             from '../services/mapItems'
import { buy }                     from '../purchase/buy'
import { NavProp, RootStackParamList } from '../navigation/RootNavigator'
import { REGIONS }                 from '../config/regions'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Icon } from '../components/Icon'
import { colors, spacing, radii, fontSize, fontWeight } from '../theme/tokens'

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
      playerId:  player.loginId,
      region:    params.region,
      promo:     params.promo,
      cvc:       cvc.trim(),
    })

    navigation.navigate('Checkout', { cvc: cvc.trim() })
  }

  const isValid = player && cvc.length >= 3

  return (
    <View style={styles.container}>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Icon name="diamond" size={22} color={colors.gray900} />
          <Text style={styles.mainItem}>
            {params.diamonds}
            {params.bonusDiamonds > 0 && (
              <Text style={styles.bonus}> (+{params.bonusDiamonds})</Text>
            )}
            {params.qty > 1 && <Text style={styles.qty}> × {params.qty}</Text>}
          </Text>
        </View>
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
      </Card>

      <Card>
        <Text style={styles.sectionLabel}>Para</Text>
        {player
          ? <Text style={styles.playerInfo}>{player.nickname}  ·  {player.loginId}</Text>
          : <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Icon name="warning" size={14} color={colors.warning} />
              <Text style={styles.playerMissing}>Sin jugador activo — inicia sesión en Home</Text>
            </View>
        }
      </Card>

      <Card>
        <Text style={styles.sectionLabel}>CVC de tu tarjeta</Text>
        <TextInput
          value={cvc}
          onChangeText={t => setCvc(t.replace(/\D/g, '').slice(0, 4))}
          placeholder="•••"
          placeholderTextColor={colors.gray400}
          keyboardType="numeric"
          secureTextEntry
          maxLength={4}
          style={styles.cvcInput}
        />
        <Text style={styles.cvcHint}>No se almacena. Solo se usa durante el pago.</Text>
      </Card>

      <Button
        title="Confirmar compra"
        disabled={!isValid}
        style={{ marginTop: spacing.sm }}
        onPress={onConfirm}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: colors.gray50, padding: spacing.lg },
  mainItem:       { fontSize: 26, fontWeight: fontWeight.bold, color: colors.gray900, marginBottom: spacing.xs },
  bonus:          { fontSize: 18, color: colors.success },
  qty:            { fontSize: 18, color: colors.primary },
  totalDiamonds:  { fontSize: fontSize.base, color: colors.gray500, marginBottom: spacing.sm },
  detailRow:      { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs + 1, borderTopWidth: 1, borderColor: colors.gray100 },
  detailLabel:    { fontSize: fontSize.base, color: colors.gray500 },
  detailVal:      { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.gray900 },
  promoVal:       { color: colors.success },
  sectionLabel:   { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.gray500, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: spacing.sm },
  playerInfo:     { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.gray900 },
  playerMissing:  { fontSize: fontSize.base, color: colors.warning },
  cvcInput:       { borderWidth: 1, borderColor: colors.gray300, borderRadius: radii.sm, padding: spacing.md, fontSize: 22, color: colors.gray900, letterSpacing: 8, textAlign: 'center', width: 120, marginBottom: spacing.sm },
  cvcHint:        { fontSize: fontSize.xs, color: colors.gray400 },
})
