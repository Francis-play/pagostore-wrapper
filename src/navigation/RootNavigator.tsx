import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'

import PinScreen          from '../screens/PinScreen'
import HomeScreen         from '../screens/HomeScreen'
import ItemsScreen        from '../screens/ItemsScreen'
import CheckoutScreen     from '../screens/CheckoutScreen'
import ResultScreen       from '../screens/ResultScreen'
import BatchPaymentScreen from '../screens/BatchPaymentScreen'
import SettingsScreen     from '../screens/SettingsScreen'
import ItemCatalogScreen  from '../screens/ItemCatalogScreen'

export type RootStackParamList = {
  Pin:         undefined
  Home:        undefined
  Items: {
    itemId:        number
    channelId:     number
    diamonds:      number
    bonusDiamonds: number
    price:         number
    currency:      string
    currencySymbol: string
    region:        string
    qty:           number
    promo?:        string | null
  }
  Checkout:    { cvc: string }
  Result:      { ok: boolean }
  Batch:       undefined
  Settings:    undefined
  ItemCatalog: undefined
}

export type NavProp<T extends keyof RootStackParamList> =
  NativeStackNavigationProp<RootStackParamList, T>

const Stack = createNativeStackNavigator<RootStackParamList>()

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Pin">

        <Stack.Screen
          name="Pin"
          component={PinScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'PagoHelper', headerBackVisible: false }}
        />
        <Stack.Screen
          name="Items"
          component={ItemsScreen}
          options={{ title: 'Confirmar compra' }}
        />
        <Stack.Screen
          name="Checkout"
          component={CheckoutScreen}
          options={{ title: 'Procesando', headerBackVisible: false }}
        />
        <Stack.Screen
          name="Result"
          component={ResultScreen}
          options={{ title: 'Resultado', headerBackVisible: false }}
        />
        <Stack.Screen
          name="Batch"
          component={BatchPaymentScreen}
          options={{ title: 'Pagos en lote' }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: 'Ajustes' }}
        />
        <Stack.Screen
          name="ItemCatalog"
          component={ItemCatalogScreen}
          options={{ title: 'Catálogo de items' }}
        />

      </Stack.Navigator>
    </NavigationContainer>
  )
}
