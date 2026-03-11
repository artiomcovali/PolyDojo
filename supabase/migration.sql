-- PolyDojo Database Schema (already applied)
-- Tables: players, rounds
-- View: leaderboard

CREATE TABLE players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fid BIGINT UNIQUE,
  address TEXT UNIQUE,
  display_name TEXT,
  pfp_url TEXT,
  balance INTEGER DEFAULT 1000,
  total_score INTEGER DEFAULT 0,
  win_rate REAL DEFAULT 0,
  rounds_played INTEGER DEFAULT 0,
  rounds_won INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE rounds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES players(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  threshold REAL NOT NULL,
  resolution_price REAL,
  winner TEXT CHECK (winner IN ('YES', 'NO')),
  total_pnl INTEGER DEFAULT 0,
  total_wagered INTEGER DEFAULT 0,
  positions JSONB DEFAULT '[]',
  ai_review TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE VIEW leaderboard AS
SELECT
  id, display_name, address, total_score, win_rate, best_streak, rounds_played,
  RANK() OVER (ORDER BY total_score DESC) as rank
FROM players
WHERE rounds_played > 0
ORDER BY total_score DESC
LIMIT 100;

CREATE INDEX idx_players_total_score ON players(total_score DESC);
CREATE INDEX idx_rounds_user_id ON rounds(user_id);
CREATE INDEX idx_players_fid ON players(fid);

ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players are viewable by everyone" ON players FOR SELECT USING (true);
CREATE POLICY "Service role can manage players" ON players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Rounds are viewable by everyone" ON rounds FOR SELECT USING (true);
CREATE POLICY "Service role can manage rounds" ON rounds FOR ALL USING (true) WITH CHECK (true);
