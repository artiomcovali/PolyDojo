"use client";

import { scenarios } from "@/lib/scenarios";
import { useEffect, useState } from "react";

interface LearnTabProps {
  userId?: string | null;
}

export default function LearnTab({ userId }: LearnTabProps) {
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<number>>(new Set());
  const [totalXp, setTotalXp] = useState(0);
  const [showingList, setShowingList] = useState(true);

  // Load progress from DB
  useEffect(() => {
    if (!userId) return;
    fetch(`/api/learn?user_id=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.completedIds?.length > 0) {
          setCompletedIds(new Set(data.completedIds));
        }
        if (data.totalXp) setTotalXp(data.totalXp);
      })
      .catch(() => {});
  }, [userId]);

  const currentScenario = scenarios[currentScenarioIndex];

  const handleAnswer = (choiceIndex: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(choiceIndex);

    if (currentScenario.choices[choiceIndex].correct) {
      const alreadyDone = completedIds.has(currentScenario.id);
      setCompletedIds((prev) => new Set(Array.from(prev).concat(currentScenario.id)));
      if (!alreadyDone) {
        setTotalXp((prev) => prev + currentScenario.xp);
        // Save to DB
        if (userId) {
          fetch("/api/learn", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: userId,
              scenario_id: currentScenario.id,
              xp: currentScenario.xp,
            }),
          }).catch(() => {});
        }
      }
    }
  };

  const handleNext = () => {
    setSelectedAnswer(null);
    if (currentScenarioIndex < scenarios.length - 1) {
      setCurrentScenarioIndex(currentScenarioIndex + 1);
    }
    setShowingList(true);
  };

  const startScenario = (index: number) => {
    const scenario = scenarios[index];
    const prevCompleted =
      index === 0 || completedIds.has(scenarios[index - 1].id);
    const alreadyCompleted = completedIds.has(scenario.id);
    if (!prevCompleted && !alreadyCompleted) return;

    setCurrentScenarioIndex(index);
    setSelectedAnswer(null);
    setShowingList(false);
  };

  if (showingList) {
    return (
      <div className="space-y-3 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">Learn</h2>
            <p className="text-[10px] text-gray-500">
              {completedIds.size}/{scenarios.length} completed · {totalXp} XP
            </p>
          </div>
          <div className="bg-yellow-500/10 text-yellow-400 text-xs font-bold px-3 py-1 rounded-full">
            {totalXp} XP
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-800 rounded-full h-2">
          <div
            className="bg-yellow-500 h-2 rounded-full transition-all"
            style={{
              width: `${(completedIds.size / scenarios.length) * 100}%`,
            }}
          />
        </div>

        <div className="space-y-2">
          {scenarios.map((scenario, index) => {
            const isCompleted = completedIds.has(scenario.id);
            const prevCompleted =
              index === 0 || completedIds.has(scenarios[index - 1].id);
            const isLocked = !prevCompleted && !isCompleted;

            return (
              <button
                key={scenario.id}
                onClick={() => startScenario(index)}
                disabled={isLocked}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  isCompleted
                    ? "bg-green-500/10 border-green-500/20"
                    : isLocked
                    ? "bg-gray-900/50 border-gray-800/30 opacity-40 cursor-not-allowed"
                    : "bg-gray-800/30 border-gray-700/30 hover:bg-gray-800/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {isCompleted ? "✅" : isLocked ? "🔒" : "📝"}
                    </span>
                    <div>
                      <div className="text-xs font-medium text-white">
                        #{scenario.id} {scenario.title}
                      </div>
                      <div className="text-[10px] text-gray-500">
                        {scenario.difficulty} · {scenario.xp} XP
                      </div>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full ${
                      scenario.difficulty === "Beginner"
                        ? "bg-green-500/10 text-green-400"
                        : scenario.difficulty === "Intermediate"
                        ? "bg-yellow-500/10 text-yellow-400"
                        : scenario.difficulty === "Advanced"
                        ? "bg-orange-500/10 text-orange-400"
                        : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {scenario.difficulty}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowingList(true)}
          className="text-xs text-gray-400 hover:text-white"
        >
          ← Back
        </button>
        <span className="text-[10px] text-gray-500">
          {currentScenarioIndex + 1} / {scenarios.length}
        </span>
      </div>

      {/* Scenario */}
      <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/30">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-white">
            {currentScenario.title}
          </h3>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full ${
              currentScenario.difficulty === "Beginner"
                ? "bg-green-500/10 text-green-400"
                : currentScenario.difficulty === "Intermediate"
                ? "bg-yellow-500/10 text-yellow-400"
                : currentScenario.difficulty === "Advanced"
                ? "bg-orange-500/10 text-orange-400"
                : "bg-red-500/10 text-red-400"
            }`}
          >
            {currentScenario.difficulty}
          </span>
        </div>
        <p className="text-xs text-gray-300 leading-relaxed">
          {currentScenario.description}
        </p>

        {/* Market snapshot */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="bg-gray-900/50 rounded-lg p-2 text-center">
            <div className="text-[10px] text-gray-500">BTC</div>
            <div className="text-xs font-mono text-white">
              ${currentScenario.setup.currentPrice.toLocaleString()}
            </div>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-2 text-center">
            <div className="text-[10px] text-gray-500">Threshold</div>
            <div className="text-xs font-mono text-blue-400">
              ${currentScenario.setup.threshold.toLocaleString()}
            </div>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-2 text-center">
            <div className="text-[10px] text-gray-500">Time Left</div>
            <div className="text-xs font-mono text-white">
              {Math.floor(currentScenario.setup.secondsRemaining / 60)}:
              {(currentScenario.setup.secondsRemaining % 60)
                .toString()
                .padStart(2, "0")}
            </div>
          </div>
        </div>

        {currentScenario.setup.position && (
          <div className="mt-2 bg-purple-500/10 rounded-lg p-2">
            <span className="text-[10px] text-purple-300">
              Your position:{" "}
              <strong>
                {currentScenario.setup.position.isYes ? "YES" : "NO"}
              </strong>{" "}
              @ {Math.round(currentScenario.setup.position.entryOdds * 100)}¢
            </span>
          </div>
        )}
      </div>

      {/* Choices */}
      <div className="space-y-2">
        {currentScenario.choices.map((choice, i) => {
          const isSelected = selectedAnswer === i;
          const isRevealed = selectedAnswer !== null;
          const isCorrect = choice.correct;

          return (
            <button
              key={i}
              onClick={() => handleAnswer(i)}
              disabled={isRevealed}
              className={`w-full text-left p-3 rounded-xl border transition-all ${
                isRevealed
                  ? isCorrect
                    ? "bg-green-500/10 border-green-500/30"
                    : isSelected
                    ? "bg-red-500/10 border-red-500/30"
                    : "bg-gray-900/30 border-gray-800/30 opacity-50"
                  : "bg-gray-800/30 border-gray-700/30 hover:bg-gray-800/50 active:scale-[0.99]"
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="text-xs mt-0.5">
                  {isRevealed
                    ? isCorrect
                      ? "✅"
                      : isSelected
                      ? "❌"
                      : "⚪"
                    : "⚪"}
                </span>
                <div>
                  <p className="text-xs text-white">{choice.text}</p>
                  {isRevealed && (
                    <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                      {choice.explanation}
                    </p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* XP Award + Next */}
      {selectedAnswer !== null && (
        <div className="space-y-2">
          {currentScenario.choices[selectedAnswer].correct && (
            <div className="text-center bg-yellow-500/10 rounded-xl p-2">
              <span className="text-yellow-400 text-sm font-bold">
                +{currentScenario.xp} XP
              </span>
            </div>
          )}
          <button
            onClick={handleNext}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl text-sm transition-colors"
          >
            {currentScenarioIndex < scenarios.length - 1
              ? "Next Scenario"
              : "Back to List"}
          </button>
        </div>
      )}
    </div>
  );
}
