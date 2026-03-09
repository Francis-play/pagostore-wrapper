import {purchaseQueue} from './purchaseQueue';

type BuyParams = {
  app: string;
  channel: string;
  item: string;
};

export function buy(params: BuyParams) {
  purchaseQueue.enqueue({
    app: params.app,
    channel: params.channel,
    item: params.item,
  });
}
