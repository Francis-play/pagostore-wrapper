import React from 'react';
import {View, Text, Button} from 'react-native';
import {buy} from '../purchase/buy';

export default function ItemsScreen({route, navigation}: any) {
  const {item} = route.params;

  function handleBuy() {
    buy({
      app: '100067',
      channel: String(item.channelId),
      item: String(item.itemId),
    });

    navigation.navigate('Checkout');
  }

  return (
    <View>
      <Text>Comprar {item.diamonds}</Text>

      <Button title="Comprar" onPress={handleBuy} />
    </View>
  );
}
