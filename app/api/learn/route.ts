import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

// GET /api/learn?user_id=xxx — get learn progress
export async function GET(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const userId = req.nextUrl.searchParams.get("user_id");
  if (!userId) return NextResponse.json({ error: "user_id required" }, { status: 400 });

  const { data } = await supabaseAdmin
    .from("players")
    .select("learn_completed, learn_xp")
    .eq("id", userId)
    .single();

  return NextResponse.json({
    completedIds: data?.learn_completed || [],
    totalXp: data?.learn_xp || 0,
  });
}

// POST /api/learn — save completed scenario
export async function POST(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { user_id, scenario_id, xp } = await req.json();
  if (!user_id) return NextResponse.json({ error: "user_id required" }, { status: 400 });

  // Get current progress
  const { data: player } = await supabaseAdmin
    .from("players")
    .select("learn_completed, learn_xp")
    .eq("id", user_id)
    .single();

  const current = player?.learn_completed || [];
  if (current.includes(scenario_id)) {
    return NextResponse.json({ success: true }); // Already completed
  }

  const updated = [...current, scenario_id];

  await supabaseAdmin
    .from("players")
    .update({
      learn_completed: updated,
      learn_xp: (player?.learn_xp || 0) + xp,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user_id);

  return NextResponse.json({ success: true });
}
