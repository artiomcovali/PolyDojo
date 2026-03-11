export interface RoundResult {
  entryOdds: number;
  exitOdds: number;
  resolutionOdds: number;
  isYes: boolean;
  won: boolean;
  betAmount: number;
  totalBalance: number;
  secondsAtEntry: number;
  secondsAtExit: number | null; // null if held to resolution
}

export interface RoundScore {
  entryTiming: number;
  exitTiming: number;
  positionSizing: number;
  outcome: number;
  total: number;
  multiplier: number;
  bonusPoints: number;
  finalScore: number;
}

export function scoreRound(result: RoundResult, streak: number): RoundScore {
  const entryTiming = scoreEntryTiming(result);
  const exitTiming = scoreExitTiming(result);
  const positionSizing = scorePositionSizing(result);
  const outcome = result.won ? 25 : 0;
  const total = entryTiming + exitTiming + positionSizing + outcome;

  let multiplier = 1;
  if (streak >= 10) multiplier = 3.0;
  else if (streak >= 5) multiplier = 2.0;
  else if (streak >= 3) multiplier = 1.5;

  let bonusPoints = 0;
  // Perfect round bonus
  if (entryTiming >= 23 && exitTiming >= 23 && positionSizing >= 23) {
    bonusPoints += 25;
  }

  const finalScore = Math.round(total * multiplier + bonusPoints);

  return {
    entryTiming,
    exitTiming,
    positionSizing,
    outcome,
    total,
    multiplier,
    bonusPoints,
    finalScore,
  };
}

function scoreEntryTiming(result: RoundResult): number {
  // Good entry = buying at odds that turned out to be favorable
  const entryPrice = result.isYes ? result.entryOdds : 1 - result.entryOdds;
  const resolutionValue = result.won ? 1 : 0;
  const edge = resolutionValue - entryPrice;

  if (edge > 0.4) return 25;
  if (edge > 0.2) return 20;
  if (edge > 0.05) return 15;
  if (edge > -0.1) return 10;
  return 5;
}

function scoreExitTiming(result: RoundResult): number {
  if (result.secondsAtExit === null) {
    // Held to resolution
    return result.won ? 20 : 10;
  }

  // Exited early — compare exit odds to resolution
  const exitValue = result.isYes ? result.exitOdds : 1 - result.exitOdds;
  const resolutionValue = result.won ? 1 : 0;

  if (!result.won && exitValue > 0.3) {
    // Got out of a losing position — good exit
    return 25;
  }
  if (result.won && exitValue >= 0.7) {
    // Took profits at good odds
    return 22;
  }
  if (result.won && exitValue < 0.5) {
    // Sold too early on a winner
    return 8;
  }
  return 15;
}

function scorePositionSizing(result: RoundResult): number {
  const betPercent = result.betAmount / result.totalBalance;
  const entryPrice = result.isYes ? result.entryOdds : 1 - result.entryOdds;

  // Kelly-inspired: higher confidence = bigger bets OK
  const impliedEdge = Math.abs(0.5 - entryPrice);

  if (impliedEdge > 0.3) {
    // Strong signal — larger bets are fine
    if (betPercent <= 0.3) return 25;
    if (betPercent <= 0.5) return 20;
    return 10;
  }

  // Moderate signal
  if (betPercent <= 0.1) return 25;
  if (betPercent <= 0.2) return 20;
  if (betPercent <= 0.4) return 15;
  return 5;
}

export function getLevelInfo(totalScore: number): {
  level: string;
  badge: string;
  nextLevel: number;
  progress: number;
} {
  if (totalScore >= 10000) {
    return { level: "Legend", badge: "👑", nextLevel: 10000, progress: 1 };
  }
  if (totalScore >= 5000) {
    return {
      level: "Whale",
      badge: "🐋",
      nextLevel: 10000,
      progress: (totalScore - 5000) / 5000,
    };
  }
  if (totalScore >= 2000) {
    return {
      level: "Shark",
      badge: "🦈",
      nextLevel: 5000,
      progress: (totalScore - 2000) / 3000,
    };
  }
  if (totalScore >= 500) {
    return {
      level: "Trader",
      badge: "💹",
      nextLevel: 2000,
      progress: (totalScore - 500) / 1500,
    };
  }
  return {
    level: "Rookie",
    badge: "📈",
    nextLevel: 500,
    progress: totalScore / 500,
  };
}
