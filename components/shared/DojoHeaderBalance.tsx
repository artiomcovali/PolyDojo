"use client";

import { useEffect, useState } from "react";
import ScrollingNumber from "./ScrollingNumber";
import { useDojoBalance } from "@/hooks/use-dojo-balance";
import { usePosition } from "@/hooks/use-position";

const WINDOW_SECONDS = 300;

interface DojoHeaderBalanceProps {
  walletAddress: string | null;
  onClick?: () => void;
}

export default function DojoHeaderBalance({
  walletAddress,
  onClick,
}: DojoHeaderBalanceProps) {
  const { onchainBalance, loading } = useDojoBalance(walletAddress);

  const [roundId, setRoundId] = useState<number>(() =>
    Math.floor(Date.now() / 1000 / WINDOW_SECONDS) * WINDOW_SECONDS
  );
  useEffect(() => {
    const id = setInterval(() => {
      const next = Math.floor(Date.now() / 1000 / WINDOW_SECONDS) * WINDOW_SECONDS;
      setRoundId((prev) => (prev === next ? prev : next));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const { position, realizedDojo } = usePosition(walletAddress, roundId, 3000);

  // Displayed balance = onchain wallet, minus any stake currently locked in an
  // open off-chain position, plus any P&L banked by mid-round sells. The round
  // end settlement reconciles the real onchain balance.
  const stake = position?.amountFmt ?? 0;
  const effective =
    onchainBalance !== null
      ? Math.max(0, onchainBalance - stake + realizedDojo)
      : null;

  const display =
    effective !== null ? Math.round(effective).toLocaleString() : "—";

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 bg-gray-800/50 hover:bg-gray-700/50 rounded-full px-3 py-1.5 transition-colors"
    >
      <span className="text-yellow-400 text-xs font-bold">$DOJO</span>
      {loading && onchainBalance === null ? (
        <span className="text-gray-500 text-xs font-mono">...</span>
      ) : (
        <ScrollingNumber
          value={display}
          className="text-white text-xs font-mono font-medium"
        />
      )}
    </button>
  );
}
