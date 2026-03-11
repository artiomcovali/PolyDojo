"use client";

interface PriceToBeatProps {
  currentPrice: number;
  threshold: number;
}

export default function PriceToBeat({ currentPrice, threshold }: PriceToBeatProps) {
  const diff = currentPrice - threshold;
  const isAbove = diff >= 0;
  const absDiff = Math.abs(diff);

  return (
    <div className="bg-gray-800/40 border border-gray-700/40 rounded-xl p-3">
      <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">
        Price to Beat
      </div>
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold font-mono text-white">
          ${threshold.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${
            isAbove ? "bg-green-500/15" : "bg-red-500/15"
          }`}
        >
          <span className={`text-sm ${isAbove ? "text-green-400" : "text-red-400"}`}>
            {isAbove ? "▲" : "▼"}
          </span>
          <div className="text-right">
            <span
              className={`text-xs font-bold font-mono block leading-none ${
                isAbove ? "text-green-400" : "text-red-400"
              }`}
            >
              {isAbove ? "+" : "-"}${absDiff.toFixed(2)}
            </span>
            <span
              className={`text-[10px] block leading-none mt-0.5 ${
                isAbove ? "text-green-400/70" : "text-red-400/70"
              }`}
            >
              {isAbove ? "ABOVE" : "BELOW"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
