"use client";

import { formatOdds } from "@/lib/odds";

interface OddsDisplayProps {
  yesOdds: number;
  noOdds: number;
  winner: "YES" | "NO" | null;
}

export default function OddsDisplay({ yesOdds, noOdds, winner }: OddsDisplayProps) {
  return (
    <div className="flex gap-3">
      <div
        className={`flex-1 rounded-xl p-3 text-center transition-all ${
          winner === "YES"
            ? "bg-green-500/20 border border-green-500/50 ring-2 ring-green-500/30"
            : winner === "NO"
            ? "bg-gray-800/50 opacity-50"
            : "bg-green-500/10 border border-green-500/20"
        }`}
      >
        <div className="text-[10px] text-green-400/70 uppercase tracking-wider font-medium">
          Yes
        </div>
        <div className="text-2xl font-bold text-green-400 font-mono">
          {formatOdds(yesOdds)}
        </div>
      </div>
      <div
        className={`flex-1 rounded-xl p-3 text-center transition-all ${
          winner === "NO"
            ? "bg-red-500/20 border border-red-500/50 ring-2 ring-red-500/30"
            : winner === "YES"
            ? "bg-gray-800/50 opacity-50"
            : "bg-red-500/10 border border-red-500/20"
        }`}
      >
        <div className="text-[10px] text-red-400/70 uppercase tracking-wider font-medium">
          No
        </div>
        <div className="text-2xl font-bold text-red-400 font-mono">
          {formatOdds(noOdds)}
        </div>
      </div>
    </div>
  );
}
