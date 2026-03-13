import { NextResponse } from "next/server";

// GET /api/polymarket — live 5-min BTC market from Polymarket with real-time odds
export async function GET() {
  try {
    // Calculate 5-minute window timestamps
    const now = Math.floor(Date.now() / 1000);
    const currentWindowStart = Math.floor(now / 300) * 300;
    const prevWindowStart = currentWindowStart - 300;
    const nextWindowStart = currentWindowStart + 300;

    const slugs = [
      `btc-updown-5m-${currentWindowStart}`,
      `btc-updown-5m-${nextWindowStart}`,
      `btc-updown-5m-${prevWindowStart}`,
    ];

    // 1) Find the active market from Gamma API
    let btcMarket: Record<string, unknown> | null = null;

    for (const slug of slugs) {
      try {
        const res = await fetch(
          `https://gamma-api.polymarket.com/markets?slug=${slug}`,
          { cache: "no-store" }
        );
        if (!res.ok) continue;
        const markets = await res.json();
        if (Array.isArray(markets) && markets.length > 0) {
          const m = markets[0];
          const endTime = new Date(m.endDate as string).getTime();
          if (!m.closed && endTime > Date.now()) {
            btcMarket = m;
            break;
          }
        }
      } catch {
        continue;
      }
    }

    if (!btcMarket) {
      return NextResponse.json({ error: "No active 5-min BTC market found" }, { status: 404 });
    }

    // 2) Get live odds from CLOB API (real-time, unlike Gamma's stale prices)
    const clobTokenIds: string[] =
      typeof btcMarket.clobTokenIds === "string"
        ? JSON.parse(btcMarket.clobTokenIds as string)
        : (btcMarket.clobTokenIds as string[]);
    const outcomes: string[] =
      typeof btcMarket.outcomes === "string"
        ? JSON.parse(btcMarket.outcomes as string)
        : (btcMarket.outcomes as string[]);

    const upIndex = outcomes.findIndex((o) => o.toLowerCase() === "up");
    const downIndex = outcomes.findIndex((o) => o.toLowerCase() === "down");
    const upTokenId = clobTokenIds[upIndex];
    const downTokenId = clobTokenIds[downIndex];

    // Fetch live prices in parallel
    const [upRes, downRes] = await Promise.all([
      fetch(`https://clob.polymarket.com/price?token_id=${upTokenId}&side=BUY`, { cache: "no-store" }),
      fetch(`https://clob.polymarket.com/price?token_id=${downTokenId}&side=BUY`, { cache: "no-store" }),
    ]);

    let yesOdds = 0.5;
    let noOdds = 0.5;
    if (upRes.ok && downRes.ok) {
      const upData = await upRes.json();
      const downData = await downRes.json();
      yesOdds = parseFloat(upData.price || "0.5");
      noOdds = parseFloat(downData.price || "0.5");
    }

    // 3) Get the threshold from Coinbase Exchange 1-min candle at window start
    // Polymarket uses Chainlink BTC/USD which isn't available via REST,
    // so Coinbase is the closest approximation (~$10-20 difference on ~$70k)
    const slugParts = (btcMarket.slug as string).split("-");
    const windowStartSec = parseInt(slugParts[slugParts.length - 1], 10);
    const windowStartMs = windowStartSec * 1000;

    let threshold = 0;
    try {
      const startISO = new Date(windowStartMs).toISOString();
      const endISO = new Date(windowStartMs + 60000).toISOString();
      const cbRes = await fetch(
        `https://api.exchange.coinbase.com/products/BTC-USD/candles?granularity=60&start=${startISO}&end=${endISO}`,
        { cache: "no-store" }
      );
      if (cbRes.ok) {
        const candles = await cbRes.json();
        // Coinbase candles: [time, low, high, open, close, volume]
        // Find the candle matching our window start
        if (candles.length > 0) {
          // Sort by time ascending, take the one closest to window start
          candles.sort((a: number[], b: number[]) => a[0] - b[0]);
          threshold = candles[0][3]; // open price
        }
      }
    } catch {
      // ignore
    }

    // Fallback: if candle not available yet, use Coinbase spot price
    if (threshold === 0) {
      try {
        const spotRes = await fetch("https://api.coinbase.com/v2/prices/BTC-USD/spot", { cache: "no-store" });
        if (spotRes.ok) {
          const spotData = await spotRes.json();
          threshold = parseFloat(spotData.data.amount);
        }
      } catch {
        // client will use its own BTC price as last resort
      }
    }

    const endTime = new Date(btcMarket.endDate as string).getTime();
    const secondsRemaining = Math.max(0, Math.round((endTime - Date.now()) / 1000));

    return NextResponse.json({
      slug: btcMarket.slug,
      question: btcMarket.question,
      yesOdds: Math.round(yesOdds * 100) / 100,
      noOdds: Math.round(noOdds * 100) / 100,
      secondsRemaining,
      endDate: btcMarket.endDate,
      windowStart: windowStartMs,
      threshold,
      volume: btcMarket.volume,
      liquidity: btcMarket.liquidity,
    });
  } catch (err) {
    console.error("Polymarket API error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
