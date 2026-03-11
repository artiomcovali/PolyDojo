"use client";

import LevelBadge from "@/components/shared/LevelBadge";
import { getLevelInfo } from "@/lib/scoring";
import { ACHIEVEMENT_IDS } from "@/lib/contracts";
import { useState } from "react";

// Mock data for leaderboard until Supabase is connected
const MOCK_LEADERBOARD = [
  { address: "0x1234...abcd", name: "trader.base.eth", score: 12450, winRate: 72, streak: 8 },
  { address: "0x5678...efgh", name: "shark.base.eth", score: 9800, winRate: 68, streak: 5 },
  { address: "0x9abc...ijkl", name: "degen.base.eth", score: 7200, winRate: 65, streak: 3 },
  { address: "0xdef0...mnop", name: "0xdef0...mnop", score: 5500, winRate: 61, streak: 4 },
  { address: "0x1111...qrst", name: "whale.base.eth", score: 4200, winRate: 58, streak: 2 },
  { address: "0x2222...uvwx", name: "0x2222...uvwx", score: 3100, winRate: 55, streak: 6 },
  { address: "0x3333...yzab", name: "newbie.base.eth", score: 2800, winRate: 52, streak: 1 },
  { address: "0x4444...cdef", name: "0x4444...cdef", score: 1900, winRate: 49, streak: 0 },
  { address: "0x5555...ghij", name: "btcfan.base.eth", score: 1200, winRate: 47, streak: 3 },
  { address: "0x6666...klmn", name: "0x6666...klmn", score: 800, winRate: 44, streak: 1 },
];

const ACHIEVEMENT_LIST = [
  { id: ACHIEVEMENT_IDS.TRADER_BADGE, name: "Trader Badge", emoji: "💹", description: "Reach Trader level" },
  { id: ACHIEVEMENT_IDS.SHARK_BADGE, name: "Shark Badge", emoji: "🦈", description: "Reach Shark level" },
  { id: ACHIEVEMENT_IDS.WHALE_BADGE, name: "Whale Badge", emoji: "🐋", description: "Reach Whale level" },
  { id: ACHIEVEMENT_IDS.LEGEND_BADGE, name: "Legend Badge", emoji: "👑", description: "Reach Legend level" },
  { id: ACHIEVEMENT_IDS.STREAK_3, name: "3-Streak", emoji: "🔥", description: "Win 3 rounds in a row" },
  { id: ACHIEVEMENT_IDS.STREAK_5, name: "5-Streak", emoji: "🔥🔥", description: "Win 5 rounds in a row" },
  { id: ACHIEVEMENT_IDS.STREAK_10, name: "10-Streak", emoji: "💎", description: "Win 10 rounds in a row" },
  { id: ACHIEVEMENT_IDS.PERFECT_ROUND, name: "Perfect Round", emoji: "⭐", description: "Score 95+ in all categories" },
  { id: ACHIEVEMENT_IDS.CONTRARIAN_WIN, name: "Contrarian Win", emoji: "🎯", description: "Win against >70% crowd odds" },
  { id: ACHIEVEMENT_IDS.BANKRUPT_BADGE, name: "Bankrupt", emoji: "💀", description: "Hit 0 $DOJO (badge of shame)" },
];

type SubTab = "rankings" | "stats" | "nfts";

export default function LeaderboardTab() {
  const [subTab, setSubTab] = useState<SubTab>("rankings");
  const userScore = 1250; // Would come from state/context

  return (
    <div className="space-y-3 pb-4">
      {/* Sub-tabs */}
      <div className="flex bg-gray-800/50 rounded-xl p-1 gap-1">
        {(["rankings", "stats", "nfts"] as SubTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setSubTab(tab)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
              subTab === tab
                ? "bg-gray-700 text-white"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {tab === "rankings"
              ? "Rankings"
              : tab === "stats"
              ? "My Stats"
              : "NFTs"}
          </button>
        ))}
      </div>

      {subTab === "rankings" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium text-gray-400">
              Top Players (Onchain)
            </h3>
            <span className="text-[10px] text-gray-600">
              Verified on Base
            </span>
          </div>

          {MOCK_LEADERBOARD.map((player, index) => {
            const { badge } = getLevelInfo(player.score);
            return (
              <div
                key={player.address}
                className={`flex items-center gap-3 p-3 rounded-xl ${
                  index < 3
                    ? "bg-yellow-500/5 border border-yellow-500/10"
                    : "bg-gray-800/30 border border-gray-800/50"
                }`}
              >
                <span
                  className={`text-sm font-bold w-6 text-center ${
                    index === 0
                      ? "text-yellow-400"
                      : index === 1
                      ? "text-gray-300"
                      : index === 2
                      ? "text-orange-400"
                      : "text-gray-600"
                  }`}
                >
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs">{badge}</span>
                    <span className="text-xs font-medium text-white truncate">
                      {player.name}
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-500">
                    {player.winRate}% WR · {player.streak} streak
                  </div>
                </div>
                <span className="text-xs font-bold font-mono text-white">
                  {player.score.toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {subTab === "stats" && (
        <div className="space-y-3">
          <LevelBadge totalScore={userScore} />

          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Total Score", value: userScore.toLocaleString() },
              { label: "Win Rate", value: "58%" },
              { label: "$DOJO Balance", value: "1,250" },
              { label: "Best Streak", value: "4" },
              { label: "Rounds Played", value: "24" },
              { label: "Avg Score", value: "72" },
              { label: "Scenarios Done", value: "5/20" },
              { label: "Total XP", value: "300" },
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

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
            <div className="text-xs font-bold text-blue-400 mb-1">
              AI Weakness Analysis
            </div>
            <p className="text-[10px] text-blue-200/70 leading-relaxed">
              Play 10+ rounds to unlock AI analysis of your trading patterns
              and weaknesses.
            </p>
          </div>
        </div>
      )}

      {subTab === "nfts" && (
        <div className="space-y-3">
          <div>
            <h3 className="text-xs font-medium text-gray-400">
              Achievement NFTs
            </h3>
            <p className="text-[10px] text-gray-600">
              ERC-1155 on Base · Minted to your wallet on achievement
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {ACHIEVEMENT_LIST.map((achievement) => {
              const earned = false; // Would check onchain balanceOf
              return (
                <div
                  key={achievement.id}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    earned
                      ? "bg-yellow-500/10 border-yellow-500/20"
                      : "bg-gray-900/50 border-gray-800/30 opacity-40"
                  }`}
                >
                  <div className="text-2xl mb-1">{achievement.emoji}</div>
                  <div className="text-xs font-medium text-white">
                    {achievement.name}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    {achievement.description}
                  </div>
                  {earned && (
                    <div className="text-[10px] text-yellow-400 mt-1 font-medium">
                      Earned
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
