'use client';

import { useMarket, Position as MarketPosition } from '@/hooks/use-market';
import { useDojoBalance } from '@/hooks/use-dojo-balance';
import { usePosition } from '@/hooks/use-position';
import AITip from '@/components/market/AITip';
import BTCChart from '@/components/market/BTCChart';
import MarketTimer from '@/components/market/MarketTimer';
import OddsDisplay from '@/components/market/OddsDisplay';
import PositionCard from '@/components/market/PositionCard';
import PriceToBeat from '@/components/market/PriceToBeat';
import RoundRecap from '@/components/market/RoundRecap';
import TradeButtons from '@/components/market/TradeButtons';
import { useEffect, useRef, useState } from 'react';

interface SettledPosition extends MarketPosition {
  won: boolean;
  pnl: number;
}

interface TradeTabProps {
  presets: number[];
  soundEffects: boolean;
  walletAddress: string | null;
  saveRound?: (data: {
    round_number: number;
    threshold: number;
    resolution_price: number;
    winner: "YES" | "NO";
    total_pnl: number;
    total_wagered: number;
    positions: unknown[];
    ai_review?: string;
  }) => Promise<void>;
}

const WINDOW_SECONDS = 300;

export default function TradeTab({ presets, soundEffects, walletAddress, saveRound }: TradeTabProps) {
  const { price, market, startNewRound } = useMarket();
  const { onchainBalance, refetch: refetchBalance } = useDojoBalance(walletAddress);

  const [onchainRoundId, setOnchainRoundId] = useState<number>(() =>
    Math.floor(Date.now() / 1000 / WINDOW_SECONDS) * WINDOW_SECONDS
  );
  useEffect(() => {
    const tick = () => {
      const id = Math.floor(Date.now() / 1000 / WINDOW_SECONDS) * WINDOW_SECONDS;
      setOnchainRoundId((prev) => (prev === id ? prev : id));
    };
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  // Ensure round exists onchain the first time user visits a new window
  const ensuredRef = useRef<number>(0);
  useEffect(() => {
    if (ensuredRef.current === onchainRoundId) return;
    ensuredRef.current = onchainRoundId;
    fetch("/api/rounds/ensure", { method: "POST" }).catch(() => {});
  }, [onchainRoundId]);

  const { position, pool, realizedDojo, setPosition, withdraw } = usePosition(
    walletAddress,
    onchainRoundId,
    3000
  );

  const [priceHistory, setPriceHistory] = useState<{ time: number; price: number }[]>([]);
  const lastHistoryTime = useRef(0);

  const [settledPositions, setSettledPositions] = useState<SettledPosition[]>([]);
  const [showRecap, setShowRecap] = useState(false);
  const balanceAtBetRef = useRef<number | null>(null);
  const resolvedRef = useRef(false);

  // Freeze the latest position + realized P&L while the round is still live,
  // so at resolution we can read the real pre-settlement state — by the time
  // `market.isResolved` fires, the settlement cron may have already zeroed
  // the bet row (or `onchainRoundId` may have ticked to the next window),
  // making `position` read null. Without this, won rounds show "no trades."
  const lastPositionRef = useRef<typeof position>(null);
  const lastRealizedRef = useRef<number>(0);
  useEffect(() => {
    if (market.isResolved) return;
    lastPositionRef.current = position;
    lastRealizedRef.current = realizedDojo;
  }, [position, realizedDojo, market.isResolved]);

  useEffect(() => {
    if (price <= 0) return;
    const now = Date.now();
    if (now - lastHistoryTime.current < 500) return;
    lastHistoryTime.current = now;
    setPriceHistory((prev) => [...prev, { time: now, price }].slice(-600));
  }, [price]);

  // Reset per-round UI state
  useEffect(() => {
    if (market.roundId > 0 && !market.isResolved) {
      setPriceHistory([]);
      resolvedRef.current = false;
      setShowRecap(false);
      setSettledPositions([]);
      balanceAtBetRef.current = null;
      lastPositionRef.current = null;
      lastRealizedRef.current = 0;
    }
  }, [market.roundId, market.isResolved]);

  // Nudge the resolve cron when the timer hits 0. Because there's a small
  // grace window before a round is eligible to be settled (for Chainlink to
  // publish a fresh price), we retry the poke until the cron reports the
  // round as resolved.
  const resolvePokedRef = useRef<number>(0);
  useEffect(() => {
    if (!market.isResolved) return;
    if (resolvePokedRef.current === onchainRoundId) return;
    resolvePokedRef.current = onchainRoundId;

    let cancelled = false;
    const tryResolve = async (attempt: number) => {
      try {
        const res = await fetch("/api/rounds/resolve", { method: "POST" });
        const data = await res.json().catch(() => null);
        console.log(`[resolve attempt ${attempt + 1}] status=${res.status}`, data);
        if (!cancelled && data?.ok && Array.isArray(data.resolved) && data.resolved.length > 0) {
          return true;
        }
      } catch (err) {
        console.log(`[resolve attempt ${attempt + 1}] fetch threw:`, err);
      }
      return false;
    };

    (async () => {
      for (let i = 0; i < 12 && !cancelled; i++) {
        const done = await tryResolve(i);
        if (done) return;
        await new Promise((r) => setTimeout(r, 3000));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [market.isResolved, onchainRoundId]);

  // When the round wraps up, build the recap from the final off-chain position.
  useEffect(() => {
    if (!market.isResolved || resolvedRef.current) return;
    if (!market.winner || market.resolutionPrice === null) return;

    // Prefer the live position, but fall back to the last snapshot we saw
    // this round — by the time this fires, the settlement cron may have
    // already zeroed the bet row (making `position` null even though the
    // user actually traded).
    const snapshot = position ?? lastPositionRef.current;
    const realizedSnapshot = realizedDojo !== 0 ? realizedDojo : lastRealizedRef.current;

    // No trades all round — just show a no-bet recap
    if (!snapshot && realizedSnapshot === 0) {
      resolvedRef.current = true;
      setSettledPositions([]);
      setShowRecap(true);
      return;
    }

    resolvedRef.current = true;
    const chainYesWins = market.winner === "YES";

    const settledList: SettledPosition[] = [];

    // Realized-only recap row (user sold mid-round and never rebought)
    if (!snapshot && realizedSnapshot !== 0) {
      settledList.push({
        id: 1,
        isYes: true,
        amount: 0,
        entryOdds: 0.5,
        entryTime: 0,
        won: realizedSnapshot > 0,
        pnl: Math.round(realizedSnapshot),
      });
    } else if (snapshot) {
      const won = snapshot.isYes === chainYesWins;
      const entryBpsClamped = Math.max(100, Math.min(9900, snapshot.entryOddsBps || 5000));
      const entryProb = entryBpsClamped / 10000;
      let pnl: number;
      if (won) {
        pnl = Math.round(snapshot.amountFmt * (1 - entryProb) / entryProb);
      } else {
        pnl = -Math.round(snapshot.amountFmt);
      }
      pnl += Math.round(realizedSnapshot);

      settledList.push({
        id: 1,
        isYes: snapshot.isYes,
        amount: Math.round(snapshot.amountFmt),
        entryOdds: entryProb,
        entryTime: 0,
        won,
        pnl,
      });
    }

    setSettledPositions(settledList);
    setShowRecap(true);
    const pnl = settledList.reduce((s, p) => s + p.pnl, 0);

    // Refresh onchain balance a few times to pick up the settle tx
    const refreshes = [2000, 6000, 12000];
    refreshes.forEach((ms) => setTimeout(() => refetchBalance(), ms));

    if (saveRound && settledList.length > 0) {
      const first = settledList[0];
      saveRound({
        round_number: market.roundId,
        threshold: market.threshold,
        resolution_price: market.resolutionPrice,
        winner: market.winner,
        total_pnl: pnl,
        total_wagered: first.amount,
        positions: [
          {
            side: first.isYes ? "YES" : "NO",
            amount: first.amount,
            won: first.won,
            pnl: first.pnl,
          },
        ],
      });
    }
  }, [
    market.isResolved,
    market.winner,
    market.resolutionPrice,
    market.roundId,
    market.threshold,
    position,
    realizedDojo,
    saveRound,
    refetchBalance,
  ]);

  const buySoundRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    buySoundRef.current = new Audio('/ConfirmDing.wav');
  }, []);

  const [buyError, setBuyError] = useState<string | null>(null);

  // New-model click: same side = add to stake, other side = flip (replace stake)
  const handleBuy = async (isYes: boolean, amount: number) => {
    setBuyError(null);
    if (onchainBalance == null) return;
    const currentStake = position?.amountFmt ?? 0;
    const currentSide = position?.isYes;

    // Entry odds (bps) for the side being bought, from Polymarket feed.
    const sideOddsBps = Math.max(
      100,
      Math.min(9900, Math.round((isYes ? market.yesOdds : market.noOdds) * 10000))
    );

    let newAmount: number;
    let newOddsBps: number;
    if (currentSide === undefined) {
      newAmount = amount;
      newOddsBps = sideOddsBps;
    } else if (currentSide === isYes) {
      // Add to same side: weighted-average entry odds by stake
      newAmount = currentStake + amount;
      const prevBps = position?.entryOddsBps ?? sideOddsBps;
      newOddsBps = Math.round(
        (prevBps * currentStake + sideOddsBps * amount) / (currentStake + amount)
      );
    } else {
      // Flip: new side, new entry odds
      newAmount = amount;
      newOddsBps = sideOddsBps;
    }
    if (newAmount > onchainBalance) {
      setBuyError(`Max ${Math.floor(onchainBalance)} $DOJO`);
      return;
    }
    balanceAtBetRef.current = onchainBalance;
    const res = await setPosition(isYes, newAmount, newOddsBps);
    if (!res.ok) {
      setBuyError(res.error || "Failed");
      return;
    }
    if (soundEffects && buySoundRef.current) {
      buySoundRef.current.currentTime = 0;
      buySoundRef.current.play().catch(() => {});
    }
  };

  const handleWithdraw = async () => {
    setBuyError(null);
    const yesBps = Math.max(
      100,
      Math.min(9900, Math.round(market.yesOdds * 10000))
    );
    const res = await withdraw(yesBps);
    if (!res.ok) setBuyError(res.error || "Failed");
  };

  const [loadingNewMarket, setLoadingNewMarket] = useState(false);

  const handleNextRound = async () => {
    setShowRecap(false);
    setSettledPositions([]);
    resolvedRef.current = false;
    balanceAtBetRef.current = null;
    setLoadingNewMarket(true);
    await startNewRound();
    setTimeout(() => setLoadingNewMarket(false), 2000);
  };

  if (price <= 0) {
    return (
      <div className="flex flex-col items-center justify-center h-72 gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-2 border-yellow-500/20 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border-2 border-yellow-500/40 border-t-yellow-500 animate-spin" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg">₿</span>
          </div>
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-medium text-white">Fetching live BTC data</p>
          <p className="text-[10px] text-gray-500">Connecting to Polymarket feed...</p>
        </div>
      </div>
    );
  }

  if (loadingNewMarket) {
    return (
      <div className="flex flex-col items-center justify-center h-72 gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-2 border-yellow-500/20 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border-2 border-yellow-500/40 border-t-yellow-500 animate-spin" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg">₿</span>
          </div>
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-medium text-white">Loading new live market</p>
          <p className="text-[10px] text-gray-500">
            {market.question || "Fetching next 5-min window..."}
          </p>
        </div>
      </div>
    );
  }

  if (market.isResolved && position && !showRecap) {
    return (
      <div className="flex flex-col items-center justify-center h-72 gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-blue-500/40 border-t-blue-500 animate-spin" />
        <div className="text-center space-y-1">
          <p className="text-sm font-medium text-white">Settling round onchain</p>
          <p className="text-[10px] text-gray-500">
            Chainlink BTC price vs ${market.threshold.toLocaleString()} threshold...
          </p>
        </div>
      </div>
    );
  }

  if (showRecap && market.isResolved && market.winner && market.resolutionPrice !== null) {
    return (
      <div className="space-y-3 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">Round Recap</h2>
            <p className="text-[10px] text-gray-500">
              BTC vs ${market.threshold.toLocaleString()} threshold
            </p>
          </div>
        </div>
        <RoundRecap
          roundId={market.roundId}
          question={market.question}
          threshold={market.threshold}
          resolutionPrice={market.resolutionPrice}
          winner={market.winner}
          settledPositions={settledPositions}
          onNextRound={handleNextRound}
        />
      </div>
    );
  }

  const displayBalance = onchainBalance ?? 0;

  // Fixed-odds-at-entry model: live display uses Polymarket-derived odds.
  const yesOdds = market.yesOdds;
  const noOdds = market.noOdds;
  const positionEntryOdds = position
    ? (position.entryOddsBps || 5000) / 10000
    : yesOdds;

  return (
    <div className="space-y-3 pb-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-white">
            {market.question || "BTC 5-Min Market"}
          </h2>
          <p className="text-[10px] text-gray-500">
            Will BTC close above ${market.threshold.toLocaleString()}?
          </p>
        </div>
      </div>

      <BTCChart price={price} threshold={market.threshold} priceHistory={priceHistory} />

      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <MarketTimer secondsRemaining={market.secondsRemaining} isResolved={market.isResolved} />
        </div>
        <div className="flex-1">
          <OddsDisplay yesOdds={yesOdds} noOdds={noOdds} winner={market.winner} />
        </div>
      </div>

      {market.isActive && <PriceToBeat currentPrice={price} threshold={market.threshold} />}

      {/* Always allow trading during an active round — position is mutable */}
      <TradeButtons
        yesOdds={yesOdds}
        noOdds={noOdds}
        balance={displayBalance}
        isActive={market.isActive}
        hasPosition={false}
        presets={presets}
        onBuy={handleBuy}
      />

      {buyError && (
        <div className="text-[10px] text-red-400 bg-red-950/40 border border-red-900/50 rounded-lg px-3 py-2">
          {buyError}
        </div>
      )}

      {position && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] text-gray-500 uppercase tracking-wider">
              Your Position
            </h3>
            {market.isActive && (
              <button
                onClick={handleWithdraw}
                className="text-[10px] text-yellow-400 hover:text-yellow-300 font-medium"
              >
                Sell All
              </button>
            )}
          </div>
          <PositionCard
            position={{
              id: 1,
              isYes: position.isYes,
              amount: Math.round(position.amountFmt),
              entryOdds: positionEntryOdds,
              entryTime: 0,
            }}
            currentYesOdds={yesOdds}
            isResolved={market.isResolved}
            winner={market.winner}
            onSell={handleWithdraw}
          />
        </div>
      )}

      <AITip
        price={price}
        threshold={market.threshold}
        secondsRemaining={market.secondsRemaining}
        yesOdds={yesOdds}
        isActive={market.isActive}
        balance={displayBalance}
        onPurchase={() => {}}
      />

      <div className="bg-gray-800/30 rounded-xl border border-gray-800/50 p-3 space-y-2">
        <div className="text-xs font-medium text-white">
          {market.question || "Bitcoin Up or Down"}
        </div>
        <div className="flex gap-6">
          <div>
            <div className="text-[10px] text-gray-500">Volume</div>
            <div className="text-xs font-mono text-white">
              ${parseFloat(market.volume || "0").toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-gray-500">Liquidity</div>
            <div className="text-xs font-mono text-white">
              ${parseFloat(market.liquidity || "0").toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>
        <p className="text-[9px] text-gray-600 leading-relaxed">
          Odds + threshold come from Polymarket. Your $DOJO bet is settled onchain by a Chainlink BTC/USD feed at round end.
        </p>
      </div>
    </div>
  );
}
