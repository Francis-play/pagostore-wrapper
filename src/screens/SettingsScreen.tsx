import React from 'react';
import {View, Text, Button, StyleSheet} from 'react-native';
import {useNavigation} from '@react-navigation/native';

export default function SettingsScreen(){
  const navigation = useNavigation();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ajustes</Text>
      <Button title="Cerrar sesión" onPress={() => navigation.navigate('Pin')} />
    </View>
  )
}

const styles = StyleSheet.create({
  container:{flex:1,padding:12},
  title:{fontSize:18}
});
