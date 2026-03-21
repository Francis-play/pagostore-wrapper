import React, { useState, useEffect } from 'react'
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/RootNavigator'
import SecureStore from '../core/secureStorePlaceholder'

type Nav = NativeStackNavigationProp<RootStackParamList, 'Pin'>

export default function PinScreen() {

  const navigation = useNavigation<Nav>()
  const [pin, setPin]           = useState('')
  const [storedPin, setStoredPin] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const p = await SecureStore.getPin()
        if (mounted) setStoredPin(p)
      } catch {}
    })()
    return () => { mounted = false }
  }, [])

  const onSubmit = () => {
    if (!pin.trim()) {
      Alert.alert('Ingresa un PIN')
      return
    }
    if (!storedPin) {
      SecureStore.setPin(pin)
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] })
      return
    }
    if (pin === storedPin) {
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] })
    } else {
      Alert.alert('PIN incorrecto')
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {storedPin ? 'Ingresa tu PIN' : 'Configura tu PIN'}
      </Text>
      <TextInput
        value={pin}
        onChangeText={setPin}
        secureTextEntry
        keyboardType="number-pad"
        maxLength={6}
        style={styles.input}
        placeholder="••••"
      />
      <Button
        title={storedPin ? 'Entrar' : 'Guardar PIN'}
        onPress={onSubmit}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  title:     { fontSize: 20, fontWeight: '600', marginBottom: 16, textAlign: 'center' },
  input:     { borderWidth: 1, borderColor: '#d1d5db', padding: 12, marginBottom: 16, borderRadius: 8, fontSize: 18, textAlign: 'center', letterSpacing: 8 },
})
