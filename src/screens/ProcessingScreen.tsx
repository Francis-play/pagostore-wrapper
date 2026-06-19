import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import { Button } from '../components/Button'
import { colors, spacing, fontSize, fontWeight } from '../theme/tokens'

export default function ProcessingScreen() {
  const route = useRoute()
  const navigation = useNavigation()
  const item = (route.params as any)?.item

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Procesando...</Text>
      <Text style={styles.subtitle}>{item?.name || item?.diamonds ? `${item.diamonds} diamonds` : 'Pago en curso'}</Text>
      <View style={styles.debug}>
        <Button
          title="Ver resultado (debug)"
          variant="ghost"
          onPress={() => (navigation as any).navigate('Result', { ok: true })}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
  title:     { fontSize: 22, fontWeight: fontWeight.semibold, marginBottom: spacing.sm, color: colors.gray900 },
  subtitle:  { fontSize: fontSize.md, color: colors.gray500, marginBottom: 24 },
  debug:     { marginTop: 32, opacity: 0.4 },
})
