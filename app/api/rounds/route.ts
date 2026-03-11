import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

// POST /api/rounds — save a completed round
export async function POST(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const {
    user_id,
    round_number,
    threshold,
    resolution_price,
    winner,
    total_pnl,
    total_wagered,
    positions,
    ai_review,
  } = await req.json();

  if (!user_id) {
    return NextResponse.json({ error: "user_id required" }, { status: 400 });
  }

  // Insert round
  const { error: roundError } = await supabaseAdmin.from("rounds").insert({
    user_id,
    round_number,
    threshold,
    resolution_price,
    winner,
    total_pnl,
    total_wagered,
    positions,
    ai_review,
  });

  if (roundError) {
    return NextResponse.json({ error: roundError.message }, { status: 500 });
  }

  // Update user stats
  const { data: user } = await supabaseAdmin
    .from("players")
    .select("balance, total_score, rounds_played, rounds_won, best_streak, current_streak")
    .eq("id", user_id)
    .single();

  if (user) {
    const won = total_pnl > 0;
    const newStreak = won ? user.current_streak + 1 : 0;
    const newRoundsWon = user.rounds_won + (won ? 1 : 0);
    const newRoundsPlayed = user.rounds_played + 1;

    await supabaseAdmin
      .from("players")
      .update({
        balance: user.balance + total_pnl,
        total_score: user.total_score + Math.max(0, total_pnl),
        rounds_played: newRoundsPlayed,
        rounds_won: newRoundsWon,
        win_rate: newRoundsPlayed > 0 ? Math.round((newRoundsWon / newRoundsPlayed) * 100) : 0,
        current_streak: newStreak,
        best_streak: Math.max(user.best_streak, newStreak),
        updated_at: new Date().toISOString(),
      })
      .eq("id", user_id);
  }

  return NextResponse.json({ success: true });
}
