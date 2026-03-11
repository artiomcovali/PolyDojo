"use client";

import { formatOdds } from "@/lib/odds";
import { useRef, useState } from "react";

interface TradeButtonsProps {
  yesOdds: number;
  noOdds: number;
  balance: number;
  isActive: boolean;
  hasPosition: boolean;
  presets: number[];
  onBuy: (isYes: boolean, amount: number) => void;
}

export default function TradeButtons({
  yesOdds,
  noOdds,
  balance,
  isActive,
  hasPosition,
  presets,
  onBuy,
}: TradeButtonsProps) {
  const [amount, setAmount] = useState(presets[1] ?? presets[0] ?? 100);
  const [customActive, setCustomActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!isActive || hasPosition) return null;

  const handleCustomClick = () => {
    setCustomActive(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val > 0) {
      setAmount(val);
    } else if (e.target.value === "") {
      setAmount(0);
    }
  };

  const handleCustomBlur = () => {
    if (amount <= 0) {
      setAmount(100);
      setCustomActive(false);
    }
  };

  const handlePresetClick = (preset: number) => {
    setCustomActive(false);
    setAmount(preset);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400">Bet:</span>
        <div className="flex gap-1.5 flex-1">
          {presets.map((preset) => (
            <button
              key={preset}
              onClick={() => handlePresetClick(preset)}
              disabled={preset > balance}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                !customActive && amount === preset
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              } ${preset > balance ? "opacity-30 cursor-not-allowed" : ""}`}
            >
              {preset}
            </button>
          ))}
          {/* Custom input */}
          {customActive ? (
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="number"
                value={amount || ""}
                onChange={handleCustomChange}
                onBlur={handleCustomBlur}
                className="w-full py-1.5 rounded-lg text-xs font-medium text-center bg-blue-600 text-white outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                min={1}
                max={balance}
              />
            </div>
          ) : (
            <button
              onClick={handleCustomClick}
              className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all bg-gray-800 text-gray-400 hover:bg-gray-700"
            >
              Custom
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onBuy(true, amount)}
          disabled={amount > balance || amount <= 0}
          className="flex-1 bg-green-600 hover:bg-green-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all active:scale-[0.98]"
        >
          <span className="text-sm">Buy YES</span>
          <span className="block text-xs opacity-70 mt-0.5">
            {formatOdds(yesOdds)} · {amount} $DOJO
          </span>
        </button>
        <button
          onClick={() => onBuy(false, amount)}
          disabled={amount > balance || amount <= 0}
          className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all active:scale-[0.98]"
        >
          <span className="text-sm">Buy NO</span>
          <span className="block text-xs opacity-70 mt-0.5">
            {formatOdds(noOdds)} · {amount} $DOJO
          </span>
        </button>
      </div>
    </div>
  );
}
