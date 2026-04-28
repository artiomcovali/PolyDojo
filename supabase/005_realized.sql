-- Track realized P&L on sells. When a user sells mid-round, we mark the open
-- position amount to 0 and add the mark-to-market profit/loss here. At round
-- end, GameManager.settleRound applies `realized_wei + fixedOddsPayout(amount)`
-- per user. Signed so losses are negative.

ALTER TABLE bets ADD COLUMN IF NOT EXISTS realized_wei NUMERIC(78, 0) NOT NULL DEFAULT 0;
