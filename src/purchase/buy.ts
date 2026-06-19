import { usePaymentStore } from '../store/usePaymentStore'

type BuyParams = {
  appId:     number
  channelId: number
  itemId:    number
  qty?:      number
  playerId:  string
  region:    string
  promo?:    string | null
  cvc:       string
}

export function buy(params: BuyParams) {
  const { add } = usePaymentStore.getState()
  const count = params.qty ?? 1

  for (let i = 0; i < count; i++) {
    add({
      playerId: params.playerId,
      itemId:   params.itemId,
      channel:  params.channelId,
      region:   params.region,
      promo:    params.promo ?? null,
      qty:      1,
      cvc:      params.cvc,
    })
  }
}
