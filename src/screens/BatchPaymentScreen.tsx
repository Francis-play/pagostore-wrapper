import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native'
import { useNavigation }    from '@react-navigation/native'
import { usePaymentStore }  from '../store/usePaymentStore'
import { REGIONS }          from '../config/regions'
import { NavProp }          from '../navigation/RootNavigator'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Icon } from '../components/Icon'
import { colors, spacing, radii, fontSize, fontWeight } from '../theme/tokens'

type BatchItem = {
  id:        string
  itemId:    number
  channelId: number
  region:    string
  diamonds:  number
  qty:       number
  playerId:  string
}

export default function BatchPaymentScreen() {
  const navigation = useNavigation<NavProp<'Batch'>>()
  const { player } = usePaymentStore()

  const [cvc,  setCvc]  = useState('')
  const [list, setList] = useState<BatchItem[]>([])

  const removeItem = (id: string) => setList(l => l.filter(i => i.id !== id))

  const onStart = () => {
    if (!cvc.trim() || cvc.trim().length < 3) {
      Alert.alert('CVC inválido', 'Ingresa el CVC de tu tarjeta (3-4 dígitos).')
      return
    }
    if (list.length === 0) {
      Alert.alert('Lista vacía', 'Agrega items antes de iniciar.')
      return
    }
    if (!player) {
      Alert.alert('Sin jugador', 'Inicia sesión en la pantalla principal primero.')
      return
    }

    const { add } = usePaymentStore.getState()
    for (const item of list) {
      for (let i = 0; i < item.qty; i++) {
        add({
          playerId: player.loginId,
          itemId:   item.itemId,
          channel:  item.channelId,
          region:   item.region,
          promo:    null,
          qty:      1,
          cvc:      cvc.trim(),
        })
      }
    }

    navigation.navigate('Checkout', { cvc: cvc.trim() })
  }

  const renderItem = ({ item }: { item: BatchItem }) => {
    const reg = REGIONS.find(r => r.code === item.region)
    return (
      <View style={styles.row}>
        <Text style={styles.rowFlag}>{reg?.flag}</Text>
        <View style={styles.rowInfo}>
          <Text style={styles.rowDiamonds}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Icon name="diamond" size={14} color={colors.gray900} />
            <Text style={styles.rowDiamonds}>{item.diamonds}{item.qty > 1 ? ` × ${item.qty}` : ''}</Text>
          </View>
          </Text>
          <Text style={styles.rowPlayer}>{item.playerId}</Text>
        </View>
        <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.removeBtn}>
          <Icon name="close" size={14} color={colors.error} />
        </TouchableOpacity>
      </View>
    )
  }

  const isValid = list.length > 0 && cvc.length >= 3

  return (
    <View style={styles.container}>
      <Card>
        <Text style={styles.sectionLabel}>CVC para este batch</Text>
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
        <Text style={styles.cvcHint}>Se aplica a todos los pagos del batch.</Text>
      </Card>

      <Card style={{ flex: 1 }}>
        <View style={styles.listHeader}>
          <Text style={styles.sectionLabel}>Items ({list.length})</Text>
        </View>
        {list.length === 0 ? (
          <Text style={styles.empty}>La lista está vacía.{'\n'}(Los items se añaden programáticamente)</Text>
        ) : (
          <FlatList
            data={list}
            keyExtractor={i => i.id}
            renderItem={renderItem}
          />
        )}
      </Card>

      <Button
        title={`Iniciar batch (${list.reduce((s, i) => s + i.qty, 0)} compras)`}
        disabled={!isValid}
        onPress={onStart}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: colors.gray50, padding: spacing.lg },
  sectionLabel:    { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.gray500, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm + 2 },
  cvcInput:        { borderWidth: 1, borderColor: colors.gray300, borderRadius: radii.sm, padding: spacing.md, fontSize: 22, color: colors.gray900, letterSpacing: 8, textAlign: 'center', width: 120 },
  cvcHint:         { fontSize: fontSize.xs, color: colors.gray400, marginTop: spacing.xs + 2 },
  listHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  empty:           { fontSize: fontSize.base, color: colors.gray400, textAlign: 'center', marginTop: spacing.lg, lineHeight: 22 },
  row:             { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm + 2, borderBottomWidth: 1, borderColor: colors.gray100, gap: spacing.sm + 2 },
  rowFlag:         { fontSize: 22 },
  rowInfo:         { flex: 1 },
  rowDiamonds:     { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.gray900 },
  rowPlayer:       { fontSize: fontSize.sm, color: colors.gray500 },
  removeBtn:       { padding: spacing.xs + 2 },
})
