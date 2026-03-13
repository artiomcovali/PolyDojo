"use client";

import Image from "next/image";

export type Tab = "trade" | "learn" | "leaderboard";

interface NavTabsProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: "trade", label: "Trade", icon: "/Assets/trade.svg" },
  { id: "learn", label: "Learn", icon: "/Assets/learn.svg" },
  { id: "leaderboard", label: "Leaderboard", icon: "/Assets/leaderboard.svg" },
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
            <Image
              src={tab.icon}
              alt={tab.label}
              width={20}
              height={20}
              className={`transition-opacity ${
                activeTab === tab.id ? "opacity-100" : "opacity-50"
              }`}
            />
            <span className="text-[10px] mt-0.5 font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
