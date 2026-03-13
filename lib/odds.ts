// Normal distribution CDF approximation
function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);

  const t = 1.0 / (1.0 + p * x);
  const y =
    1.0 -
    ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1.0 + sign * y);
}

// Game-tuned odds: calibrated so odds stay ~50/50 early and converge
// sharply as time runs out, similar to real Polymarket behavior.
// Tuned for 5-min rounds with ±$50 threshold offsets.
const MAX_EXPECTED_MOVE = 300;

export function calculateOdds(
  currentPrice: number,
  threshold: number,
  secondsRemaining: number,
  roundDuration: number = 300
): { yesOdds: number; noOdds: number } {
  if (secondsRemaining <= 0) {
    const yes = currentPrice >= threshold ? 1 : 0;
    return { yesOdds: yes, noOdds: 1 - yes };
  }

  const distance = currentPrice - threshold;
  const timeFraction = secondsRemaining / roundDuration;

  const expectedMove = MAX_EXPECTED_MOVE * Math.sqrt(timeFraction);

  if (expectedMove < 0.01) {
    const yes = distance >= 0 ? 1 : 0;
    return { yesOdds: yes, noOdds: 1 - yes };
  }

  const zScore = distance / expectedMove;
  let yesProb = normalCDF(zScore);

  // Clamp between 1¢ and 99¢
  yesProb = Math.max(0.01, Math.min(0.99, yesProb));

  return {
    yesOdds: Math.round(yesProb * 100) / 100,
    noOdds: Math.round((1 - yesProb) * 100) / 100,
  };
}

export function formatOdds(odds: number): string {
  return `${Math.round(odds * 100)}¢`;
}

export function calculatePnL(
  entryOdds: number,
  currentOdds: number,
  amount: number,
  isYes: boolean
): number {
  const entryPrice = isYes ? entryOdds : 1 - entryOdds;
  const currentPrice = isYes ? currentOdds : 1 - currentOdds;
  const shares = amount / entryPrice;
  return shares * currentPrice - amount;
}
