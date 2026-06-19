import React, { useState, useEffect } from 'react'
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/RootNavigator'
import { Button } from '../components/Button'
import { colors, spacing, radii, fontSize, fontWeight } from '../theme/tokens'
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
        placeholderTextColor={colors.gray400}
      />
      <Button
        title={storedPin ? 'Entrar' : 'Guardar PIN'}
        onPress={onSubmit}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: spacing.xxl, backgroundColor: colors.white },
  title:     { fontSize: 20, fontWeight: fontWeight.semibold, marginBottom: spacing.lg, textAlign: 'center', color: colors.gray900 },
  input:     { borderWidth: 1, borderColor: colors.gray300, padding: spacing.md, marginBottom: spacing.lg, borderRadius: radii.sm, fontSize: 18, textAlign: 'center', letterSpacing: 8, color: colors.gray900 },
})
