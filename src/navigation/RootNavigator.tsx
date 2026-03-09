import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

import HomeScreen from '../screens/HomeScreen'
import PayScreen from '../screens/CheckoutScreen'

export type RootStackParamList = {
  Home: undefined
  Pay: undefined
}

const Stack = createNativeStackNavigator<RootStackParamList>()

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>

        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'Pago Helper' }}
        />

        <Stack.Screen
          name="Pay"
          component={PayScreen}
          options={{ title: 'Pagar' }}
        />

      </Stack.Navigator>
    </NavigationContainer>
  )
}