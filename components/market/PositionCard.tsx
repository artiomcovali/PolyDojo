"use client";

import { calculatePnL, formatOdds } from "@/lib/odds";
import { Position } from "@/hooks/use-market";

interface PositionCardProps {
  position: Position;
  currentYesOdds: number;
  isResolved: boolean;
  winner: "YES" | "NO" | null;
  onSell: () => void;
}

export default function PositionCard({
  position,
  currentYesOdds,
  isResolved,
  winner,
  onSell,
}: PositionCardProps) {
  const pnl = calculatePnL(
    position.entryOdds,
    position.isYes ? currentYesOdds : 1 - currentYesOdds,
    position.amount,
    position.isYes
  );
  const pnlColor = pnl >= 0 ? "text-green-400" : "text-red-400";
  const won = winner
    ? (winner === "YES" && position.isYes) ||
      (winner === "NO" && !position.isYes)
    : null;

  return (
    <div
      className={`rounded-xl p-3 border transition-all ${
        isResolved
          ? won
            ? "bg-green-500/10 border-green-500/30"
            : "bg-red-500/10 border-red-500/30"
          : "bg-gray-800/50 border-gray-700/50"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded ${
              position.isYes
                ? "bg-green-500/20 text-green-400"
                : "bg-red-500/20 text-red-400"
            }`}
          >
            {position.isYes ? "YES" : "NO"}
          </span>
          <span className="text-xs text-gray-400">
            Entry: {formatOdds(position.entryOdds)}
          </span>
        </div>
        <span className={`text-sm font-bold font-mono ${pnlColor}`}>
          {pnl >= 0 ? "+" : ""}
          {pnl.toFixed(0)} $DOJO
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {position.amount} $DOJO wagered
        </span>
        {isResolved ? (
          <span
            className={`text-xs font-bold ${
              won ? "text-green-400" : "text-red-400"
            }`}
          >
            {won ? "WON" : "LOST"}
          </span>
        ) : (
          <button
            onClick={onSell}
            className="text-xs bg-yellow-600/80 hover:bg-yellow-500 text-white px-3 py-1 rounded-lg font-medium transition-colors"
          >
            Sell @ {formatOdds(position.isYes ? currentYesOdds : 1 - currentYesOdds)}
          </button>
        )}
      </div>
    </div>
  );
}
