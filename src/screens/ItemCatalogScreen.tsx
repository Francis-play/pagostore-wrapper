import React, { useState, useCallback } from 'react'
import {
  View, Text, SectionList, Switch, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native'
import AsyncStorage         from '@react-native-async-storage/async-storage'
import { usePaymentStore }  from '../store/usePaymentStore'
import { loadItems }        from '../services/itemService'
import { mapItems, formatPrice, StoreItem } from '../services/mapItems'
import { REGIONS }          from '../config/regions'
import { Icon } from '../components/Icon'
import { colors, spacing, radii, fontSize, fontWeight } from '../theme/tokens'

const APP_ID        = 100067
const CATALOG_KEY   = 'ph_catalog_v1'

export default function ItemCatalogScreen() {
  const { catalog, setCatalog, toggleItem, activeRegions } = usePaymentStore()
  const [loading, setLoading] = useState(false)

  const enabledRegions = REGIONS.filter(r => activeRegions.includes(r.code))

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const results = await Promise.allSettled(
        enabledRegions.map(r => loadItems(APP_ID, r.code).then(raw => mapItems(raw, r.code)))
      )

      const newItems: StoreItem[] = []
      for (let i = 0; i < results.length; i++) {
        const r = results[i]
        if (r.status === 'fulfilled') {
          const fresh = r.value.map(item => {
            const existing = catalog.find(
              c => c.itemId === item.itemId && c.region === item.region
            )
            return existing ? { ...item, enabled: existing.enabled } : item
          })
          newItems.push(...fresh)
        } else {
          console.warn('Failed to load region', enabledRegions[i].code, r.reason)
        }
      }

      setCatalog(newItems)
      await AsyncStorage.setItem(CATALOG_KEY, JSON.stringify(newItems))
      Alert.alert('Catálogo actualizado', `${newItems.length} items cargados.`)
    } catch {
      Alert.alert('Error', 'No se pudo actualizar el catálogo.')
    } finally {
      setLoading(false)
    }
  }, [catalog, setCatalog, activeRegions])

  const onToggle = useCallback((itemId: number, region: string, _enabled: boolean) => {
    toggleItem(itemId, region)
    const updated = catalog.map(i =>
      i.itemId === itemId && i.region === region ? { ...i, enabled: !i.enabled } : i
    )
    AsyncStorage.setItem(CATALOG_KEY, JSON.stringify(updated)).catch(() => {})
  }, [catalog, toggleItem])

  const sections = enabledRegions.map(r => ({
    region: r,
    data:   catalog.filter(i => i.region === r.code),
  })).filter(s => s.data.length > 0)

  const renderItem = ({ item }: { item: StoreItem }) => (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Icon name="diamond" size={15} color={colors.gray900} />
          <Text style={styles.diamonds}>
            {item.diamonds}
            {item.bonusDiamonds > 0 && (
              <Text style={styles.bonus}> +{item.bonusDiamonds}</Text>
            )}
          </Text>
        </View>
        <Text style={styles.price}>
          {formatPrice(item.price, item.currencySymbol)}
        </Text>
      </View>
      <Switch
        value={item.enabled}
        onValueChange={v => onToggle(item.itemId, item.region, v)}
        trackColor={{ false: colors.gray300, true: colors.primaryLight }}
        thumbColor={item.enabled ? colors.primary : colors.gray400}
      />
    </View>
  )

  const renderSectionHeader = ({ section }: { section: typeof sections[0] }) => (
    <View style={styles.sectionHead}>
      <Text style={styles.sectionTitle}>
        {section.region.flag}  {section.region.label} ({section.region.code})
      </Text>
    </View>
  )

  return (
    <View style={{ flex: 1, backgroundColor: colors.gray50 }}>
      <View style={styles.header}>
        <Text style={styles.headerHint}>
          {catalog.length === 0
            ? 'Toca "Actualizar" para cargar los items.'
            : `${catalog.filter(i => i.enabled).length} items activados`}
        </Text>
        <TouchableOpacity
          style={[styles.refreshBtn, loading && styles.refreshBtnDisabled]}
          onPress={refresh}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator size="small" color={colors.white} />
            : <Text style={styles.refreshBtnText}>Actualizar</Text>
          }
        </TouchableOpacity>
      </View>

      {sections.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            No hay items cargados.{'\n'}Toca "Actualizar" para traer el catálogo.
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={i => `${i.region}_${i.itemId}`}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          stickySectionHeadersEnabled
          contentContainerStyle={{ paddingBottom: 32 }}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.white, padding: spacing.md + 2, borderBottomWidth: 1, borderColor: colors.gray200 },
  headerHint:       { fontSize: fontSize.base, color: colors.gray500, flex: 1 },
  refreshBtn:       { backgroundColor: colors.primary, borderRadius: radii.sm, paddingHorizontal: spacing.md + 2, paddingVertical: spacing.sm },
  refreshBtnDisabled: { backgroundColor: colors.primaryLight },
  refreshBtnText:   { color: colors.white, fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  sectionHead:      { backgroundColor: colors.gray100, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderBottomWidth: 1, borderColor: colors.gray200 },
  sectionTitle:     { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: colors.gray700 },
  row:              { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.white, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderColor: colors.gray100 },
  rowLeft:          { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  diamonds:         { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.gray900 },
  bonus:            { fontSize: fontSize.sm, color: colors.success },
  price:            { fontSize: fontSize.base, color: colors.primary, fontWeight: fontWeight.medium },
  empty:            { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText:        { fontSize: fontSize.md, color: colors.gray400, textAlign: 'center', lineHeight: 24 },
})
