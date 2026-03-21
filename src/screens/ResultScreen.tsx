import React from 'react'
import { View, Text, Button, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'

export default function ResultScreen({ route }: any) {

  const navigation = useNavigation()
  const ok = route.params?.ok

  return (
    <View style={styles.container}>
      <Text style={[styles.title, ok ? styles.ok : styles.fail]}>
        {ok ? 'Pago correcto ✓' : 'Pago fallido ✗'}
      </Text>
      <View style={{ marginTop: 20 }}>
        <Button title="Ir a Home" onPress={() => navigation.navigate('Home' as never)} />
      </View>
    </View>
  )

}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '600' },
  ok:   { color: '#22c55e' },
  fail: { color: '#ef4444' },
})
