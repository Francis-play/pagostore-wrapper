import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Button } from '../components/Button'
import { colors, spacing, fontSize, fontWeight } from '../theme/tokens'

export default function ResultScreen({ route }: any) {
  const navigation = useNavigation()
  const ok = route.params?.ok

  return (
    <View style={styles.container}>
      <Text style={[styles.title, ok ? styles.ok : styles.fail]}>
        {ok ? 'Pago correcto' : 'Pago fallido'}
      </Text>
      <Text style={[styles.icon, ok ? styles.ok : styles.fail]}>
        {ok ? '✓' : '✗'}
      </Text>
      <View style={{ marginTop: spacing.xl + 4 }}>
        <Button title="Ir a Home" onPress={() => navigation.navigate('Home' as never)} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.gray50 },
  title:     { fontSize: 24, fontWeight: fontWeight.semibold, marginBottom: spacing.sm },
  icon:      { fontSize: 48, fontWeight: fontWeight.bold },
  ok:   { color: colors.success },
  fail: { color: colors.error },
})
