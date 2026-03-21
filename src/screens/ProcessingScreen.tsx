import React from 'react'
import { View, Text, StyleSheet, Button } from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'

export default function ProcessingScreen() {

  const route = useRoute()
  const navigation = useNavigation()
  const item = (route.params as any)?.item

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Procesando...</Text>
      <Text style={styles.subtitle}>{item?.name || item?.diamonds ? `${item.diamonds} diamonds` : 'Pago en curso'}</Text>
      {/* Solo para debug: mostrar resultado manualmente */}
      <View style={styles.debug}>
        <Button
          title="Ver resultado (debug)"
          onPress={() => (navigation as any).navigate('Result', { ok: true })}
        />
      </View>
    </View>
  )

}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title:     { fontSize: 22, fontWeight: '600', marginBottom: 8 },
  subtitle:  { fontSize: 14, color: '#6b7280', marginBottom: 24 },
  debug:     { marginTop: 32, opacity: 0.4 },
})
