-- Onchain-backing tables for real $DOJO wagering.
-- round_id is the unix timestamp of the 5-minute window start (same as Polymarket slug and GameManager roundId).

CREATE TABLE IF NOT EXISTS onchain_rounds (
  round_id BIGINT PRIMARY KEY,
  threshold BIGINT NOT NULL,           -- Chainlink-scaled (8 decimals)
  end_time BIGINT NOT NULL,            -- unix seconds
  resolution_price BIGINT,             -- populated on resolution
  yes_wins BOOLEAN,                    -- populated on resolution
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  created_tx TEXT,
  resolved_tx TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_onchain_rounds_unresolved
  ON onchain_rounds(resolved, end_time)
  WHERE resolved = FALSE;

CREATE TABLE IF NOT EXISTS bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_address TEXT NOT NULL,
  round_id BIGINT NOT NULL REFERENCES onchain_rounds(round_id) ON DELETE CASCADE,
  is_yes BOOLEAN NOT NULL,
  amount NUMERIC(78, 0) NOT NULL,      -- DOJO wei (ERC-20 base units)
  entry_odds_bps INT NOT NULL,         -- 0-10000
  tx_hash TEXT NOT NULL,
  placed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_address, round_id)
);

CREATE INDEX IF NOT EXISTS idx_bets_round ON bets(round_id);
CREATE INDEX IF NOT EXISTS idx_bets_user ON bets(user_address);

ALTER TABLE onchain_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Rounds readable by all" ON onchain_rounds FOR SELECT USING (true);
CREATE POLICY "Rounds manageable by service" ON onchain_rounds FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Bets readable by all" ON bets FOR SELECT USING (true);
CREATE POLICY "Bets manageable by service" ON bets FOR ALL USING (true) WITH CHECK (true);
