"use client";

import { useEffect, useState } from "react";
import ScrollingNumber from "./ScrollingNumber";

function readLocalBalance(): number {
  if (typeof window === "undefined") return 10000;
  const saved = localStorage.getItem("polydojo_balance");
  return saved !== null ? parseFloat(saved) : 10000;
}

interface DojoHeaderBalanceProps {
  walletAddress?: string | null;
  onClick?: () => void;
}

export default function DojoHeaderBalance({ onClick }: DojoHeaderBalanceProps) {
  const [balance, setBalance] = useState(readLocalBalance);

  useEffect(() => {
    const interval = setInterval(() => {
      setBalance(readLocalBalance());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 bg-gray-800/50 hover:bg-gray-700/50 rounded-full px-3 py-1.5 transition-colors"
    >
      <span className="text-yellow-400 text-xs font-bold">$DOJO</span>
      <ScrollingNumber
        value={Math.round(balance).toLocaleString()}
        className="text-white text-xs font-mono font-medium"
      />
    </button>
  );
}
