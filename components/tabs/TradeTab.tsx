'use client';

import { useMarket, Position } from '@/hooks/use-market';
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

export default function TradeTab({ presets, soundEffects, saveRound }: TradeTabProps) {
  const { price, market, positions, placeBet, sellPosition, startNewRound } = useMarket();
  // TODO: Replace localStorage balance with onchain $DOJO token balance when contract is deployed
  const [balance, setBalance] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("polydojo_balance");
      return saved !== null ? parseFloat(saved) : 10000;
    }
    return 10000;
  });
  useEffect(() => {
    localStorage.setItem("polydojo_balance", String(balance));
  }, [balance]);
  const [priceHistory, setPriceHistory] = useState<{ time: number; price: number }[]>([]);
  const lastHistoryTime = useRef(0);
  const [settledPositions, setSettledPositions] = useState<SettledPosition[]>([]);
  const [showRecap, setShowRecap] = useState(false);
  // Track all positions placed during the round (including sold ones)
  const roundPositionsRef = useRef<Position[]>([]);
  const soldPnlRef = useRef<Map<number, number>>(new Map());

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

  // Reset chart on new round
  useEffect(() => {
    if (market.roundId > 0 && !market.isResolved) {
      setPriceHistory([]);
      roundPositionsRef.current = [];
      soldPnlRef.current = new Map();
    }
  }, [market.roundId, market.isResolved]);

  // Track positions as they're placed
  useEffect(() => {
    for (const pos of positions) {
      if (!roundPositionsRef.current.find((p) => p.id === pos.id)) {
        roundPositionsRef.current.push({ ...pos });
      }
    }
  }, [positions]);

  // Handle bet results on resolution
  const resolvedRef = useRef(false);
  useEffect(() => {
    if (market.isResolved && market.winner && !resolvedRef.current) {
      resolvedRef.current = true;

      // Settle held positions
      let netPnl = 0;
      const settled: SettledPosition[] = [];

      for (const pos of roundPositionsRef.current) {
        // Check if it was sold during the round
        if (soldPnlRef.current.has(pos.id)) {
          const salePnl = soldPnlRef.current.get(pos.id)!;
          settled.push({ ...pos, won: salePnl >= 0, pnl: salePnl });
          continue;
        }
        // Held to resolution
        const won =
          (market.winner === 'YES' && pos.isYes) || (market.winner === 'NO' && !pos.isYes);
        const pnl = won ? pos.amount : -pos.amount;
        netPnl += pnl;
        settled.push({ ...pos, won, pnl });
      }

      const totalWagered = settled.reduce((sum, p) => sum + p.amount, 0);
      const totalPnl = settled.reduce((sum, p) => sum + p.pnl, 0);

      setBalance((prev) => Math.max(0, prev + netPnl));
      setSettledPositions(settled);
      setShowRecap(true);

      // Save to database
      if (saveRound && market.resolutionPrice) {
        saveRound({
          round_number: market.roundId,
          threshold: market.threshold,
          resolution_price: market.resolutionPrice,
          winner: market.winner,
          total_pnl: totalPnl,
          total_wagered: totalWagered,
          positions: settled.map((p) => ({
            side: p.isYes ? "YES" : "NO",
            amount: p.amount,
            entryOdds: Math.round(p.entryOdds * 100),
            won: p.won,
            pnl: p.pnl,
          })),
        });
      }
    }
    if (!market.isResolved) {
      resolvedRef.current = false;
    }
  }, [market.isResolved, market.winner]);

  const handleBuy = (isYes: boolean, amount: number) => {
    if (amount > balance) return;
    setBalance((prev) => prev - amount);
    placeBet(isYes, amount);
    if (soundEffects && buySoundRef.current) {
      buySoundRef.current.currentTime = 0;
      buySoundRef.current.play().catch(() => {});
    }
  };

  const sellSoundRef = useRef<HTMLAudioElement | null>(null);
  const buySoundRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    sellSoundRef.current = new Audio('/SellDing.wav');
    buySoundRef.current = new Audio('/ConfirmDing.wav');
  }, []);

  const handleSell = (positionId: number) => {
    const pos = positions.find((p) => p.id === positionId);
    if (!pos) return;
    const currentOdds = pos.isYes ? market.yesOdds : market.noOdds;
    const shares = pos.amount / pos.entryOdds;
    const saleValue = Math.round(shares * currentOdds);
    const pnl = saleValue - pos.amount;
    soldPnlRef.current.set(positionId, pnl);
    setBalance((prev) => prev + saleValue);
    sellPosition(positionId);
    if (soundEffects && sellSoundRef.current) {
      sellSoundRef.current.currentTime = 0;
      sellSoundRef.current.play().catch(() => {});
    }
  };

  const [loadingNewMarket, setLoadingNewMarket] = useState(false);

  const handleNextRound = async () => {
    setShowRecap(false);
    setSettledPositions([]);
    setLoadingNewMarket(true);
    await startNewRound();
    // Show loading for at least 2 seconds so user sees the new market info
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

  // Loading new market transition
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

  // Show recap after round ends
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

  return (
    <div className="space-y-3 pb-4">
      {/* Header */}
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

      {/* Chart */}
      <BTCChart price={price} threshold={market.threshold} priceHistory={priceHistory} />

      {/* Timer + Odds */}
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <MarketTimer secondsRemaining={market.secondsRemaining} isResolved={market.isResolved} />
        </div>
        <div className="flex-1">
          <OddsDisplay yesOdds={market.yesOdds} noOdds={market.noOdds} winner={market.winner} />
        </div>
      </div>

      {/* Price to Beat */}
      {market.isActive && <PriceToBeat currentPrice={price} threshold={market.threshold} />}

      {/* Trade Buttons — always visible when market is active */}
      <TradeButtons
        yesOdds={market.yesOdds}
        noOdds={market.noOdds}
        balance={balance}
        isActive={market.isActive}
        hasPosition={false}
        presets={presets}
        onBuy={handleBuy}
      />

      {/* Open Positions */}
      {positions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] text-gray-500 uppercase tracking-wider">
              Your Positions ({positions.length})
            </h3>
            {!market.isResolved &&
              positions.length > 1 &&
              (() => {
                const totalCost = positions.reduce((sum, pos) => sum + pos.amount, 0);
                const totalSaleValue = positions.reduce((sum, pos) => {
                  const currentOdds = pos.isYes ? market.yesOdds : market.noOdds;
                  const shares = pos.amount / pos.entryOdds;
                  return sum + Math.round(shares * currentOdds);
                }, 0);
                const pnl = totalSaleValue - totalCost;
                const isProfit = pnl >= 0;
                return (
                  <button
                    onClick={() => {
                      for (const pos of positions) {
                        handleSell(pos.id);
                      }
                    }}
                    className={`text-sm text-white px-4 py-1.5 rounded-lg font-medium transition-colors ${
                      isProfit
                        ? 'bg-green-600/80 hover:bg-green-500'
                        : 'bg-red-600/80 hover:bg-red-500'
                    }`}
                  >
                    Sell All ({isProfit ? '+' : ''}
                    {pnl} $DOJO)
                  </button>
                );
              })()}
          </div>
          {positions.map((pos) => (
            <PositionCard
              key={pos.id}
              position={pos}
              currentYesOdds={market.yesOdds}
              isResolved={market.isResolved}
              winner={market.winner}
              onSell={() => handleSell(pos.id)}
            />
          ))}
        </div>
      )}

      {/* AI Tip (paid) */}
      <AITip
        price={price}
        threshold={market.threshold}
        secondsRemaining={market.secondsRemaining}
        yesOdds={market.yesOdds}
        isActive={market.isActive}
        balance={balance}
        onPurchase={(cost) => setBalance((prev) => prev - cost)}
      />

      {/* Market Info */}
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
          This market will resolve to &quot;Up&quot; if the Bitcoin price at the end of the time range is greater than or equal to the price at the beginning of that range. Otherwise, it will resolve to &quot;Down&quot;.
        </p>
      </div>

      {/* Attribution */}
      <p className="text-[9px] text-gray-600 text-center pt-1">
        Live market data pulled directly from Polymarket
      </p>
    </div>
  );
}
