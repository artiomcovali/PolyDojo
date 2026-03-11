"use client";

import { useBTCPrice } from "@/hooks/use-btc-price";
import { calculateOdds, formatOdds } from "@/lib/odds";
import { useEffect, useRef, useState } from "react";

interface AgentThought {
  id: number;
  text: string;
  action: string | null;
  timestamp: number;
}

interface AgentStats {
  totalTrades: number;
  wins: number;
  losses: number;
  totalPnl: number;
  currentStreak: number;
}

export default function AgentTab() {
  const { price } = useBTCPrice();
  const [thoughts, setThoughts] = useState<AgentThought[]>([]);
  const [stats, setStats] = useState<AgentStats>({
    totalTrades: 0,
    wins: 0,
    losses: 0,
    totalPnl: 0,
    currentStreak: 0,
  });
  const [agentPosition, setAgentPosition] = useState<{
    isYes: boolean;
    odds: number;
    amount: number;
  } | null>(null);
  const thoughtIdRef = useRef(0);
  const lastThinkTime = useRef(0);
  const thresholdRef = useRef(0);

  // Agent "thinks" every 10 seconds
  useEffect(() => {
    if (price <= 0) return;

    const now = Date.now();
    if (now - lastThinkTime.current < 10000) return;
    lastThinkTime.current = now;

    if (thresholdRef.current === 0) {
      thresholdRef.current = Math.round(price + (Math.random() - 0.5) * 100);
    }

    const threshold = thresholdRef.current;
    const distance = price - threshold;
    const absDistance = Math.abs(distance);
    const { yesOdds, noOdds } = calculateOdds(price, threshold, 180);

    let thought = "";
    let action: string | null = null;

    if (!agentPosition) {
      if (absDistance > 200) {
        const side = distance > 0 ? "YES" : "NO";
        const odds = distance > 0 ? yesOdds : noOdds;
        thought = `Price is $${absDistance.toFixed(0)} ${distance > 0 ? "above" : "below"} threshold ($${threshold.toLocaleString()}). Strong ${side} setup at ${formatOdds(odds)}. The distance is large enough to justify entry.`;
        action = `Buying ${side} at ${formatOdds(odds)} — 150 $DOJO`;
        setAgentPosition({
          isYes: distance > 0,
          odds: distance > 0 ? yesOdds : noOdds,
          amount: 150,
        });
      } else if (absDistance < 50) {
        thought = `Price is only $${absDistance.toFixed(0)} from threshold. Too close to call — no edge here. Waiting for a clearer setup before entering.`;
      } else {
        thought = `Monitoring... BTC at $${price.toLocaleString()}, threshold at $${threshold.toLocaleString()}. Distance is $${absDistance.toFixed(0)} — moderate but not convincing yet. Looking for momentum confirmation.`;
      }
    } else {
      const currentOdds = agentPosition.isYes ? yesOdds : noOdds;
      const edge = currentOdds - agentPosition.odds;
      if (edge > 0.15) {
        thought = `Position is in profit. ${agentPosition.isYes ? "YES" : "NO"} moved from ${formatOdds(agentPosition.odds)} to ${formatOdds(currentOdds)}. Taking profit — edge of ${Math.round(edge * 100)}¢ is enough.`;
        action = `Selling ${agentPosition.isYes ? "YES" : "NO"} at ${formatOdds(currentOdds)} — +${Math.round(edge * agentPosition.amount)} $DOJO`;
        setStats((prev) => ({
          ...prev,
          totalTrades: prev.totalTrades + 1,
          wins: prev.wins + 1,
          totalPnl: prev.totalPnl + edge * agentPosition.amount,
          currentStreak: prev.currentStreak + 1,
        }));
        setAgentPosition(null);
      } else if (edge < -0.2) {
        thought = `Position is underwater. ${agentPosition.isYes ? "YES" : "NO"} dropped from ${formatOdds(agentPosition.odds)} to ${formatOdds(currentOdds)}. Cutting loss — don't let it get worse.`;
        action = `Selling ${agentPosition.isYes ? "YES" : "NO"} at ${formatOdds(currentOdds)} — ${Math.round(edge * agentPosition.amount)} $DOJO`;
        setStats((prev) => ({
          ...prev,
          totalTrades: prev.totalTrades + 1,
          losses: prev.losses + 1,
          totalPnl: prev.totalPnl + edge * agentPosition.amount,
          currentStreak: 0,
        }));
        setAgentPosition(null);
      } else {
        thought = `Holding ${agentPosition.isYes ? "YES" : "NO"} position. Current odds ${formatOdds(currentOdds)} vs entry ${formatOdds(agentPosition.odds)}. Edge is ${edge > 0 ? "+" : ""}${Math.round(edge * 100)}¢ — not enough to exit yet.`;
      }
    }

    thoughtIdRef.current += 1;
    setThoughts((prev) =>
      [
        { id: thoughtIdRef.current, text: thought, action, timestamp: now },
        ...prev,
      ].slice(0, 20)
    );
  }, [price, agentPosition]);

  const winRate =
    stats.totalTrades > 0
      ? Math.round((stats.wins / stats.totalTrades) * 100)
      : 0;

  return (
    <div className="space-y-4 pb-4">
      <div>
        <h2 className="text-sm font-bold text-white">AI Agent Trading</h2>
        <p className="text-[10px] text-gray-500">
          Watch the agent reason and trade in real time
        </p>
      </div>

      {/* Agent Stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Trades", value: stats.totalTrades },
          { label: "Win Rate", value: `${winRate}%` },
          {
            label: "P&L",
            value: `${stats.totalPnl >= 0 ? "+" : ""}${stats.totalPnl.toFixed(0)}`,
          },
          { label: "Streak", value: stats.currentStreak },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-gray-800/50 rounded-lg p-2 text-center"
          >
            <div className="text-[10px] text-gray-500">{stat.label}</div>
            <div className="text-sm font-bold text-white font-mono">
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Current Position */}
      {agentPosition && (
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-purple-300">Active Position</span>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded ${
                agentPosition.isYes
                  ? "bg-green-500/20 text-green-400"
                  : "bg-red-500/20 text-red-400"
              }`}
            >
              {agentPosition.isYes ? "YES" : "NO"} @ {formatOdds(agentPosition.odds)}
            </span>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {agentPosition.amount} $DOJO wagered
          </div>
        </div>
      )}

      {/* Thinking Stream */}
      <div className="space-y-2">
        <h3 className="text-xs font-medium text-gray-400">Agent Reasoning</h3>
        {thoughts.length === 0 ? (
          <div className="text-center py-8">
            <div className="animate-pulse text-2xl mb-2">🤖</div>
            <p className="text-xs text-gray-500">
              {price > 0
                ? "Agent is analyzing the market..."
                : "Waiting for price feed..."}
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {thoughts.map((thought) => (
              <div
                key={thought.id}
                className="bg-gray-800/30 rounded-lg p-3 border border-gray-800/50"
              >
                <p className="text-xs text-gray-300 leading-relaxed">
                  {thought.text}
                </p>
                {thought.action && (
                  <div className="mt-2 bg-purple-500/10 rounded px-2 py-1">
                    <p className="text-[10px] text-purple-300 font-medium">
                      → {thought.action}
                    </p>
                  </div>
                )}
                <p className="text-[10px] text-gray-600 mt-1">
                  {new Date(thought.timestamp).toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
