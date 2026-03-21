import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native'
import { useNavigation }    from '@react-navigation/native'
import { usePaymentStore }  from '../store/usePaymentStore'
import { purchaseQueue }    from '../core/purchaseQueue'
import { buildBuyUrl }      from '../utils/buildBuyUrl'
import { REGIONS }          from '../config/regions'
import { NavProp }          from '../navigation/RootNavigator'

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

    // Enqueue all items
    for (const item of list) {
      for (let i = 0; i < item.qty; i++) {
        const url = buildBuyUrl(100067, item.channelId, item.itemId)
        purchaseQueue.enqueue({ url, id: `${item.id}_${i}` })
      }
    }

    // Navigate to Checkout — CVC travels as param
    navigation.navigate('Checkout', { cvc: cvc.trim() })
  }

  const renderItem = ({ item }: { item: BatchItem }) => {
    const reg = REGIONS.find(r => r.code === item.region)
    return (
      <View style={styles.row}>
        <Text style={styles.rowFlag}>{reg?.flag ?? '🌎'}</Text>
        <View style={styles.rowInfo}>
          <Text style={styles.rowDiamonds}>{item.diamonds} 💎{item.qty > 1 ? ` × ${item.qty}` : ''}</Text>
          <Text style={styles.rowPlayer}>{item.playerId}</Text>
        </View>
        <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.removeBtn}>
          <Text style={styles.removeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>

      {/* CVC once */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>CVC para este batch</Text>
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
        <Text style={styles.cvcHint}>Se aplica a todos los pagos del batch.</Text>
      </View>

      {/* List */}
      <View style={[styles.card, { flex: 1 }]}>
        <View style={styles.listHeader}>
          <Text style={styles.sectionLabel}>Items  ({list.length})</Text>
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
      </View>

      <TouchableOpacity
        style={[styles.startBtn, (list.length === 0 || cvc.length < 3) && styles.startBtnDisabled]}
        onPress={onStart}
        disabled={list.length === 0 || cvc.length < 3}
      >
        <Text style={styles.startBtnText}>
          Iniciar batch ({list.reduce((s, i) => s + i.qty, 0)} compras)
        </Text>
      </TouchableOpacity>

    </View>
  )
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  card:            { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  sectionLabel:    { fontSize: 12, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  cvcInput:        { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 22, color: '#111827', letterSpacing: 8, textAlign: 'center', width: 120 },
  cvcHint:         { fontSize: 11, color: '#9ca3af', marginTop: 6 },
  listHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  empty:           { fontSize: 13, color: '#9ca3af', textAlign: 'center', marginTop: 16, lineHeight: 22 },
  row:             { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#f3f4f6', gap: 10 },
  rowFlag:         { fontSize: 22 },
  rowInfo:         { flex: 1 },
  rowDiamonds:     { fontSize: 14, fontWeight: '600', color: '#111827' },
  rowPlayer:       { fontSize: 12, color: '#6b7280' },
  removeBtn:       { padding: 6 },
  removeBtnText:   { fontSize: 14, color: '#ef4444' },
  startBtn:        { backgroundColor: '#3b82f6', borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  startBtnDisabled: { backgroundColor: '#93c5fd' },
  startBtnText:    { fontSize: 16, fontWeight: '700', color: '#fff' },
})
