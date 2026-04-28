import { NextRequest, NextResponse } from "next/server";
import { isAddress, parseUnits } from "viem";
import { supabaseAdmin } from "@/lib/supabase";
import { publicClient } from "@/lib/chain";
import { DOJO_TOKEN_ABI, DOJO_TOKEN_ADDRESS } from "@/lib/contracts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/positions?round_id=X[&user=0x...]
// Returns pool totals for the round, and optionally the caller's position.
export async function GET(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "db-not-configured" }, { status: 503 });
  }
  const { searchParams } = new URL(req.url);
  const roundIdRaw = searchParams.get("round_id");
  const user = searchParams.get("user");
  if (!roundIdRaw) {
    return NextResponse.json({ error: "round_id-required" }, { status: 400 });
  }
  const roundId = Number(roundIdRaw);
  if (!Number.isFinite(roundId)) {
    return NextResponse.json({ error: "invalid-round_id" }, { status: 400 });
  }

  const { data: rows, error } = await supabaseAdmin
    .from("bets")
    .select("user_address, is_yes, amount, entry_odds_bps, realized_wei, settled")
    .eq("round_id", roundId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let yesPool = BigInt(0);
  let noPool = BigInt(0);
  let myPosition: { is_yes: boolean; amount: string; entry_odds_bps: number } | null = null;
  let myRealized: string = "0";
  const userLc = user?.toLowerCase() ?? null;

  for (const r of rows ?? []) {
    // Once a row is settled onchain, treat it as zero for display: stake and
    // realized P&L have already been credited/debited on-wallet.
    if (r.settled) continue;
    const amt = BigInt(r.amount as string);
    if (r.is_yes) yesPool += amt;
    else noPool += amt;
    if (userLc && (r.user_address as string).toLowerCase() === userLc) {
      if (amt > BigInt(0)) {
        myPosition = {
          is_yes: r.is_yes as boolean,
          amount: r.amount as string,
          entry_odds_bps: (r.entry_odds_bps as number) ?? 5000,
        };
      }
      myRealized = (r.realized_wei as string) ?? "0";
    }
  }

  return NextResponse.json({
    ok: true,
    round_id: roundId,
    yes_pool: yesPool.toString(),
    no_pool: noPool.toString(),
    my_position: myPosition,
    my_realized_wei: myRealized,
  });
}

