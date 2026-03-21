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

const APP_ID        = 100067
const CATALOG_KEY   = 'ph_catalog_v1'

export default function ItemCatalogScreen() {
  const { catalog, setCatalog, toggleItem } = usePaymentStore()
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const results = await Promise.allSettled(
        REGIONS.map(r => loadItems(APP_ID, r.code).then(raw => mapItems(raw, r.code)))
      )

      const newItems: StoreItem[] = []
      for (let i = 0; i < results.length; i++) {
        const r = results[i]
        if (r.status === 'fulfilled') {
          // Preserve enabled state for items already in catalog
          const fresh = r.value.map(item => {
            const existing = catalog.find(
              c => c.itemId === item.itemId && c.region === item.region
            )
            return existing ? { ...item, enabled: existing.enabled } : item
          })
          newItems.push(...fresh)
        } else {
          console.warn('Failed to load region', REGIONS[i].code, r.reason)
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
  }, [catalog, setCatalog])

  const onToggle = useCallback((itemId: number, region: string, _enabled: boolean) => {
    toggleItem(itemId, region)
    // Persist updated catalog
    const updated = catalog.map(i =>
      i.itemId === itemId && i.region === region ? { ...i, enabled: !i.enabled } : i
    )
    AsyncStorage.setItem(CATALOG_KEY, JSON.stringify(updated)).catch(() => {})
  }, [catalog, toggleItem])

  // Build sections grouped by region
  const sections = REGIONS.map(r => ({
    region: r,
    data:   catalog.filter(i => i.region === r.code),
  })).filter(s => s.data.length > 0)

  const renderItem = ({ item }: { item: StoreItem }) => (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Text style={styles.diamonds}>
          {item.diamonds} 💎
          {item.bonusDiamonds > 0 && (
            <Text style={styles.bonus}> +{item.bonusDiamonds}</Text>
          )}
        </Text>
        <Text style={styles.price}>
          {formatPrice(item.price, item.currencySymbol)}
        </Text>
      </View>
      <Switch
        value={item.enabled}
        onValueChange={v => onToggle(item.itemId, item.region, v)}
        trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
        thumbColor={item.enabled ? '#3b82f6' : '#9ca3af'}
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
    <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>

      {/* Refresh button */}
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
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.refreshBtnText}>Actualizar ↻</Text>
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
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', padding: 14, borderBottomWidth: 1, borderColor: '#e5e7eb' },
  headerHint:       { fontSize: 13, color: '#6b7280', flex: 1 },
  refreshBtn:       { backgroundColor: '#3b82f6', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  refreshBtnDisabled: { backgroundColor: '#93c5fd' },
  refreshBtnText:   { color: '#fff', fontSize: 13, fontWeight: '600' },
  sectionHead:      { backgroundColor: '#f3f4f6', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderColor: '#e5e7eb' },
  sectionTitle:     { fontSize: 13, fontWeight: '700', color: '#374151' },
  row:              { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderColor: '#f3f4f6' },
  rowLeft:          { flexDirection: 'row', alignItems: 'center', gap: 12 },
  diamonds:         { fontSize: 15, fontWeight: '600', color: '#111827' },
  bonus:            { fontSize: 12, color: '#16a34a' },
  price:            { fontSize: 13, color: '#3b82f6', fontWeight: '500' },
  empty:            { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText:        { fontSize: 14, color: '#9ca3af', textAlign: 'center', lineHeight: 24 },
})
