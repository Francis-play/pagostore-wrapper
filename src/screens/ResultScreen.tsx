import React from "react"
import { View, Text } from "react-native"

export default function ResultScreen({ route }: any) {

  const { ok } = route.params

  return (
    <View>
      <Text>
        {ok ? "Pago correcto" : "Pago fallido"}
      </Text>
    </View>
  )
}