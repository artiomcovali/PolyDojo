"use client";

import { useState } from "react";

interface SettingsPageProps {
  presets: number[];
  onPresetsChange: (presets: number[]) => void;
  soundEffects: boolean;
  onSoundEffectsChange: (enabled: boolean) => void;
  onClose: () => void;
}

export default function SettingsPage({
  presets,
  onPresetsChange,
  soundEffects,
  onSoundEffectsChange,
  onClose,
}: SettingsPageProps) {
  const [notifications, setNotifications] = useState(true);
  const [roundDuration, setRoundDuration] = useState<"3" | "5" | "10">("5");
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

        {/* Trading */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Trading
          </h3>
          <div className="bg-gray-800/30 rounded-xl border border-gray-800/50 divide-y divide-gray-800/50">
            <div className="flex items-center justify-between p-3">
              <div>
                <span className="text-xs text-white">Round Duration</span>
                <p className="text-[10px] text-gray-500">
                  Length of each prediction market
                </p>
              </div>
              <div className="flex gap-1">
                {(["3", "5", "10"] as const).map((val) => (
                  <button
                    key={val}
                    onClick={() => setRoundDuration(val)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all ${
                      roundDuration === val
                        ? "bg-blue-600 text-white"
                        : "bg-gray-800 text-gray-400"
                    }`}
                  >
                    {val}m
                  </button>
                ))}
              </div>
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
                onClick={() => setNotifications(!notifications)}
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
                0x0000...0000
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
