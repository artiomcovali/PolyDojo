"use client";

import { useEffect, useRef, useState } from "react";
import { formatOdds } from "@/lib/odds";

interface OddsDisplayProps {
  yesOdds: number;
  noOdds: number;
  winner: "YES" | "NO" | null;
}

function useFlash(value: number): boolean {
  const [flash, setFlash] = useState(false);
  const prevRef = useRef(value);
  useEffect(() => {
    if (value !== prevRef.current) {
      prevRef.current = value;
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 130);
      return () => clearTimeout(t);
    }
  }, [value]);
  return flash;
}

export default function OddsDisplay({ yesOdds, noOdds, winner }: OddsDisplayProps) {
  const yesFlash = useFlash(yesOdds);
  const noFlash = useFlash(noOdds);

  return (
    <div className="flex gap-2">
      <div
        className={`flex-1 rounded-lg px-3 py-2 text-center transition-all ${
          winner === "YES"
            ? "bg-green-500/20 border border-green-500/50 ring-2 ring-green-500/30"
            : winner === "NO"
            ? "bg-gray-800/50 opacity-50"
            : "bg-green-500/10 border border-green-500/20"
        }`}
      >
        <div className="text-[9px] text-green-400/70 uppercase tracking-wider font-medium">
          Yes
        </div>
        <div
          className="text-lg font-bold text-green-400 font-mono leading-tight transition-all duration-200 ease-out"
          style={yesFlash ? { textShadow: "0 0 12px rgba(34,197,94,0.8)", transform: "scale(1.04)" } : { textShadow: "none", transform: "scale(1)" }}
        >
          {formatOdds(yesOdds)}
        </div>
      </div>
      <div
        className={`flex-1 rounded-lg px-3 py-2 text-center transition-all ${
          winner === "NO"
            ? "bg-red-500/20 border border-red-500/50 ring-2 ring-red-500/30"
            : winner === "YES"
            ? "bg-gray-800/50 opacity-50"
            : "bg-red-500/10 border border-red-500/20"
        }`}
      >
        <div className="text-[9px] text-red-400/70 uppercase tracking-wider font-medium">
          No
        </div>
        <div
          className="text-lg font-bold text-red-400 font-mono leading-tight transition-all duration-200 ease-out"
          style={noFlash ? { textShadow: "0 0 12px rgba(239,68,68,0.8)", transform: "scale(1.04)" } : { textShadow: "none", transform: "scale(1)" }}
        >
          {formatOdds(noOdds)}
        </div>
      </div>
    </div>
  );
}
