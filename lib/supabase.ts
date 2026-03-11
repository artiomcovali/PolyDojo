import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export type UserRow = {
  address: string;
  basename: string | null;
  level: string;
  total_score: number;
  win_rate: number;
  chips: number;
  streak: number;
  created_at: string;
};

export type RoundRow = {
  id: number;
  user_address: string;
  round_id: number;
  score: number;
  won: boolean;
  position: "YES" | "NO";
  entry_odds: number;
  exit_odds: number;
  pnl: number;
  ai_tip: string | null;
  ai_review: string | null;
  created_at: string;
};

export type LearnProgressRow = {
  user_address: string;
  scenario_id: number;
  passed: boolean;
  attempts: number;
  xp_earned: number;
};
