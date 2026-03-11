"use client";

import LevelBadge from "@/components/shared/LevelBadge";
import Image from "next/image";

interface ProfilePageProps {
  userName: string;
  pfpUrl: string | null | undefined;
  walletAddress: string | null;
  onClose: () => void;
}

export default function ProfilePage({
  userName,
  pfpUrl,
  walletAddress,
  onClose,
}: ProfilePageProps) {
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
          <h1 className="text-sm font-bold">Profile</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="px-4 pt-6 pb-20 max-w-lg mx-auto space-y-6">
        {/* Avatar + Name */}
        <div className="flex flex-col items-center gap-3">
          {pfpUrl ? (
            <Image
              src={pfpUrl}
              alt={userName}
              width={80}
              height={80}
              className="rounded-full"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center">
              <Image src="/LogoWhite.png" alt="PolyDojo" width={48} height={48} />
            </div>
          )}
          <div className="text-center">
            <h2 className="text-lg font-bold">{userName}</h2>
            {walletAddress && (
              <p className="text-xs text-gray-500 font-mono mt-0.5">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </p>
            )}
          </div>
        </div>

        {/* Level */}
        <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-800/50">
          <LevelBadge totalScore={1250} />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Total Score", value: "1,250" },
            { label: "Win Rate", value: "58%" },
            { label: "$DOJO Balance", value: "1,000" },
            { label: "Best Streak", value: "4" },
            { label: "Rounds Played", value: "24" },
            { label: "Avg Score", value: "72" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-gray-800/30 rounded-xl p-3 border border-gray-800/50"
            >
              <div className="text-[10px] text-gray-500">{stat.label}</div>
              <div className="text-sm font-bold text-white font-mono">
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Wallet */}
        <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-800/50 space-y-2">
          <h3 className="text-xs font-medium text-gray-400">Wallet</h3>
          {walletAddress ? (
            <p className="text-xs text-white font-mono break-all">
              {walletAddress}
            </p>
          ) : (
            <p className="text-xs text-gray-500">Not connected</p>
          )}
          <p className="text-[10px] text-gray-600">
            Base Sepolia · View on BaseScan
          </p>
        </div>
      </main>
    </div>
  );
}
