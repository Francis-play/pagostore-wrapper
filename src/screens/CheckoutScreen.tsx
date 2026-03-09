import React from 'react';
import {View, Text} from 'react-native';
import PersistentWebView from '../components/PersistentWebView';
import {useWebViewController} from '../webview/useWebViewController';

export default function CheckoutScreen() {
  const {handleMessage, showWebView} = useWebViewController();

  return (
    <View style={{flex: 1}}>
      {showWebView && <PersistentWebView onMessage={handleMessage} />}

      {!showWebView && <Text>Procesando pago...</Text>}
    </View>
  );
}
