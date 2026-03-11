"use client";

import { getLevelInfo } from "@/lib/scoring";

interface LevelBadgeProps {
  totalScore: number;
  compact?: boolean;
}

export default function LevelBadge({ totalScore, compact = false }: LevelBadgeProps) {
  const { level, badge, nextLevel, progress } = getLevelInfo(totalScore);

  if (compact) {
    return (
      <span className="text-xs bg-gray-800 rounded-full px-2 py-0.5">
        {badge} {level}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-lg">{badge}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-300">{level}</span>
          <span className="text-[10px] text-gray-500">{totalScore.toLocaleString()} pts</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-1.5 mt-0.5">
          <div
            className="bg-blue-500 h-1.5 rounded-full transition-all"
            style={{ width: `${Math.min(progress * 100, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
