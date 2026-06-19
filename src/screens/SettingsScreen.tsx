import React, { useEffect } from 'react'
import { View, Text, TouchableOpacity, Switch, Alert, ScrollView, StyleSheet } from 'react-native'
import AsyncStorage         from '@react-native-async-storage/async-storage'
import { useNavigation }   from '@react-navigation/native'
import { usePaymentStore } from '../store/usePaymentStore'
import { clearCard }       from '../security/cardStore'
import { useWebView }      from '../context/WebViewContext'
import { REGIONS }         from '../config/regions'
import { NavProp }         from '../navigation/RootNavigator'
import { Card } from '../components/Card'
import { Section } from '../components/Section'
import { Icon } from '../components/Icon'
import { colors, radii, spacing, fontSize, fontWeight } from '../theme/tokens'

const REGIONS_KEY = 'ph_active_regions'

export default function SettingsScreen() {
  const navigation = useNavigation<NavProp<'Settings'>>()
  const { player, setPlayer, activeRegions, setActiveRegions, toggleRegion } = usePaymentStore()
  const { mountWebView, unmountWebView, sendCommand } = useWebView()

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
      <Icon name="chevron-right" size={20} color={colors.gray300} />
    </TouchableOpacity>
  )

  return (
    <ScrollView style={styles.container}>
      <View style={styles.sectionWrap}>
        <Section title="Regiones activas" hint="Selecciona los países que aparecen en el catálogo. Las regiones desactivadas no se cargan.">
          <Card padded={false}>
            {REGIONS.map(r => (
              <View key={r.code} style={styles.regionRow}>
                <Text style={styles.regionFlag}>{r.flag}</Text>
                <Text style={styles.regionLabel}>{r.label}</Text>
                <Switch
                  value={activeRegions.includes(r.code)}
                  onValueChange={() => toggleRegion(r.code)}
                  trackColor={{ false: colors.gray300, true: colors.primaryLight }}
                  thumbColor={activeRegions.includes(r.code) ? colors.primary : colors.gray100}
                />
              </View>
            ))}
          </Card>
        </Section>

        <Section title="Catálogo">
          <Card padded={false}>
            <Row
              label="Items disponibles"
              sub="Cargar y activar/desactivar items por región"
              onPress={() => navigation.navigate('ItemCatalog')}
            />
          </Card>
        </Section>

        <Section title="Tarjeta">
          <Card padded={false}>
            <Row
              label="Eliminar tarjeta guardada"
              sub="Los datos se borran del Keychain"
              onPress={onDeleteCard}
              danger
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
  regionRow:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderTopWidth: 1, borderColor: colors.gray100, gap: 12 },
  regionFlag:   { fontSize: 22 },
  regionLabel:  { flex: 1, fontSize: fontSize.lg, color: colors.gray900, fontWeight: fontWeight.medium },
  row:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md + 2, borderTopWidth: 1, borderColor: colors.gray100 },
  rowLabel:     { fontSize: fontSize.lg, color: colors.gray900, fontWeight: fontWeight.medium },
  rowSub:       { fontSize: fontSize.sm, color: colors.gray400, marginTop: spacing.xs },
  danger:       { color: colors.error },
})
