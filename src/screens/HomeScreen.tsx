import React, {useEffect, useState, useRef} from 'react';
import {View, Text, Button, StyleSheet, FlatList, TouchableOpacity, Alert} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {paymentController} from '../core/paymentController';
import PersistentWebView from '../components/PersistentWebView';
import {buildBuyUrl} from '../utils/buildBuyUrl';
import itemService from '../services/itemService';

export default function HomeScreen(){
  const navigation = useNavigation();
  const webviewRef = useRef(null);
  const [items, setItems] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);

  useEffect(() => {
    paymentController.attachWebView(webviewRef.current);
    return () => paymentController.detachWebView();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await itemService.fetchChannels();
        setItems(res || []);
      } catch(e){}
    })();
  }, []);

  const onContinue = () => {
    if (!selected) {
      Alert.alert('Selecciona un item');
      return;
    }
    const url = buildBuyUrl(selected);
    paymentController.enqueuePurchase(url);
    navigation.navigate('Processing', { item: selected });
  };

  const renderItem = ({item}) => (
    <TouchableOpacity style={styles.item} onPress={()=>setSelected(item)}>
      <Text>{item.name || item.item_id || item.channel_id}</Text>
      <Text>{item.price || item.value}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={{flex:1}}>
      <PersistentWebView ref={webviewRef} />
      <View style={styles.container}>
        <Text style={styles.title}>Home - Items</Text>
        <FlatList data={items} keyExtractor={(i,idx)=>String(i.id||i.channel_id||idx)} renderItem={renderItem} />
        <View style={styles.footer}>
          <Button title="Agregar a lista" onPress={() => Alert.alert('Añadido (demo)')} />
          <Button title="Continuar" onPress={onContinue} />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container:{flex:1, padding:12},
  title:{fontSize:18, marginBottom:8},
  item:{padding:10, borderBottomWidth:1, borderColor:'#eee'},
  footer:{flexDirection:'row', justifyContent:'space-between', padding:12}
});
