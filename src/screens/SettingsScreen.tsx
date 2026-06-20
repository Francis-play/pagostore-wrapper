import React, { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, Alert, ScrollView, StyleSheet } from 'react-native'
import AsyncStorage         from '@react-native-async-storage/async-storage'
import { useNavigation }   from '@react-navigation/native'
import { usePaymentStore } from '../store/usePaymentStore'
import { loadCard, clearCard } from '../security/cardStore'
import { useWebView }      from '../context/WebViewContext'
import { REGIONS }         from '../config/regions'
import { NavProp }         from '../navigation/RootNavigator'
import { Card } from '../components/Card'
import { Section } from '../components/Section'
import { Icon } from '../components/Icon'
import { colors, radii, spacing, fontSize, fontWeight } from '../theme/tokens'

const REGIONS_KEY = 'ph_active_regions'

function maskCard(num: string): string {
  const clean = num.replace(/\D/g, '')
  if (clean.length < 4) return `****${clean.slice(-4)}`
  return `**** ${clean.slice(-4)}`
}

export default function SettingsScreen() {
  const navigation = useNavigation<NavProp<'Settings'>>()
  const { player, setPlayer, activeRegions, setActiveRegions } = usePaymentStore()
  const { mountWebView, unmountWebView, sendCommand } = useWebView()
  const [cardInfo, setCardInfo] = useState<string | null>(null)

  useEffect(() => {
    AsyncStorage.getItem(REGIONS_KEY).then(raw => {
      if (raw) {
        const saved: string[] = JSON.parse(raw)
        setActiveRegions(saved)
      }
    }).catch(() => {})
  }, [])

  useEffect(() => {
    AsyncStorage.setItem(REGIONS_KEY, JSON.stringify(activeRegions)).catch(() => {})
  }, [activeRegions])

  useEffect(() => {
    loadCard().then(c => {
      if (c) setCardInfo(`${c.name} — ${maskCard(c.number)}`)
    }).catch(() => {})
  }, [])

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
            mountWebView()
            setTimeout(() => {
              sendCommand({ type: 'CLEAR_SESSION' })
              setTimeout(() => unmountWebView(), 500)
            }, 800)
            navigation.reset({ index: 0, routes: [{ name: 'Pin' }] })
          },
        },
      ]
    )
  }

  const onViewCard = async () => {
    const card = await loadCard()
    if (!card) {
      Alert.alert('Sin tarjeta', 'No hay tarjeta guardada. Se guarda automáticamente al hacer un pago.')
      return
    }
    Alert.alert(
      'Tarjeta guardada',
      `Titular: ${card.name}\nNúmero: ${maskCard(card.number)}\nVence: ${card.expiry}\nEmail: ${card.email}`,
      [
        { text: 'Cerrar' },
        { text: 'Eliminar', style: 'destructive', onPress: async () => {
          await clearCard()
          setCardInfo(null)
          Alert.alert('Listo', 'Tarjeta eliminada.')
        }},
      ]
    )
  }

  const activeCount = activeRegions.length

  const Row = ({ label, sub, onPress, danger }: { label: string; sub?: string; onPress: () => void; danger?: boolean }) => (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, danger && styles.danger]}>{label}</Text>
        {sub && <Text style={styles.rowSub}>{sub}</Text>}
      </View>
      <Icon name="chevron-right" size={20} color={colors.gray300} />
    </TouchableOpacity>
  )

  return (
    <ScrollView style={styles.container}>
      <View style={styles.sectionWrap}>

        <Section title="General">
          <Card padded={false}>
            <Row
              label="Regiones activas"
              sub={`${activeCount} de ${REGIONS.length} países seleccionados`}
              onPress={() => navigation.navigate('RegionSettings')}
            />
            <Row
              label="Catálogo de items"
              sub="Cargar y activar/desactivar items por región"
              onPress={() => navigation.navigate('ItemCatalog')}
            />
          </Card>
        </Section>

        <Section title="Tarjeta">
          <Card padded={false}>
            <Row
              label={cardInfo ? `Ver tarjeta (${cardInfo})` : 'Ver tarjeta guardada'}
              sub={cardInfo ? undefined : 'No hay tarjeta guardada'}
              onPress={onViewCard}
            />
          </Card>
        </Section>

        <Section title="Sesión">
          <Card padded={false}>
            <Row
              label={player ? `Cerrar sesión (${player.nickname})` : 'Sin sesión activa'}
              sub={player ? `ID: ${player.loginId}` : undefined}
              onPress={onSignOut}
              danger
            />
          </Card>
        </Section>

      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: colors.gray50 },
  sectionWrap:  { paddingBottom: spacing.xxxl },
  row:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md + 2, borderTopWidth: 1, borderColor: colors.gray100 },
  rowLabel:     { fontSize: fontSize.lg, color: colors.gray900, fontWeight: fontWeight.medium },
  rowSub:       { fontSize: fontSize.sm, color: colors.gray400, marginTop: spacing.xs },
  danger:       { color: colors.error },
})
