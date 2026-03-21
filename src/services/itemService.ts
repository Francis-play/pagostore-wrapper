export async function loadItems(
  appId: number,
  region: string,
  language = 'es'
): Promise<any[]> {
  const params = new URLSearchParams({
    app_id:         String(appId),
    packed_role_id: '0',
    region,
    language,
  })

  const res = await fetch(
    `https://pagostore.garena.com/api/shop/apps/channels?${params}`
  )

  if (!res.ok) throw new Error(`loadItems failed: ${res.status}`)

  const data = await res.json()

  // Flatten all channels into a single item array
  const allItems: any[] = []
  for (const channel of data.channels ?? []) {
    for (const item of channel.items ?? []) {
      allItems.push(item)
    }
  }
  return allItems
}
