import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useNavigation }   from '@react-navigation/native'
import { usePaymentStore } from '../store/usePaymentStore'
import { clearCard }       from '../security/cardStore'
import { NavProp }         from '../navigation/RootNavigator'

export default function SettingsScreen() {
  const navigation = useNavigation<NavProp<'Settings'>>()
  const { player, setPlayer } = usePaymentStore()

  const onSignOut = () => {
    Alert.alert(
      'Cerrar sesión',
      `¿Cerrar la sesión de ${player?.nickname ?? 'jugador'}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: () => {
            setPlayer(null)
            navigation.navigate('Pin')
          },
        },
      ]
    )
  }

  const onDeleteCard = () => {
    Alert.alert(
      'Eliminar tarjeta',
      '¿Eliminar los datos de tarjeta guardados?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await clearCard()
            Alert.alert('Listo', 'Tarjeta eliminada.')
          },
        },
      ]
    )
  }

  const Row = ({ label, sub, onPress, danger }: { label: string; sub?: string; onPress: () => void; danger?: boolean }) => (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, danger && styles.danger]}>{label}</Text>
        {sub && <Text style={styles.rowSub}>{sub}</Text>}
      </View>
      <Text style={styles.rowArrow}>›</Text>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>

      <View style={styles.section}>
        <Text style={styles.sectionHead}>Catálogo</Text>
        <Row
          label="Items disponibles"
          sub="Cargar y activar/desactivar items por región"
          onPress={() => navigation.navigate('ItemCatalog')}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHead}>Tarjeta</Text>
        <Row
          label="Eliminar tarjeta guardada"
          sub="Los datos se borran del Keychain"
          onPress={onDeleteCard}
          danger
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHead}>Sesión</Text>
        <Row
          label={player ? `Cerrar sesión (${player.nickname})` : 'Sin sesión activa'}
          sub={player ? `ID: ${player.loginId}` : undefined}
          onPress={onSignOut}
          danger
        />
      </View>

    </View>
  )
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#f9fafb' },
  section:     { marginTop: 20, marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', overflow: 'hidden' },
  sectionHead: { fontSize: 11, fontWeight: '700', color: '#6b7280', letterSpacing: 1, textTransform: 'uppercase', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  row:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderColor: '#f3f4f6' },
  rowLabel:    { fontSize: 15, color: '#111827', fontWeight: '500' },
  rowSub:      { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  rowArrow:    { fontSize: 20, color: '#d1d5db', marginLeft: 8 },
  danger:      { color: '#ef4444' },
})
