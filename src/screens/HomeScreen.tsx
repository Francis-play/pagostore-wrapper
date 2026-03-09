import React, { useEffect, useState, useRef } from "react"
import { View, Text, FlatList, TouchableOpacity } from "react-native"
import { loadItems } from "../services/itemService"
import { mapItems } from "../services/mapItems"
import { purchaseQueue } from "../core/purchaseQueue"

export default function HomeScreen({ navigation }: any) {
  const [items,setItems] = useState<any[]>([])
  const webRef = useRef<WebView>(null)

useEffect(() => {
  purchaseQueue.attachWebView(webRef.current)
  return () => {
    purchaseQueue.attachWebView(null)
  }
}, [])

  useEffect(()=>{
    async function load(){
      const data = await loadItems(100067,"DO")
      setItems(mapItems(data))
    }
    load()
  },[])

  return (
    <View style={{flex:1}}>
      <FlatList
        data={items}
        keyExtractor={(item)=>String(item.itemId)}
        renderItem={({item})=>(
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("Items", { item })
            }
          >
            <Text>
              {item.diamonds} diamonds - {item.price}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  )
}