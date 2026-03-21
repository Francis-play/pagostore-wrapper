export type StoreItem = {
  itemId: number
  channelId: number
  diamonds: number
  bonusDiamonds: number    // promo.total_promo_amount
  price: number            // currency_amount
  originalPrice: number    // original_currency_amount
  currency: string         // "CLP", "ARS", "MXN", etc.
  currencySymbol: string   // "CLP$ %.2f"
  image: string
  region: string
  enabled: boolean         // user-controlled in ItemCatalogScreen
}

export function mapItems(items: any[], region: string): StoreItem[] {
  return items.map(i => ({
    itemId:         i.item_id,
    channelId:      i.channel_id,
    diamonds:       i.app_point_amount,
    bonusDiamonds:  i.promo?.total_promo_amount ?? 0,
    price:          i.currency_amount,
    originalPrice:  i.original_currency_amount ?? i.currency_amount,
    currency:       i.currency ?? '',
    currencySymbol: i.currency_symbol ?? '',
    image:          i.image ?? '',
    region,
    enabled: true,
  }))
}

/** Format a price using the currencySymbol pattern from the API.
 *  Pattern: "CLP$ %.2f"  →  replace %.2f with formatted number */
export function formatPrice(amount: number, symbol: string): string {
  if (!symbol) return String(amount)
  return symbol.replace('%.2f', amount.toLocaleString('es-419', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }))
}
