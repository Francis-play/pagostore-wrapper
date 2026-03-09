import {purchaseQueue} from './purchaseQueue';

/**
 * Minimal PaymentController that coordinates purchases and the persistent WebView.
 * It intentionally keeps responsibilities small: attach/detach webview, enqueue purchases,
 * and provide a thin wrapper for onMessage to forward injector events.
 */

class PaymentController {
  private webview: any = null;

  attachWebView(ref: any) {
    this.webview = ref;
    purchaseQueue.attachWebView(ref);
  }

  detachWebView() {
    purchaseQueue.detachWebView();
    this.webview = null;
  }

  enqueuePurchase(url: string) {
    purchaseQueue.enqueue(url);
  }

  onWebViewMessage(event: any) {
    // Forward to purchaseQueue for handling NAV / EBANX_TOKEN
    purchaseQueue.onWebViewMessage(event);
  }
}

export const paymentController = new PaymentController();
