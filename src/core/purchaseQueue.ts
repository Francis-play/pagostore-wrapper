
export type QueueItem = {
  url: string
  id?: string
}

type WebViewRef = {
  injectJavaScript: (js: string) => void
}

class PurchaseQueue {

  private queue: QueueItem[] = []
  private running            = false
  private webview: WebViewRef | null = null
  private buyTimer: any      = null
  private waitingForResult   = false
  private currentUrl: string = ''

  attachWebView(ref: WebViewRef | null) { this.webview = ref }
  detachWebView() { this.webview = null }

  enqueue(item: QueueItem) {
    this.queue.push(item)
    this.process()
  }

  hasMore(): boolean {
    return this.queue.length > 0
  }

  private process() {
    if (this.running) return
    if (!this.webview) return
    if (this.queue.length === 0) return

    const item = this.queue.shift()
    if (!item) return

    this.running           = true
    this.waitingForResult  = false
    this.currentUrl        = item.url

    try {
      this.webview.injectJavaScript(
        `window.location.href = ${JSON.stringify(item.url)}; true;`
      )
    } catch {
      this.finishPurchase(false)
    }
  }

  /** Called by CheckoutScreen when injector sends READY_FOR_NEXT.
   *  If there are more items, reuse the current WebView session by
   *  navigating directly — faster than a full page reload. */
  onReadyForNext() {
    if (this.queue.length === 0) {
      // No more — let CheckoutScreen know processing is done
      this.running = false
      return false  // caller navigates to Result
    }

    const next = this.queue.shift()!
    this.currentUrl       = next.url
    this.waitingForResult = false

    // Navigate directly — session + cookies are already active
    try {
      this.webview?.injectJavaScript(
        `window.location.href = ${JSON.stringify(next.url)}; true;`
      )
    } catch {
      this.finishPurchase(false)
    }
    return true  // caller stays on CheckoutScreen
  }

  onWebViewMessage(event: any) {
    let msg: any
    try { msg = JSON.parse(event.nativeEvent.data) } catch { return }

    const { type, data } = msg

    if (type === 'NAV')         this.handleNav(data)
    if (type === 'EBANX_TOKEN') this.waitingForResult = true
  }

  private handleNav(url: string) {
    if (!this.running || !url) return

    if (url.includes('/buy'))    this.startBuyTimer()
    if (url.includes('/result')) this.finishPurchase(true)
  }

  private startBuyTimer() {
    if (this.buyTimer) clearTimeout(this.buyTimer)
    this.buyTimer = setTimeout(() => {
      if (!this.waitingForResult) this.finishPurchase(false)
    }, 4000)
  }

  private finishPurchase(success: boolean) {
    if (this.buyTimer) { clearTimeout(this.buyTimer); this.buyTimer = null }
    this.waitingForResult = false
    this.running          = false
    console.log('[QUEUE] finishPurchase:', success)
    setTimeout(() => this.process(), 1200)
  }
}

export const purchaseQueue = new PurchaseQueue()
