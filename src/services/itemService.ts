type ItemResponse = {
  channels: {
    channel_id: number
    items: any[]
  }[]
}

export async function loadItems(
  appId:number,
  region:string,
  language:string="es"
){

  const params = new URLSearchParams({
    app_id: String(appId),
    packed_role_id: "0",
    region,
    language
  })

  const res = await fetch(
    `https://pagostore.garena.com/api/shop/apps/channels?${params}`
  )

  if(!res.ok){
    throw new Error("items request failed")
  }

  const data:ItemResponse = await res.json()

  return data.channels[0].items
}

