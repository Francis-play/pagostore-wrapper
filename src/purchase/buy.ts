import { purchaseQueue } from '../core/purchaseQueue'
import { buildBuyUrl }   from '../utils/buildBuyUrl'

type BuyParams = {
  appId:     number
  channelId: number
  itemId:    number
  qty?:      number
}

export function buy(params: BuyParams) {
  const url = buildBuyUrl(params.appId, params.channelId, params.itemId)
  const count = params.qty ?? 1

  for (let i = 0; i < count; i++) {
    purchaseQueue.enqueue({ url, id: `${params.itemId}_${i}` })
  }
}
