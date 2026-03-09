import React, {useState, useEffect} from 'react';
import {View, Text, TextInput, Button, StyleSheet, Alert} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import SecureStore from '../core/secureStorePlaceholder';

export default function PinScreen() {
  const navigation = useNavigation();
  const [pin, setPin] = useState('');
  const [storedPin, setStoredPin] = useState<string | null>(null);

  useEffect(() => {
    // placeholder for reading stored pin
    let mounted = true;
    (async () => {
      try {
        const p = await SecureStore.getPin();
        if(mounted) setStoredPin(p);
      } catch(e){}
    })();
    return () => { mounted = false; };
  }, []);

  const onSubmit = () => {
    if (!storedPin) {
      // first time set
      SecureStore.setPin(pin);
      navigation.reset({index:0, routes:[{name:'Home'}]});
      return;
    }
    if (pin === storedPin) {
      navigation.reset({index:0, routes:[{name:'Home'}]});
    } else {
      Alert.alert('PIN incorrecto');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ingresa PIN</Text>
      <TextInput
        value={pin}
        onChangeText={setPin}
        secureTextEntry
        keyboardType="number-pad"
        style={styles.input}
        placeholder="PIN"
      />
      <Button title={storedPin ? 'Entrar' : 'Configurar PIN'} onPress={onSubmit} />
    </View>
  )
}

const styles = StyleSheet.create({
  container:{flex:1, justifyContent:'center', padding:16},
  title:{fontSize:20, marginBottom:12},
  input:{borderWidth:1, borderColor:'#ccc', padding:8, marginBottom:12, borderRadius:6}
});
