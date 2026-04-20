import { NextRequest, NextResponse } from "next/server";
import { isAddress, isHex } from "viem";
import { supabaseAdmin } from "@/lib/supabase";
import { publicClient } from "@/lib/chain";
import { GAME_MANAGER_ABI, GAME_MANAGER_ADDRESS } from "@/lib/contracts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid-json" }, { status: 400 });

  const { user_address, round_id, is_yes, amount, entry_odds_bps, tx_hash } = body as {
    user_address?: string;
    round_id?: number | string;
    is_yes?: boolean;
    amount?: string;
    entry_odds_bps?: number;
    tx_hash?: string;
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
  if (!amount || !/^\d+$/.test(amount)) {
    return NextResponse.json({ error: "invalid-amount" }, { status: 400 });
  }
  if (
    typeof entry_odds_bps !== "number" ||
    entry_odds_bps < 0 ||
    entry_odds_bps > 10000
  ) {
    return NextResponse.json({ error: "invalid-odds" }, { status: 400 });
  }
  if (!tx_hash || !isHex(tx_hash)) {
    return NextResponse.json({ error: "invalid-tx-hash" }, { status: 400 });
  }

  const roundIdNum = Number(round_id);

  // Confirm tx exists on Base Sepolia and succeeded
  try {
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: tx_hash as `0x${string}`,
      timeout: 20_000,
    });
    if (receipt.status !== "success") {
      return NextResponse.json({ error: "tx-reverted" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "tx-not-found" }, { status: 400 });
  }

  // Verify the bet actually exists on-chain for this user+round
  const bet = (await publicClient.readContract({
    address: GAME_MANAGER_ADDRESS,
    abi: GAME_MANAGER_ABI,
    functionName: "getBet",
    args: [BigInt(roundIdNum), user_address as `0x${string}`],
  })) as readonly [boolean, bigint, bigint, boolean];
  const [, onchainAmount, , exists] = bet;
  if (!exists) {
    return NextResponse.json({ error: "bet-not-on-chain" }, { status: 400 });
  }
  if (onchainAmount.toString() !== amount) {
    return NextResponse.json({ error: "amount-mismatch" }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("bets").upsert(
    {
      user_address,
      round_id: roundIdNum,
      is_yes,
      amount,
      entry_odds_bps,
      tx_hash,
    },
    { onConflict: "user_address,round_id" }
  );
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
