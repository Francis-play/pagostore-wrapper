type QueueItem = {
  url: string
  id?: string
}

type WebViewRef = {
  injectJavaScript: (js: string) => void
}

class PurchaseQueue {

  private queue: QueueItem[] = []

  private running = false

  private webview: WebViewRef | null = null

  private waitingBuyResult = false

  private buyTimer: any = null

  attachWebView(ref: WebViewRef | null) {
    this.webview = ref
  }

  enqueue(item: QueueItem) {
    this.queue.push(item)
    this.process()
  }

  private process() {

    if (this.running) return
    if (!this.webview) return
    if (this.queue.length === 0) return

    const item = this.queue.shift()

    if (!item) return

    this.running = true

    const js = `
      window.location.href = "${item.url}";
      true;
    `

    this.webview.injectJavaScript(js)

  }

  /* ---------------- NAV EVENT ---------------- */

  onNav(url: string) {

    if (!this.running) return

    if (url.includes("/buy")) {

      this.waitingBuyResult = true

      this.startBuyTimer()

    }

    if (url.includes("/result")) {

      this.finishPurchase(true)

    }

  }

  /* ---------------- EBANX TOKEN ---------------- */

  onEbanxToken() {

    if (!this.running) return

    // solo nos interesa si estamos en buy
    if (!this.waitingBuyResult) return

    // aquí podrías extender lógica si quieres
  }

  /* ---------------- TIMER ---------------- */

  private startBuyTimer() {

    if (this.buyTimer) clearTimeout(this.buyTimer)

    this.buyTimer = setTimeout(() => {

      if (this.waitingBuyResult) {

        // RN debería mostrar WebView aquí
        // pero no finalizamos la cola aún

      }

    }, 4000)

  }

  /* ---------------- FINISH ---------------- */

  private finishPurchase(success: boolean) {

    this.running = false
    this.waitingBuyResult = false

    if (this.buyTimer) {
      clearTimeout(this.buyTimer)
      this.buyTimer = null
    }

    // delay humano antes del siguiente
    setTimeout(() => {
      this.process()
    }, 1200)

  }

}

export const purchaseQueue = new PurchaseQueue()