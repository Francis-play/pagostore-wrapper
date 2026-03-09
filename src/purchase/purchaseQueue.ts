import {humanDelay} from '../utils/delay';
import {buildBuyUrl} from '../utils/buildBuyUrl';

type Purchase = {
  app: string;
  channel: string;
  item: string;
};

class PurchaseQueue {
  private queue: Purchase[] = [];
  private running = false;
  private webview: any = null;

  attachWebView(ref: any) {
    this.webview = ref;
  }

  enqueue(purchase: Purchase) {
    this.queue.push(purchase);
    if (!this.running) {
      this.process();
    }
  }

  private async process() {
    if (this.queue.length === 0) {
      this.running = false;
      return;
    }

    this.running = true;
    const purchase = this.queue.shift();
    if (!purchase) return;
    const url = buildBuyUrl(purchase.app, purchase.channel, purchase.item);
    await humanDelay();
    console.log('comprando:', url);

    this.webview?.injectJavaScript(`
      window.location.href = "${url}"
    `);

    setTimeout(() => {
      this.process();
    }, 6000);
  }
}

export const purchaseQueue = new PurchaseQueue();
