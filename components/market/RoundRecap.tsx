"use client";

import { Position } from "@/hooks/use-market";
import { useEffect, useState } from "react";

interface SettledPosition extends Position {
  won: boolean;
  pnl: number;
}

interface RoundRecapProps {
  roundId: number;
  threshold: number;
  resolutionPrice: number;
  winner: "YES" | "NO";
  settledPositions: SettledPosition[];
  onNextRound: () => void;
}

export default function RoundRecap({
  roundId,
  threshold,
  resolutionPrice,
  winner,
  settledPositions,
  onNextRound,
}: RoundRecapProps) {
  const [aiReview, setAiReview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const totalPnl = settledPositions.reduce((sum, p) => sum + p.pnl, 0);
  const totalWagers = settledPositions.reduce((sum, p) => sum + p.amount, 0);
  const wins = settledPositions.filter((p) => p.won).length;

  useEffect(() => {
    if (settledPositions.length === 0) {
      setAiReview("You didn't place any trades this round. Try entering a position next time — even a small one helps you learn!");
      setLoading(false);
      return;
    }

    const fetchReview = async () => {
      try {
        const positionsSummary = settledPositions.map((p) => ({
          side: p.isYes ? "YES" : "NO",
          amount: p.amount,
          entryOdds: Math.round(p.entryOdds * 100),
          entryTime: p.entryTime,
          won: p.won,
          pnl: p.pnl,
        }));

        const res = await fetch("/api/ai/review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            positions: positionsSummary,
            threshold,
            resolutionPrice,
            winner,
            totalPnl,
            totalWagers,
          }),
        });
        const data = await res.json();
        setAiReview(data.review);
      } catch {
        setAiReview("Unable to generate AI review right now.");
      } finally {
        setLoading(false);
      }
    };

    fetchReview();
  }, [settledPositions, threshold, resolutionPrice, winner, totalPnl, totalWagers]);

  return (
    <div className="space-y-4 py-2">
      {/* Result banner */}
      <div className={`rounded-xl p-4 text-center border ${
        totalPnl >= 0
          ? "bg-green-900/20 border-green-800/50"
          : "bg-red-900/20 border-red-800/50"
      }`}>
        <p className="text-xs text-gray-400 mb-1">Round {roundId} Complete</p>
        <p className="text-2xl font-bold font-mono">
          <span className={totalPnl >= 0 ? "text-green-400" : "text-red-400"}>
            {totalPnl >= 0 ? "+" : ""}{totalPnl} $DOJO
          </span>
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Resolved at ${resolutionPrice.toLocaleString()} · {winner} wins
        </p>
      </div>

      {/* Position recap */}
      {settledPositions.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-[10px] text-gray-500 uppercase tracking-wider">
            Your Trades ({wins}/{settledPositions.length} won)
          </h3>
          <div className="space-y-1.5">
            {settledPositions.map((pos) => (
              <div
                key={pos.id}
                className={`flex items-center justify-between p-2.5 rounded-lg border ${
                  pos.won
                    ? "bg-green-900/10 border-green-800/30"
                    : "bg-red-900/10 border-red-800/30"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${
                    pos.isYes ? "text-green-400" : "text-red-400"
                  }`}>
                    {pos.isYes ? "YES" : "NO"}
                  </span>
                  <span className="text-xs text-gray-400">
                    {pos.amount} $DOJO @ {Math.round(pos.entryOdds * 100)}¢
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium ${
                    pos.won ? "text-green-400" : "text-red-400"
                  }`}>
                    {pos.pnl >= 0 ? "+" : ""}{pos.pnl} $DOJO
                  </span>
                  <span className="text-[10px]">
                    {pos.won ? "✓" : "✗"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Review */}
      <div className="space-y-2">
        <h3 className="text-[10px] text-gray-500 uppercase tracking-wider">
          AI Coach Review
        </h3>
        <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-800/50">
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
              <span className="text-xs text-gray-400">Analyzing your trades...</span>
            </div>
          ) : (
            <div className="text-xs text-gray-300 leading-relaxed space-y-3">
              {aiReview?.split("\n\n").map((block, i) => {
                const trimmed = block.trim();
                if (trimmed.toLowerCase().startsWith("pros:")) {
                  const items = trimmed.split("\n").slice(1).map((l) => l.replace(/^[-•]\s*/, "").trim()).filter(Boolean);
                  return (
                    <div key={i}>
                      <p className="text-green-400 font-medium text-[10px] uppercase tracking-wider mb-1">Pros</p>
                      <ul className="space-y-1">
                        {items.map((item, j) => (
                          <li key={j} className="flex gap-1.5">
                            <span className="text-green-400 shrink-0">+</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                }
                if (trimmed.toLowerCase().startsWith("cons:")) {
                  const items = trimmed.split("\n").slice(1).map((l) => l.replace(/^[-•]\s*/, "").trim()).filter(Boolean);
                  return (
                    <div key={i}>
                      <p className="text-red-400 font-medium text-[10px] uppercase tracking-wider mb-1">Cons</p>
                      <ul className="space-y-1">
                        {items.map((item, j) => (
                          <li key={j} className="flex gap-1.5">
                            <span className="text-red-400 shrink-0">-</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                }
                return <p key={i}>{trimmed}</p>;
              })}
            </div>
          )}
        </div>
      </div>

      {/* Next Round button */}
      <button
        onClick={onNextRound}
        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl text-sm transition-all active:scale-[0.98]"
      >
        Start Next Round
      </button>
    </div>
  );
}
