"use client";

import { useDojoBalance } from "@/hooks/use-dojo-balance";
import { DOJO_TOKEN_ADDRESS } from "@/lib/contracts";
import ScrollingNumber from "@/components/shared/ScrollingNumber";

interface WalletPageProps {
  walletAddress: string | null;
  onClose: () => void;
}

export default function WalletPage({ walletAddress, onClose }: WalletPageProps) {
  const { onchainBalance, loading } = useDojoBalance(walletAddress);
  const display =
    onchainBalance !== null ? Math.round(onchainBalance).toLocaleString() : "—";

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
        {/* Balance */}
        <div className="text-center space-y-1">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider">
            Onchain Balance
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="text-yellow-400 text-2xl font-bold">$DOJO</span>
            {loading && onchainBalance === null ? (
              <span className="text-3xl font-bold font-mono text-gray-500">...</span>
            ) : (
              <ScrollingNumber
                value={display}
                className="text-3xl font-bold font-mono text-white"
              />
            )}
          </div>
          <div className="text-[10px] text-gray-600 mt-1">Base Sepolia · ERC-20</div>
        </div>

        {/* Wallet address */}
        {walletAddress && (
          <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-800/50 space-y-2">
            <h3 className="text-xs font-medium text-gray-400">Your Wallet</h3>
            <p className="text-[10px] text-white font-mono break-all">
              {walletAddress}
            </p>
            <a
              href={`https://sepolia.basescan.org/address/${walletAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-blue-400 hover:underline"
            >
              View on BaseScan →
            </a>
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
                <p className="text-xs font-medium text-white">Every bet is onchain</p>
                <p className="text-[11px] text-gray-400">
                  Placing a trade transfers $DOJO to the game manager on Base Sepolia.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-yellow-400 text-xs font-bold">2</span>
              </div>
              <div>
                <p className="text-xs font-medium text-white">Rounds settle automatically</p>
                <p className="text-[11px] text-gray-400">
                  Winners get paid directly to this wallet once the market resolves.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-yellow-400 text-xs font-bold">3</span>
              </div>
              <div>
                <p className="text-xs font-medium text-white">Your balance is your keys</p>
                <p className="text-[11px] text-gray-400">
                  Real ERC-20 tokens on Base. Hold them, trade them, or keep playing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
