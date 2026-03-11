"use client";

import { useMarket, Position } from "@/hooks/use-market";
import AITip from "@/components/market/AITip";
import BTCChart from "@/components/market/BTCChart";
import MarketTimer from "@/components/market/MarketTimer";
import OddsDisplay from "@/components/market/OddsDisplay";
import PositionCard from "@/components/market/PositionCard";
import PriceToBeat from "@/components/market/PriceToBeat";
import RoundRecap from "@/components/market/RoundRecap";
import TradeButtons from "@/components/market/TradeButtons";
import DojoBalance from "@/components/shared/DojoBalance";
import { useEffect, useRef, useState } from "react";

interface SettledPosition extends Position {
  won: boolean;
  pnl: number;
}

interface TradeTabProps {
  presets: number[];
}

export default function TradeTab({ presets }: TradeTabProps) {
  const { price, market, positions, placeBet, sellPosition, startNewRound } = useMarket();
  const [balance, setBalance] = useState(1000);
  const [priceHistory, setPriceHistory] = useState<
    { time: number; price: number }[]
  >([]);
  const lastHistoryTime = useRef(0);
  const [settledPositions, setSettledPositions] = useState<SettledPosition[]>([]);
  const [showRecap, setShowRecap] = useState(false);
  // Track all positions placed during the round (including sold ones)
  const roundPositionsRef = useRef<Position[]>([]);
  const soldPnlRef = useRef<Map<number, number>>(new Map());

  // Record price history every 2 seconds
  useEffect(() => {
    if (price <= 0) return;
    const now = Date.now();
    if (now - lastHistoryTime.current < 2000) return;
    lastHistoryTime.current = now;
    setPriceHistory((prev) => {
      const updated = [...prev, { time: now, price }];
      return updated.slice(-150);
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
          (market.winner === "YES" && pos.isYes) ||
          (market.winner === "NO" && !pos.isYes);
        const pnl = won ? pos.amount : -pos.amount;
        netPnl += pnl;
        settled.push({ ...pos, won, pnl });
      }

      setBalance((prev) => Math.max(0, prev + netPnl));
      setSettledPositions(settled);
      setShowRecap(true);
    }
    if (!market.isResolved) {
      resolvedRef.current = false;
    }
  }, [market.isResolved, market.winner]);

  const handleBuy = (isYes: boolean, amount: number) => {
    if (amount > balance) return;
    setBalance((prev) => prev - amount);
    placeBet(isYes, amount);
  };

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
  };

  const handleNextRound = () => {
    setShowRecap(false);
    setSettledPositions([]);
    startNewRound(price);
  };

  if (price <= 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin text-2xl mb-2">📡</div>
          <p className="text-gray-400 text-sm">Connecting to BTC price feed...</p>
        </div>
      </div>
    );
  }

  // Show recap after round ends
  if (showRecap && market.isResolved && market.winner && market.resolutionPrice) {
    return (
      <div className="space-y-3 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">Round Recap</h2>
            <p className="text-[10px] text-gray-500">
              BTC vs ${market.threshold.toLocaleString()} threshold
            </p>
          </div>
          <DojoBalance balance={balance} />
        </div>
        <RoundRecap
          roundId={market.roundId}
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
          <h2 className="text-sm font-bold text-white">BTC 1-Min Market</h2>
          <p className="text-[10px] text-gray-500">
            Will BTC be above ${market.threshold.toLocaleString()} at close?
          </p>
        </div>
        <DojoBalance balance={balance} />
      </div>

      {/* Chart */}
      <BTCChart
        price={price}
        threshold={market.threshold}
        priceHistory={priceHistory}
      />

      {/* Timer + Odds */}
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <MarketTimer
            secondsRemaining={market.secondsRemaining}
            isResolved={market.isResolved}
          />
        </div>
        <div className="flex-1">
          <OddsDisplay
            yesOdds={market.yesOdds}
            noOdds={market.noOdds}
            winner={market.winner}
          />
        </div>
      </div>

      {/* Price to Beat */}
      {market.isActive && (
        <PriceToBeat currentPrice={price} threshold={market.threshold} />
      )}

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
            {!market.isResolved && positions.length > 1 && (() => {
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
                      ? "bg-green-600/80 hover:bg-green-500"
                      : "bg-red-600/80 hover:bg-red-500"
                  }`}
                >
                  Sell All ({isProfit ? "+" : ""}{pnl} $DOJO)
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
    </div>
  );
}
