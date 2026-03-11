"use client";

import { useEffect, useRef, useState } from "react";

const TIP_COST = 25;

interface AITipData {
  decision: "YES" | "NO";
  reason: string;
  timeLeft: number;
  context: {
    price: number;
    yesOdds: number;
    noOdds: number;
  };
}

interface AITipProps {
  price: number;
  threshold: number;
  secondsRemaining: number;
  yesOdds: number;
  isActive: boolean;
  balance: number;
  onPurchase: (cost: number) => void;
}

export default function AITip({
  price,
  threshold,
  secondsRemaining,
  yesOdds,
  isActive,
  balance,
  onPurchase,
}: AITipProps) {
  const [purchased, setPurchased] = useState(false);
  const [tipData, setTipData] = useState<AITipData | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const lastFetchTime = useRef(0);

  // Reset on new round
  useEffect(() => {
    setPurchased(false);
    setTipData(null);
    setFailed(false);
  }, [threshold]);

  const refund = () => {
    onPurchase(-TIP_COST); // negative cost = refund
    setPurchased(false);
    setFailed(false);
    setTipData(null);
  };

  const fetchTip = async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/ai/tip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price, threshold, secondsRemaining, yesOdds }),
      });
      const data = await res.json();
      if (data.error || !data.decision) return false;
      setTipData({ ...data, timeLeft: secondsRemaining });
      return true;
    } catch {
      return false;
    }
  };

  // Refresh AI tip every 15 seconds after purchase
  useEffect(() => {
    if (!purchased || failed || !isActive || price <= 0) return;
    const now = Date.now();
    if (now - lastFetchTime.current < 15000) return;
    lastFetchTime.current = now;
    fetchTip();
  }, [purchased, failed, price, threshold, secondsRemaining, yesOdds, isActive]);

  const handlePurchase = async () => {
    if (balance < TIP_COST) return;
    onPurchase(TIP_COST);
    setPurchased(true);
    setLoading(true);
    lastFetchTime.current = Date.now();

    const success = await fetchTip();
    if (!success) {
      setFailed(true);
    }
    setLoading(false);
  };

  if (!isActive) return null;

  if (failed) {
    return (
      <div className="w-full rounded-xl p-3 border border-red-500/20 bg-red-500/5 text-center space-y-2">
        <p className="text-xs text-red-400">Unable to generate AI tip right now.</p>
        <button
          onClick={refund}
          className="text-xs text-white bg-gray-700 hover:bg-gray-600 px-4 py-1.5 rounded-lg font-medium transition-colors"
        >
          Refund {TIP_COST} $DOJO
        </button>
      </div>
    );
  }

  if (!purchased) {
    return (
      <button
        onClick={handlePurchase}
        disabled={balance < TIP_COST}
        className={`w-full rounded-xl p-3 border border-dashed transition-all text-center ${
          balance >= TIP_COST
            ? "border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 cursor-pointer active:scale-[0.99]"
            : "border-gray-700/30 bg-gray-900/30 opacity-40 cursor-not-allowed"
        }`}
      >
        <div className="flex items-center justify-center gap-2">
          <span className="text-blue-400 text-sm">🤖</span>
          <span className="text-xs font-medium text-blue-400">
            Purchase AI Tip
          </span>
          <span className="text-[10px] bg-blue-500/15 text-blue-300 px-1.5 py-0.5 rounded font-mono">
            {TIP_COST} $DOJO
          </span>
        </div>
        {balance < TIP_COST && (
          <p className="text-[10px] text-gray-600 mt-1">Not enough $DOJO</p>
        )}
      </button>
    );
  }

  const decisionColor =
    tipData?.decision === "YES" ? "text-green-400" : "text-red-400";

  const decisionBg =
    tipData?.decision === "YES"
      ? "bg-green-500/10 border-green-500/20"
      : "bg-red-500/10 border-red-500/20";

  return (
    <div className={`rounded-xl p-3 border ${decisionBg}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">AI Tip</span>
        <span className="text-[10px] text-gray-600">-{TIP_COST} $DOJO</span>
      </div>
      {loading ? (
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-xs text-gray-400">Thinking...</span>
        </div>
      ) : tipData ? (
        <div className="space-y-2">
          {/* Context row */}
          <div className="flex gap-3 text-[10px] text-gray-500">
            <span>BTC ${tipData.context.price.toLocaleString()}</span>
            <span>YES {tipData.context.yesOdds}¢</span>
            <span>NO {tipData.context.noOdds}¢</span>
            <span className="ml-auto">@ :{String(tipData.timeLeft).padStart(2, "0")}</span>
          </div>
          {/* Decision */}
          <div className="flex items-center gap-2">
            <span className={`text-sm font-bold ${decisionColor}`}>
              {tipData.decision === "YES" ? "▲ BUY YES" : "▼ BUY NO"}
            </span>
          </div>
          {/* Reason */}
          <p className="text-xs text-gray-300 leading-relaxed">{tipData.reason}</p>
        </div>
      ) : null}
    </div>
  );
}
