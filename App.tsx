import React from "react"
import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"

import HomeScreen from "./src/screens/HomeScreen"
import ItemsScreen from "./src/screens/ItemsScreen"
import CheckoutScreen from "./src/screens/CheckoutScreen"
import PersistentWebView from "./src/components/PersistentWebView"

const Stack = createNativeStackNavigator()

export default function App(){

  return (

    <NavigationContainer>

      <Stack.Navigator>

        <Stack.Screen
          name="Home"
          component={HomeScreen}
        />

        <Stack.Screen
          name="Items"
          component={ItemsScreen}
        />

        <Stack.Screen
          name="Checkout"
          component={CheckoutScreen}
        />

      </Stack.Navigator>

    </NavigationContainer>

  )
}

<PersistentWebView
  onMessage={handleMessage}
  style={{ width:0, height:0 }}
/>