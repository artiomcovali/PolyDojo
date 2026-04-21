"use client";

import ScrollingNumber from "./ScrollingNumber";
import { useDojoBalance } from "@/hooks/use-dojo-balance";

interface DojoHeaderBalanceProps {
  walletAddress: string | null;
  onClick?: () => void;
}

export default function DojoHeaderBalance({
  walletAddress,
  onClick,
}: DojoHeaderBalanceProps) {
  const { onchainBalance, loading } = useDojoBalance(walletAddress);

  const display =
    onchainBalance !== null ? Math.round(onchainBalance).toLocaleString() : "—";

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
