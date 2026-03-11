type PriceCallback = (price: number, timestamp: number) => void;

class BTCPriceManager {
  private ws: WebSocket | null = null;
  private listeners: Set<PriceCallback> = new Set();
  private lastPrice: number = 0;
  private lastTimestamp: number = 0;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private isConnecting = false;

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) return;
    this.isConnecting = true;

    try {
      this.ws = new WebSocket("wss://ws-feed.exchange.coinbase.com");

      this.ws.onopen = () => {
        this.isConnecting = false;
        this.ws?.send(
          JSON.stringify({
            type: "subscribe",
            product_ids: ["BTC-USD"],
            channels: ["ticker"],
          })
        );
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "ticker" && data.price) {
            this.lastPrice = parseFloat(data.price);
            this.lastTimestamp = Date.now();
            this.listeners.forEach((cb) =>
              cb(this.lastPrice, this.lastTimestamp)
            );
          }
        } catch {
          // ignore parse errors
        }
      };

      this.ws.onclose = () => {
        this.isConnecting = false;
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.isConnecting = false;
        this.ws?.close();
      };
    } catch {
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) return;
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      if (this.listeners.size > 0) {
        this.connect();
      }
    }, 3000);
  }

  subscribe(callback: PriceCallback): () => void {
    this.listeners.add(callback);
    if (this.listeners.size === 1) {
      this.connect();
    }
    // Send last known price immediately
    if (this.lastPrice > 0) {
      callback(this.lastPrice, this.lastTimestamp);
    }
    return () => {
      this.listeners.delete(callback);
      if (this.listeners.size === 0) {
        this.disconnect();
      }
    };
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.ws?.close();
    this.ws = null;
  }

  getLastPrice() {
    return this.lastPrice;
  }
}

export const btcPriceManager = new BTCPriceManager();
