import {buildBuyUrl} from '../utils/buildBuyUrl';
import {usePaymentStore} from '../store/paymentStore';

type Card = {
  name: string;
  number: string;
  expiry: string;
  email: string;
  promo?: string;
};

export default class PaymentEngine {
  private webview: any;
  private card: Card;
  private running = false;

  constructor(webview: any, card: Card) {
    this.webview = webview;
    this.card = card;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.loop();
  }

  stop() {
    this.running = false;
  }

  async loop() {
    const store = usePaymentStore.getState();
    while (this.running) {
      const item = store.next();
      if (!item) {
        await this.sleep(1000);
        continue;
      }
      await this.process(item);
    }
  }

  async process(item: any) {
    const url = buildBuyUrl(100067, item.channel, item.item);
    this.navigate(url);
    await this.sleep(this.random(900, 1400));
  }

  navigate(url: string) {
    this.webview.injectJavaScript(`window.location.href="${url}"`);
  }

  onWebMessage(msg: string) {
    if (msg === 'EBANX_TOKEN') {
      setTimeout(() => {
        this.webview
          .injectJavaScript(`if(!location.pathname.includes("/result")){
       window.ReactNativeWebView.postMessage("PAYMENT_PROBLEM")
     }`);
      }, 4000);
    }

    if (msg === 'PAY_SUCCESS') {
      console.log('payment ok');
    }

    if (msg === 'PAYMENT_PROBLEM') {
      console.log('payment failed');
    }
  }

  sleep(ms: number) {
    return new Promise(r => setTimeout(()=>r(), ms));
  }

  random(min: number, max: number) {
    return Math.floor(Math.random() * (max - min) + min);
  }
}
