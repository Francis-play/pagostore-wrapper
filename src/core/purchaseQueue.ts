type QueueItem = {
  url: string
}

class PurchaseQueue {

  private queue: QueueItem[] = []
  private running = false
  private webview: any = null

  private buyTimer: any = null
  private waitingForResult = false

  attachWebView(ref: any) {
    this.webview = ref
  }

  detachWebView() {
    this.webview = null
  }

  enqueue(url: string) {
    this.queue.push({ url })
    this.process()
  }

  private process() {

    if (this.running) return
    if (!this.webview) return
    if (this.queue.length === 0) return

    const item = this.queue.shift()

    if (!item) return

    this.running = true
    this.waitingForResult = false

    const script = `
      window.location.href = "${item.url}";
      true;
    `

    try {
      this.webview.injectJavaScript(script)
    } catch (e) {
      this.finish()
    }

  }

  onWebViewMessage(event: any) {

    let msg

    try {
      msg = JSON.parse(event.nativeEvent.data)
    } catch {
      return
    }

    const { type, data } = msg

    if (type === "NAV") {
      this.handleNav(data)
    }

    if (type === "EBANX_TOKEN") {
      this.handleEbanxToken()
    }

  }

  private handleNav(url: string) {

    if (!url) return

    if (url.includes("/buy")) {

      this.startBuyTimer()

    }

    if (url.includes("/result")) {

      this.finish()

    }

  }

  private handleEbanxToken() {

    this.waitingForResult = true

  }

  private startBuyTimer() {

    if (this.buyTimer) {
      clearTimeout(this.buyTimer)
    }

    this.buyTimer = setTimeout(() => {

      if (!this.waitingForResult) {

        // algo falló antes de iniciar el pago
        this.finish()

      }

      // si hay token entonces seguimos esperando /result

    }, 4000)

  }

  private finish() {

    if (this.buyTimer) {
      clearTimeout(this.buyTimer)
      this.buyTimer = null
    }

    this.waitingForResult = false
    this.running = false

    setTimeout(() => {
      this.process()
    }, 1200)

  }

}

export const purchaseQueue = new PurchaseQueue()
