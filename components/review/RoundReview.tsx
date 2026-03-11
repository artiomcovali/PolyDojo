"use client";

import { RoundScore } from "@/lib/scoring";

interface RoundReviewProps {
  score: RoundScore;
  won: boolean;
  pnl: number;
  review: string;
  onClose: () => void;
}

export default function RoundReview({
  score,
  won,
  pnl,
  review,
  onClose,
}: RoundReviewProps) {
  const categories = [
    { label: "Entry Timing", value: score.entryTiming, max: 25 },
    { label: "Exit Timing", value: score.exitTiming, max: 25 },
    { label: "Position Sizing", value: score.positionSizing, max: 25 },
    { label: "Outcome", value: score.outcome, max: 25 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#111] rounded-t-2xl w-full max-w-lg p-4 pb-8 space-y-4 animate-slide-up">
        {/* Header */}
        <div className="text-center">
          <div className="text-3xl mb-1">{won ? "🎉" : "😤"}</div>
          <h3 className="text-lg font-bold text-white">
            {won ? "Round Won!" : "Round Lost"}
          </h3>
          <p
            className={`text-sm font-mono font-bold ${
              pnl >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {pnl >= 0 ? "+" : ""}
            {pnl.toFixed(0)} $DOJO
          </p>
        </div>

        {/* Score Breakdown */}
        <div className="space-y-2">
          {categories.map((cat) => (
            <div key={cat.label} className="flex items-center gap-3">
              <span className="text-xs text-gray-400 w-28">{cat.label}</span>
              <div className="flex-1 bg-gray-800 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    cat.value >= 20
                      ? "bg-green-500"
                      : cat.value >= 15
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${(cat.value / cat.max) * 100}%` }}
                />
              </div>
              <span className="text-xs font-mono text-white w-8 text-right">
                {cat.value}/{cat.max}
              </span>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="flex items-center justify-between bg-gray-800/50 rounded-xl p-3">
          <span className="text-sm text-gray-300">Total Score</span>
          <div className="text-right">
            <span className="text-xl font-bold text-white">
              {score.finalScore}
            </span>
            {score.multiplier > 1 && (
              <span className="text-xs text-yellow-400 ml-1">
                x{score.multiplier}
              </span>
            )}
            {score.bonusPoints > 0 && (
              <span className="text-xs text-purple-400 ml-1">
                +{score.bonusPoints}
              </span>
            )}
          </div>
        </div>

        {/* AI Review */}
        {review && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
            <div className="text-xs font-bold text-blue-400 mb-1">
              AI Review
            </div>
            <p className="text-xs text-blue-200/70 leading-relaxed">
              {review}
            </p>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full bg-white text-black font-bold py-3 rounded-xl text-sm hover:bg-gray-200 transition-colors"
        >
          Next Round
        </button>
      </div>
    </div>
  );
}
