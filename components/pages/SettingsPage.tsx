"use client";

import { DOJO_TOKEN_ADDRESS } from "@/lib/contracts";
import { useState } from "react";

interface SettingsPageProps {
  presets: number[];
  onPresetsChange: (presets: number[]) => void;
  soundEffects: boolean;
  onSoundEffectsChange: (enabled: boolean) => void;
  notifications: boolean;
  onNotificationsChange: (enabled: boolean) => void;
  onClose: () => void;
}

export default function SettingsPage({
  presets,
  onPresetsChange,
  soundEffects,
  onSoundEffectsChange,
  notifications,
  onNotificationsChange,
  onClose,
}: SettingsPageProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  const handlePresetEdit = (index: number) => {
    setEditingIndex(index);
    setEditValue(String(presets[index]));
  };

  const handlePresetSave = (index: number) => {
    const val = parseInt(editValue, 10);
    if (!isNaN(val) && val > 0) {
      const updated = [...presets];
      updated[index] = val;
      updated.sort((a, b) => a - b);
      onPresetsChange(updated);
    }
    setEditingIndex(null);
  };

  const handlePresetKeyDown = (
    e: React.KeyboardEvent,
    index: number
  ) => {
    if (e.key === "Enter") handlePresetSave(index);
    if (e.key === "Escape") setEditingIndex(null);
  };

  const handleAddPreset = () => {
    if (presets.length >= 5) return;
    const next = presets.length > 0 ? presets[presets.length - 1] * 2 : 100;
    const updated = [...presets, next].sort((a, b) => a - b);
    onPresetsChange(updated);
  };

  const handleRemovePreset = (index: number) => {
    if (presets.length <= 1) return;
    const updated = presets.filter((_, i) => i !== index);
    onPresetsChange(updated);
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
          <h1 className="text-sm font-bold">Settings</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="px-4 pt-4 pb-20 max-w-lg mx-auto space-y-4">
        {/* Quick Buy Presets */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Quick Buy Amounts
          </h3>
          <div className="bg-gray-800/30 rounded-xl border border-gray-800/50 p-3 space-y-2">
            <p className="text-[10px] text-gray-500">
              Tap a value to edit. These appear as quick buttons when placing a
              bet.
            </p>
            <div className="flex flex-wrap gap-2">
              {presets.map((preset, i) => (
                <div key={i} className="relative group">
                  {editingIndex === i ? (
                    <input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => handlePresetSave(i)}
                      onKeyDown={(e) => handlePresetKeyDown(e, i)}
                      autoFocus
                      className="w-20 py-1.5 rounded-lg text-xs font-medium text-center bg-blue-600 text-white outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  ) : (
                    <button
                      onClick={() => handlePresetEdit(i)}
                      className="py-1.5 px-4 rounded-lg text-xs font-medium bg-gray-800 text-white hover:bg-gray-700 transition-colors"
                    >
                      {preset}
                    </button>
                  )}
                  {presets.length > 1 && editingIndex !== i && (
                    <button
                      onClick={() => handleRemovePreset(i)}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-600 text-white text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              {presets.length < 5 && (
                <button
                  onClick={handleAddPreset}
                  className="py-1.5 px-4 rounded-lg text-xs font-medium bg-gray-800/50 text-gray-500 hover:bg-gray-700 hover:text-gray-300 border border-dashed border-gray-700 transition-colors"
                >
                  + Add
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Preferences
          </h3>
          <div className="bg-gray-800/30 rounded-xl border border-gray-800/50 divide-y divide-gray-800/50">
            <div className="flex items-center justify-between p-3">
              <div>
                <span className="text-xs text-white">Notifications</span>
                <p className="text-[10px] text-gray-500">
                  Round start and resolution alerts
                </p>
              </div>
              <button
                onClick={() => onNotificationsChange(!notifications)}
                className={`w-10 h-5 rounded-full transition-colors relative ${
                  notifications ? "bg-blue-600" : "bg-gray-700"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${
                    notifications ? "left-5" : "left-0.5"
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between p-3">
              <div>
                <span className="text-xs text-white">Sound Effects</span>
                <p className="text-[10px] text-gray-500">
                  Trade confirmation and resolution sounds
                </p>
              </div>
              <button
                onClick={() => onSoundEffectsChange(!soundEffects)}
                className={`w-10 h-5 rounded-full transition-colors relative ${
                  soundEffects ? "bg-blue-600" : "bg-gray-700"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${
                    soundEffects ? "left-5" : "left-0.5"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            FAQ
          </h3>
          <div className="bg-gray-800/30 rounded-xl border border-gray-800/50 divide-y divide-gray-800/50">
            {[
              {
                q: "Does this use live data?",
                a: "Yes. Market data comes directly from Polymarket's Gamma API — the exact same BTC price and YES/NO odds you'd see on Polymarket itself. Resolution uses Chainlink's BTC/USD oracle on Base, the same oracle Polymarket uses.",
              },
              {
                q: "Is this all free?",
                a: "Yes, completely free. PolyDojo runs on Base Sepolia, a testnet version of the Base blockchain. Testnet coins have no real value — they exist purely for practice. When you feel ready to make real money, you can trade real crypto on Polymarket itself.",
              },
              {
                q: "What is $DOJO?",
                a: "$DOJO is the game currency — an ERC-20 token on Base Sepolia. Every new player gets 1000 $DOJO to start, wagered on each round. It has no real-world value; it's just for keeping score and practicing risk management.",
              },
              {
                q: "Why do I need to connect a wallet?",
                a: "Your wallet is your identity and where your $DOJO, trade history, and achievement NFTs live — fully onchain, verifiable on BaseScan. No email or password needed. You never pay gas; the app sponsors all transactions.",
              },
              {
                q: "What happens if I run out of $DOJO?",
                a: "You can claim a one-time 500 $DOJO refill to keep practicing. You'll also earn a \"Bankrupt\" badge NFT — a badge of experience, not shame. Every serious trader has gone bust once.",
              },
              {
                q: "How does the AI work?",
                a: "Before each trade, an AI model analyzes live market conditions (price vs threshold, momentum, time remaining, volatility) and gives you a contextual tip. After every round, it reviews your entry timing, exit, and sizing so you can spot recurring mistakes.",
              },
              {
                q: "Are my achievements real NFTs?",
                a: "Yes. Every level badge, streak reward, and scenario completion is a real ERC-1155 NFT minted to your Base wallet. They're visible in any NFT-compatible wallet or marketplace — permanent onchain proof of your progression.",
              },
              {
                q: "Can I lose real money here?",
                a: "No. Nothing in PolyDojo costs real money, and nothing you earn here has real monetary value. It is strictly a training simulator. When you're ready for real stakes, head to polymarket.com.",
              },
            ].map((item, i) => (
              <details key={i} className="group">
                <summary className="flex items-center justify-between p-3 cursor-pointer list-none">
                  <span className="text-xs text-white pr-3">{item.q}</span>
                  <span className="text-gray-500 text-[10px] transition-transform group-open:rotate-180">
                    ▼
                  </span>
                </summary>
                <div className="px-3 pb-3 -mt-1">
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    {item.a}
                  </p>
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* About */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            About
          </h3>
          <div className="bg-gray-800/30 rounded-xl border border-gray-800/50 divide-y divide-gray-800/50">
            <div className="flex items-center justify-between p-3">
              <span className="text-xs text-white">Version</span>
              <span className="text-xs text-gray-500">1.0.0</span>
            </div>
            <div className="flex items-center justify-between p-3">
              <span className="text-xs text-white">Network</span>
              <span className="text-xs text-gray-500">Base Sepolia</span>
            </div>
            <div className="flex items-center justify-between p-3">
              <span className="text-xs text-white">$DOJO Contract</span>
              <span className="text-xs text-gray-500 font-mono">
                {DOJO_TOKEN_ADDRESS.slice(0, 6)}...{DOJO_TOKEN_ADDRESS.slice(-4)}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
