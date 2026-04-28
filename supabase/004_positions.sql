-- Shift `bets` from one-shot onchain receipts to mutable off-chain positions.
-- A user now has exactly one row per (user_address, round_id) that can be
-- flipped/resized freely during the round. Settlement happens onchain at
-- round end via GameManager.settleRound with computed net deltas.

ALTER TABLE bets ALTER COLUMN entry_odds_bps DROP NOT NULL;
ALTER TABLE bets ALTER COLUMN tx_hash DROP NOT NULL;

ALTER TABLE bets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE bets ADD COLUMN IF NOT EXISTS settled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE bets ADD COLUMN IF NOT EXISTS settled_delta NUMERIC(78, 0);

CREATE INDEX IF NOT EXISTS idx_bets_round_unsettled
  ON bets(round_id)
  WHERE settled = FALSE;
