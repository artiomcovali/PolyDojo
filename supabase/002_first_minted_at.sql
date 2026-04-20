-- Adds tracking for the initial 1000 DOJO mint so /api/users POST is idempotent.
ALTER TABLE players ADD COLUMN IF NOT EXISTS first_minted_at TIMESTAMPTZ;
