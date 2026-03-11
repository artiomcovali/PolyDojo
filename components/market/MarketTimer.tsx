"use client";

interface MarketTimerProps {
  secondsRemaining: number;
  isResolved: boolean;
}

export default function MarketTimer({ secondsRemaining, isResolved }: MarketTimerProps) {
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const isUrgent = secondsRemaining <= 60 && !isResolved;

  return (
    <div className="text-center">
      <div
        className={`font-mono text-3xl font-bold tabular-nums ${
          isResolved
            ? "text-gray-500"
            : isUrgent
            ? "text-red-400 animate-pulse"
            : "text-white"
        }`}
      >
        {minutes}:{seconds.toString().padStart(2, "0")}
      </div>
      <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">
        {isResolved ? "Resolved" : "Remaining"}
      </div>
    </div>
  );
}