// POST /api/positions — upsert a user's position for a round.
// Body: { user_address, round_id, is_yes, amount, entry_odds_bps }
// amount=0 deletes the position (withdraw).
export async function POST(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "db-not-configured" }, { status: 503 });
  }
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid-json" }, { status: 400 });

  const { user_address, round_id, is_yes, amount, entry_odds_bps, sell_yes_odds_bps } = body as {
    user_address?: string;
    round_id?: number | string;
    is_yes?: boolean;
    amount?: string;
    entry_odds_bps?: number;
    sell_yes_odds_bps?: number;
  };

  if (!user_address || !isAddress(user_address)) {
    return NextResponse.json({ error: "invalid-address" }, { status: 400 });
  }
  if (round_id === undefined || round_id === null) {
    return NextResponse.json({ error: "round_id-required" }, { status: 400 });
  }
  if (typeof is_yes !== "boolean") {
    return NextResponse.json({ error: "is_yes-required" }, { status: 400 });
  }
  if (typeof amount !== "string" || !/^\d+$/.test(amount)) {
    return NextResponse.json({ error: "invalid-amount" }, { status: 400 });
  }
  const roundIdNum = Number(round_id);
  const amountWei = BigInt(amount);

  // Verify the round exists and isn't resolved yet
  const { data: round } = await supabaseAdmin
    .from("onchain_rounds")
    .select("round_id, end_time, resolved")
    .eq("round_id", roundIdNum)
    .maybeSingle();
  if (!round) {
    return NextResponse.json({ error: "round-not-found" }, { status: 400 });
  }
  if (round.resolved) {
    return NextResponse.json({ error: "round-resolved" }, { status: 400 });
  }
  const nowSec = Math.floor(Date.now() / 1000);
  if (nowSec >= Number(round.end_time)) {
    return NextResponse.json({ error: "round-ended" }, { status: 400 });
  }

  // Sell: mark-to-market the open position, bank the P&L in realized_wei,
  // and zero out the open amount. The cron will credit realized_wei onchain
  // at round end alongside any still-open position.
  if (amountWei === BigInt(0)) {
    const { data: existing } = await supabaseAdmin
      .from("bets")
      .select("is_yes, amount, entry_odds_bps, realized_wei")
      .eq("user_address", user_address)
      .eq("round_id", roundIdNum)
      .maybeSingle();
    if (!existing) {
      return NextResponse.json({ ok: true, withdrawn: true });
    }
    const openWei = BigInt((existing.amount as string) ?? "0");
    const prevRealized = BigInt((existing.realized_wei as string) ?? "0");
    let pnlWei = BigInt(0);
    if (openWei > BigInt(0)) {
      const entryBps = Math.max(
        100,
        Math.min(9900, (existing.entry_odds_bps as number) ?? 5000)
      );
      // Current price of the side the user actually holds, in bps.
      const yesBps = typeof sell_yes_odds_bps === "number"
        ? Math.max(100, Math.min(9900, Math.round(sell_yes_odds_bps)))
        : 5000;
      const sideBpsNow = (existing.is_yes as boolean) ? yesBps : 10000 - yesBps;
      // shares = openWei / entryPrice; value = shares * currentPrice;
      // pnl = value - openWei = openWei * (currentBps/entryBps - 1)
      const value = (openWei * BigInt(sideBpsNow)) / BigInt(entryBps);
      pnlWei = value - openWei;
    }
    const newRealized = prevRealized + pnlWei;
    const { error: upErr } = await supabaseAdmin
      .from("bets")
      .update({
        amount: "0",
        realized_wei: newRealized.toString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_address", user_address)
      .eq("round_id", roundIdNum);
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
    return NextResponse.json({
      ok: true,
      withdrawn: true,
      realized_wei: newRealized.toString(),
      pnl_wei: pnlWei.toString(),
    });
  }

  // Cap position at user's current onchain DOJO balance
  const onchainBalance = (await publicClient.readContract({
    address: DOJO_TOKEN_ADDRESS,
    abi: DOJO_TOKEN_ABI,
    functionName: "balanceOf",
    args: [user_address as `0x${string}`],
  })) as bigint;

  if (amountWei > onchainBalance) {
    return NextResponse.json(
      { error: "insufficient-balance", balance: onchainBalance.toString() },
      { status: 400 }
    );
  }

  // Enforce a minimum bet to avoid dust spam
  const minBetWei = parseUnits("1", 18);
  if (amountWei < minBetWei) {
    return NextResponse.json({ error: "below-minimum" }, { status: 400 });
  }

  // Entry odds: clamp to 1¢-99¢ band (matches UI clamp) so settlement math
  // never divides by zero. Default to 50¢ if the client didn't send one.
  let oddsBps = typeof entry_odds_bps === "number" ? entry_odds_bps : 5000;
  oddsBps = Math.max(100, Math.min(9900, Math.round(oddsBps)));

  // Preserve any accumulated realized P&L from earlier sells this round.
  const { data: prev } = await supabaseAdmin
    .from("bets")
    .select("realized_wei")
    .eq("user_address", user_address)
    .eq("round_id", roundIdNum)
    .maybeSingle();
  const carriedRealized = (prev?.realized_wei as string) ?? "0";

  const { error: upErr } = await supabaseAdmin.from("bets").upsert(
    {
      user_address,
      round_id: roundIdNum,
      is_yes,
      amount: amountWei.toString(),
      entry_odds_bps: oddsBps,
      realized_wei: carriedRealized,
      tx_hash: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_address,round_id" }
  );
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

// DELETE /api/positions?user_address=0x...&round_id=X
export async function DELETE(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "db-not-configured" }, { status: 503 });
  }
  const { searchParams } = new URL(req.url);
  const user = searchParams.get("user_address");
  const roundIdRaw = searchParams.get("round_id");
  if (!user || !isAddress(user)) {
    return NextResponse.json({ error: "invalid-address" }, { status: 400 });
  }
  if (!roundIdRaw) {
    return NextResponse.json({ error: "round_id-required" }, { status: 400 });
  }
  const { error } = await supabaseAdmin
    .from("bets")
    .delete()
    .eq("user_address", user)
    .eq("round_id", Number(roundIdRaw));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
