"use client";

import { useEffect, useState } from "react";
import ScrollingNumber from "./ScrollingNumber";

function readBalance(): number {
  if (typeof window === "undefined") return 10000;
  const saved = localStorage.getItem("polydojo_balance");
  return saved !== null ? parseFloat(saved) : 10000;
}

export default function DojoHeaderBalance() {
  const [balance, setBalance] = useState(readBalance);

  useEffect(() => {
    // Poll localStorage every second to stay in sync with TradeTab
    const interval = setInterval(() => {
      setBalance(readBalance());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-1.5 bg-gray-800/50 rounded-full px-3 py-1.5">
      <span className="text-yellow-400 text-xs font-bold">$DOJO</span>
      <ScrollingNumber
        value={Math.round(balance).toLocaleString()}
        className="text-white text-xs font-mono font-medium"
      />
    </div>
  );
}
