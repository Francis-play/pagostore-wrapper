import React from 'react'
import { View, Text, Switch, ScrollView, StyleSheet } from 'react-native'
import { usePaymentStore } from '../store/usePaymentStore'
import { REGIONS } from '../config/regions'
import { colors, spacing, radii, fontSize, fontWeight } from '../theme/tokens'

export default function RegionSettingsScreen() {
  const { activeRegions, toggleRegion } = usePaymentStore()

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.hint}>
        Selecciona los países que aparecen en el catálogo. Las regiones desactivadas no se cargan al actualizar.
      </Text>
      <View style={styles.card}>
        {REGIONS.map((r, i) => (
          <View
            key={r.code}
            style={[styles.row, i === 0 && { borderTopWidth: 0 }]}
          >
            <Text style={styles.flag}>{r.flag}</Text>
            <Text style={styles.label}>{r.label}</Text>
            <Text style={styles.code}>{r.code}</Text>
            <Switch
              value={activeRegions.includes(r.code)}
              onValueChange={() => toggleRegion(r.code)}
              trackColor={{ false: colors.gray300, true: colors.primaryLight }}
              thumbColor={activeRegions.includes(r.code) ? colors.primary : colors.gray100}
            />
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray50, padding: spacing.lg },
  hint: { fontSize: fontSize.sm, color: colors.gray500, marginBottom: spacing.lg, lineHeight: 20 },
  card: { backgroundColor: colors.white, borderRadius: radii.lg, overflow: 'hidden' },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderTopWidth: 1, borderColor: colors.gray100, gap: 12,
  },
  flag:  { fontSize: 22 },
  label: { flex: 1, fontSize: fontSize.lg, color: colors.gray900, fontWeight: fontWeight.medium },
  code:  { fontSize: fontSize.sm, color: colors.gray400, fontWeight: fontWeight.medium },
})
