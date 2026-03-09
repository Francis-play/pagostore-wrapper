import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
  Alert,
} from 'react-native';
import {paymentController} from '../core/paymentController';
import {buildBuyUrl} from '../utils/buildBuyUrl';

export default function BatchPaymentScreen() {
  const [list, setList] = useState<any[]>([]);
  const [cvc, setCvc] = useState('');

  const onStart = async () => {
    if (!cvc) {
      Alert.alert('Ingrese CVC');
      return;
    }
    for (const item of list) {
      const url = buildBuyUrl(item);
      // enqueue purchases one by one; injector will prompt for CVC on page
      paymentController.enqueuePurchase(url);
      // small delay between enqueues to mimic human timing
      await new Promise(r => setTimeout(r, 800));
    }
    Alert.alert('Batch iniciado');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Batch Payments</Text>
      <TextInput
        value={cvc}
        onChangeText={setCvc}
        placeholder="CVC (se pedirá en cada pago)"
        keyboardType="number-pad"
        style={styles.input}
      />
      <Button title="Iniciar batch" onPress={onStart} />
      <FlatList
        data={list}
        keyExtractor={(i, idx) => String(i.id || idx)}
        renderItem={({item}) => <Text>{item.name}</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, padding: 12},
  title: {fontSize: 18, marginBottom: 8},
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 8,
    marginBottom: 12,
    borderRadius: 6,
  },
});
