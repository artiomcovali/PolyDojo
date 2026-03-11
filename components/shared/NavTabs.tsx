"use client";

import { useState } from "react";

export type Tab = "trade" | "agent" | "learn" | "leaderboard";

interface NavTabsProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: "trade", label: "Trade", icon: "📊" },
  { id: "agent", label: "Agent", icon: "🤖" },
  { id: "learn", label: "Learn", icon: "📚" },
  { id: "leaderboard", label: "Board", icon: "🏆" },
];

export default function NavTabs({ activeTab, onTabChange }: NavTabsProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-gray-800 z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              activeTab === tab.id
                ? "text-blue-400"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <span className="text-lg">{tab.icon}</span>
            <span className="text-[10px] mt-0.5 font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
