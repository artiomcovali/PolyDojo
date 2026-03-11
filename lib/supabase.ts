import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Public client (read-only, used client-side)
export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// Service role client (full access, server-side only)
export const supabaseAdmin: SupabaseClient | null =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

export type UserRow = {
  id: string;
  fid: number | null;
  address: string | null;
  display_name: string | null;
  pfp_url: string | null;
  balance: number;
  total_score: number;
  win_rate: number;
  rounds_played: number;
  rounds_won: number;
  best_streak: number;
  current_streak: number;
  created_at: string;
  updated_at: string;
};

export type RoundRow = {
  id: string;
  user_id: string;
  round_number: number;
  threshold: number;
  resolution_price: number | null;
  winner: "YES" | "NO" | null;
  total_pnl: number;
  total_wagered: number;
  positions: unknown;
  ai_review: string | null;
  created_at: string;
};

export type LeaderboardRow = {
  id: string;
  display_name: string | null;
  address: string | null;
  total_score: number;
  win_rate: number;
  best_streak: number;
  rounds_played: number;
  rank: number;
};
