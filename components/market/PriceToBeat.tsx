"use client";

import ScrollingNumber from "@/components/shared/ScrollingNumber";
import Image from "next/image";

interface PriceToBeatProps {
  currentPrice: number;
  threshold: number;
}

export default function PriceToBeat({ currentPrice, threshold }: PriceToBeatProps) {
  const diff = currentPrice - threshold;
  const isAbove = diff >= 0;
  const pctChange = threshold > 0 ? (diff / threshold) * 100 : 0;

  return (
    <div className="space-y-2">
      {/* Current Price — big display */}
      <div>
        <div className="text-[10px] text-gray-500 uppercase tracking-wider">
          Current Price
        </div>
        <div className="flex items-baseline gap-2">
          <ScrollingNumber
            value={`$${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            className="text-2xl font-bold font-mono text-white"
          />
          <span className={`text-xs font-medium ${isAbove ? "text-green-400" : "text-red-400"}`}>
            {isAbove ? "↗" : "↘"} {isAbove ? "+" : ""}{pctChange.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Price to Beat bar */}
      <div className={`flex items-center justify-between rounded-xl p-3 border ${
        isAbove
          ? "bg-yellow-500/5 border-yellow-500/20"
          : "bg-yellow-500/5 border-yellow-500/20"
      }`}>
        <div className="flex items-center gap-2">
          <Image src="/Assets/target.svg" alt="Target" width={18} height={18} />
          <div>
            <div className="text-[10px] text-yellow-500/80">Price to Beat</div>
            <div className="text-sm font-bold font-mono text-yellow-400">
              ${threshold.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${
            isAbove ? "bg-green-500/15" : "bg-red-500/15"
          }`}
        >
          <span className={`text-xs ${isAbove ? "text-green-400" : "text-red-400"}`}>
            {isAbove ? "↗" : "↘"}
          </span>
          <span className={`text-xs font-bold ${isAbove ? "text-green-400" : "text-red-400"}`}>
            {isAbove ? "UP" : "DOWN"}
          </span>
        </div>
      </div>

    </div>
  );
}
