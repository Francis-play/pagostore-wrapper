import React, {useEffect} from 'react';
import {View, Text, StyleSheet, Button} from 'react-native';
import {useRoute, useNavigation} from '@react-navigation/native';

export default function ProcessingScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const item = route.params?.item;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Espere...</Text>
      <Text style={styles.subtitle}>{item?.name || 'Procesando pago'}</Text>
      <Button
        title="Mostrar WebView"
        onPress={() => navigation.navigate('Result')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  title: {fontSize: 20, marginBottom: 8},
  subtitle: {fontSize: 14, color: '#666'},
});
