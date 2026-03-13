"use client";

import { useDojoBalance } from "@/hooks/use-dojo-balance";
import { DOJO_TOKEN_ADDRESS } from "@/lib/contracts";
import ScrollingNumber from "@/components/shared/ScrollingNumber";
import { useEffect, useState } from "react";

interface WalletPageProps {
  walletAddress: string | null;
  onClose: () => void;
}

function readLocalBalance(): number {
  if (typeof window === "undefined") return 10000;
  const saved = localStorage.getItem("polydojo_balance");
  return saved !== null ? parseFloat(saved) : 10000;
}

export default function WalletPage({ walletAddress, onClose }: WalletPageProps) {
  const { onchainBalance, loading: balanceLoading } = useDojoBalance(walletAddress);
  const [gameBalance, setGameBalance] = useState(readLocalBalance);
  const [cashingOut, setCashingOut] = useState(false);
  const [cashoutResult, setCashoutResult] = useState<{
    success: boolean;
    minted?: number;
    txHash?: string;
    error?: string;
  } | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setGameBalance(readLocalBalance()), 1000);
    return () => clearInterval(interval);
  }, []);

  const onchainDisplay = onchainBalance !== null ? Math.round(onchainBalance) : null;
  const gameDisplay = Math.round(gameBalance);
  const difference = onchainDisplay !== null ? gameDisplay - onchainDisplay : gameDisplay;
  const canCashOut = difference > 0 && walletAddress && !cashingOut;

  const handleCashOut = async () => {
    if (!canCashOut) return;
    setCashingOut(true);
    setCashoutResult(null);

    try {
      const res = await fetch("/api/cashout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ gameBalance: gameDisplay }),
      });

      const data = await res.json();
      if (res.ok) {
        setCashoutResult({ success: true, minted: data.minted, txHash: data.txHash });
      } else {
        setCashoutResult({ success: false, error: data.error || "Cashout failed" });
      }
    } catch {
      setCashoutResult({ success: false, error: "Network error" });
    } finally {
      setCashingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-gray-800/50 px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button
            onClick={onClose}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-sm font-bold">$DOJO Wallet</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="px-4 pt-6 pb-20 max-w-lg mx-auto space-y-5">
        {/* Total Balance */}
        <div className="text-center space-y-1">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider">
            In-Game Balance
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="text-yellow-400 text-2xl font-bold">$DOJO</span>
            <ScrollingNumber
              value={gameDisplay.toLocaleString()}
              className="text-3xl font-bold font-mono text-white"
            />
          </div>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* Onchain */}
          <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-800/50">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                Onchain
              </span>
            </div>
            <div className="text-lg font-bold font-mono text-white">
              {balanceLoading ? (
                <span className="text-gray-500">...</span>
              ) : onchainDisplay !== null ? (
                onchainDisplay.toLocaleString()
              ) : (
                <span className="text-gray-500">--</span>
              )}
            </div>
            <div className="text-[9px] text-gray-600 mt-1">Base Sepolia</div>
          </div>

          {/* In-Game */}
          <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-800/50">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                In-Game
              </span>
            </div>
            <div className="text-lg font-bold font-mono text-white">
              {gameDisplay.toLocaleString()}
            </div>
            <div className="text-[9px] text-gray-600 mt-1">Unsettled</div>
          </div>
        </div>

        {/* Difference */}
        {onchainDisplay !== null && difference > 0 && (
          <div className="rounded-xl p-3 border text-center bg-green-500/5 border-green-500/20">
            <span className="text-xs font-medium text-green-400">
              +{difference.toLocaleString()} DOJO to settle onchain
            </span>
          </div>
        )}
        {onchainDisplay !== null && difference <= 0 && (
          <div className="rounded-xl p-3 border text-center bg-gray-800/30 border-gray-800/50">
            <span className="text-xs font-medium text-gray-400">
              Onchain balance is up to date
            </span>
          </div>
        )}

        {/* Cash Out Button */}
        <button
          onClick={handleCashOut}
          disabled={!canCashOut}
          className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
            canCashOut
              ? "bg-yellow-500 text-black hover:bg-yellow-400 active:scale-[0.98]"
              : "bg-gray-800 text-gray-500 cursor-not-allowed"
          }`}
        >
          {cashingOut ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
              </svg>
              Settling onchain...
            </span>
          ) : !walletAddress ? (
            "Connect wallet to cash out"
          ) : difference <= 0 ? (
            "Balance already settled"
          ) : (
            `Cash Out ${difference > 0 ? "+" : ""}${difference.toLocaleString()} DOJO`
          )}
        </button>

        {/* Cashout Result */}
        {cashoutResult && (
          <div className={`rounded-xl p-4 border ${
            cashoutResult.success
              ? "bg-green-500/5 border-green-500/20"
              : "bg-red-500/5 border-red-500/20"
          }`}>
            {cashoutResult.success ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-green-400 text-sm font-medium">
                    Settled {cashoutResult.minted?.toLocaleString()} DOJO onchain
                  </span>
                </div>
                {cashoutResult.txHash && (
                  <a
                    href={`https://sepolia.basescan.org/tx/${cashoutResult.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-blue-400 hover:underline block"
                  >
                    View transaction on BaseScan →
                  </a>
                )}
              </div>
            ) : (
              <span className="text-red-400 text-sm">
                {cashoutResult.error}
              </span>
            )}
          </div>
        )}

        {/* Token Info */}
        <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-800/50 space-y-2">
          <h3 className="text-xs font-medium text-gray-400">$DOJO Token</h3>
          <p className="text-[10px] text-white font-mono break-all">
            {DOJO_TOKEN_ADDRESS}
          </p>
          <div className="flex items-center gap-2">
            <a
              href={`https://sepolia.basescan.org/token/${DOJO_TOKEN_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-blue-400 hover:underline"
            >
              View Token
            </a>
            <span className="text-[10px] text-gray-600">·</span>
            <span className="text-[10px] text-gray-600">Base Sepolia · ERC-20</span>
          </div>
        </div>

        {/* How it works */}
        <div className="bg-yellow-500/5 rounded-xl p-4 border border-yellow-500/20 space-y-3">
          <h3 className="text-sm font-bold text-white">How it works</h3>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-yellow-400 text-xs font-bold">1</span>
              </div>
              <div>
                <p className="text-xs font-medium text-white">Trade with zero gas fees</p>
                <p className="text-[11px] text-gray-400">Your in-game balance updates instantly as you play. No transactions needed.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-yellow-400 text-xs font-bold">2</span>
              </div>
              <div>
                <p className="text-xs font-medium text-white">Cash out when you&apos;re ready</p>
                <p className="text-[11px] text-gray-400">Hit the Cash Out button to settle your earnings onchain in a single transaction.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-yellow-400 text-xs font-bold">3</span>
              </div>
              <div>
                <p className="text-xs font-medium text-white">$DOJO minted to your wallet</p>
                <p className="text-[11px] text-gray-400">Real ERC-20 tokens on Base. Hold them, trade them, or keep playing.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
