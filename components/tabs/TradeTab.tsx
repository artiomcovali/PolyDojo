'use client';

import { useMarket, Position } from '@/hooks/use-market';
import { useDojoBalance } from '@/hooks/use-dojo-balance';
import { useOnchainBet } from '@/hooks/use-onchain-bet';
import { usePlaceBet, PlaceBetStep } from '@/hooks/use-place-bet';
import AITip from '@/components/market/AITip';
import BTCChart from '@/components/market/BTCChart';
import MarketTimer from '@/components/market/MarketTimer';
import OddsDisplay from '@/components/market/OddsDisplay';
import PositionCard from '@/components/market/PositionCard';
import PriceToBeat from '@/components/market/PriceToBeat';
import RoundRecap from '@/components/market/RoundRecap';
import TradeButtons from '@/components/market/TradeButtons';
import { useEffect, useRef, useState } from 'react';

interface SettledPosition extends Position {
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

function pendingLabel(step: PlaceBetStep): string {
  switch (step) {
    case "ensuring-round":
      return "Creating round...";
    case "approving":
      return "Approving $DOJO...";
    case "placing":
      return "Placing bet...";
    case "recording":
      return "Saving bet...";
    default:
      return "Confirming...";
  }
}

export default function TradeTab({ presets, soundEffects, walletAddress, saveRound }: TradeTabProps) {
  const { price, market, startNewRound } = useMarket();
  const { onchainBalance } = useDojoBalance(walletAddress);

  // Onchain round id is the current 5-minute Unix window start
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

  const { bet, round, refetch } = useOnchainBet(walletAddress, onchainRoundId, 8000);
  const { place, step: placeStep, reset: resetPlace } = usePlaceBet(walletAddress);

  const [priceHistory, setPriceHistory] = useState<{ time: number; price: number }[]>([]);
  const lastHistoryTime = useRef(0);

  const [settledPositions, setSettledPositions] = useState<SettledPosition[]>([]);
  const [showRecap, setShowRecap] = useState(false);
  const balanceAtBetRef = useRef<number | null>(null);
  const resolvedRef = useRef(false);

  // Record price history every 500ms for smooth charting
  useEffect(() => {
    if (price <= 0) return;
    const now = Date.now();
    if (now - lastHistoryTime.current < 500) return;
    lastHistoryTime.current = now;
    setPriceHistory((prev) => {
      const updated = [...prev, { time: now, price }];
      return updated.slice(-600);
    });
  }, [price]);

  // Reset chart/recap on new round
  useEffect(() => {
    if (market.roundId > 0 && !market.isResolved) {
      setPriceHistory([]);
      resolvedRef.current = false;
      setShowRecap(false);
      setSettledPositions([]);
      balanceAtBetRef.current = null;
      resetPlace();
    }
  }, [market.roundId, market.isResolved, resetPlace]);

  // Trigger onchain resolution when timer hits 0 (cron will also run, this is a nudge)
  const resolvePokedRef = useRef<number>(0);
  useEffect(() => {
    if (!market.isResolved) return;
    if (resolvePokedRef.current === onchainRoundId) return;
    resolvePokedRef.current = onchainRoundId;
    fetch("/api/rounds/resolve", { method: "POST" }).catch(() => {});
  }, [market.isResolved, onchainRoundId]);

  // Handle settlement once the chain confirms resolution
  useEffect(() => {
    if (!market.isResolved) return;
    if (resolvedRef.current) return;
    if (!bet) {
      // No bet placed — show recap immediately using Polymarket winner
      if (market.winner && market.resolutionPrice !== null) {
        resolvedRef.current = true;
        setSettledPositions([]);
        setShowRecap(true);
      }
      return;
    }
    if (!round || !round.resolved) return; // wait for chain

    resolvedRef.current = true;
    const chainYesWins = BigInt(round.resolutionPrice) >= BigInt(round.threshold);
    const won = bet.isYes === chainYesWins;

    const preBalance = balanceAtBetRef.current;
    const postBalance = onchainBalance;
    let pnl: number;
    if (preBalance != null && postBalance != null) {
      pnl = Math.round(postBalance - preBalance);
    } else {
      pnl = won ? bet.amountFmt : -bet.amountFmt;
    }

    const settled: SettledPosition = {
      id: 1,
      isYes: bet.isYes,
      amount: Math.round(bet.amountFmt),
      entryOdds: bet.oddsAtEntryBps / 10000,
      entryTime: 0,
      won,
      pnl,
    };
    setSettledPositions([settled]);
    setShowRecap(true);

    if (saveRound && market.resolutionPrice != null) {
      saveRound({
        round_number: market.roundId,
        threshold: market.threshold,
        resolution_price: market.resolutionPrice,
        winner: chainYesWins ? "YES" : "NO",
        total_pnl: pnl,
        total_wagered: settled.amount,
        positions: [
          {
            side: settled.isYes ? "YES" : "NO",
            amount: settled.amount,
            entryOdds: Math.round(settled.entryOdds * 100),
            won,
            pnl,
          },
        ],
      });
    }
  }, [market.isResolved, market.winner, market.resolutionPrice, market.roundId, market.threshold, bet, round, onchainBalance, saveRound]);

  const buySoundRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    buySoundRef.current = new Audio('/ConfirmDing.wav');
  }, []);

  const [buyError, setBuyError] = useState<string | null>(null);
  const isPlacing = placeStep !== "idle" && placeStep !== "done" && placeStep !== "error";

  const handleBuy = async (isYes: boolean, amount: number) => {
    setBuyError(null);
    if (onchainBalance == null || amount > onchainBalance) return;
    balanceAtBetRef.current = onchainBalance;
    const oddsAtEntryBps = Math.round((isYes ? market.yesOdds : market.noOdds) * 10000);
    const result = await place({ isYes, amount, oddsAtEntryBps });
    if (!result.ok) {
      setBuyError(result.error || "Failed to place bet");
      balanceAtBetRef.current = null;
      return;
    }
    if (soundEffects && buySoundRef.current) {
      buySoundRef.current.currentTime = 0;
      buySoundRef.current.play().catch(() => {});
    }
    await refetch();
  };

  const [loadingNewMarket, setLoadingNewMarket] = useState(false);

  const handleNextRound = async () => {
    setShowRecap(false);
    setSettledPositions([]);
    resolvedRef.current = false;
    balanceAtBetRef.current = null;
    resetPlace();
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

  // After Polymarket timer ends but before chain resolution, show a waiting state
  if (market.isResolved && bet && (!round || !round.resolved) && !showRecap) {
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
  const hasPosition = !!bet?.exists;

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
          <OddsDisplay yesOdds={market.yesOdds} noOdds={market.noOdds} winner={market.winner} />
        </div>
      </div>

      {market.isActive && <PriceToBeat currentPrice={price} threshold={market.threshold} />}

      <TradeButtons
        yesOdds={market.yesOdds}
        noOdds={market.noOdds}
        balance={displayBalance}
        isActive={market.isActive}
        hasPosition={hasPosition}
        presets={presets}
        pending={isPlacing}
        pendingLabel={pendingLabel(placeStep)}
        onBuy={handleBuy}
      />

      {buyError && (
        <div className="text-[10px] text-red-400 bg-red-950/40 border border-red-900/50 rounded-lg px-3 py-2">
          Bet failed: {buyError}
        </div>
      )}

      {bet?.exists && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] text-gray-500 uppercase tracking-wider">
              Your Position
            </h3>
            <span className="text-[10px] text-gray-500">Locked until resolution</span>
          </div>
          <PositionCard
            position={{
              id: 1,
              isYes: bet.isYes,
              amount: Math.round(bet.amountFmt),
              entryOdds: bet.oddsAtEntryBps / 10000,
              entryTime: 0,
            }}
            currentYesOdds={market.yesOdds}
            isResolved={market.isResolved}
            winner={market.winner}
            onSell={() => {}}
            hideSell
          />
        </div>
      )}

      <AITip
        price={price}
        threshold={market.threshold}
        secondsRemaining={market.secondsRemaining}
        yesOdds={market.yesOdds}
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

      <p className="text-[9px] text-gray-600 text-center pt-1">
        Live market data pulled directly from Polymarket
      </p>
    </div>
  );
}
