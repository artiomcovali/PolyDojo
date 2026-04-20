import "server-only";
import { supabaseAdmin } from "@/lib/supabase";
import { publicClient, getDeployerWallet, currentWindowStart, windowEnd } from "@/lib/chain";
import {
  CHAINLINK_ABI,
  CHAINLINK_BTC_USD,
  GAME_MANAGER_ABI,
  GAME_MANAGER_ADDRESS,
} from "@/lib/contracts";

const ZERO = "0x0000000000000000000000000000000000000000";

async function readChainlinkBtc(): Promise<bigint> {
  const data = (await publicClient.readContract({
    address: CHAINLINK_BTC_USD,
    abi: CHAINLINK_ABI,
    functionName: "latestRoundData",
  })) as readonly [bigint, bigint, bigint, bigint, bigint];
  return data[1]; // answer, 8 decimals
}

export async function ensureCurrentRound(): Promise<{
  roundId: number;
  threshold: string;
  endTime: number;
  created: boolean;
}> {
  if (!supabaseAdmin) throw new Error("supabase not configured");
  if (GAME_MANAGER_ADDRESS === ZERO) throw new Error("GameManager not deployed");

  const roundId = currentWindowStart();
  const endTime = windowEnd(roundId);

  const { data: existing } = await supabaseAdmin
    .from("onchain_rounds")
    .select("*")
    .eq("round_id", roundId)
    .maybeSingle();
  if (existing) {
    return { roundId, threshold: String(existing.threshold), endTime, created: false };
  }

  // Read current BTC price from Chainlink as the threshold
  const threshold = await readChainlinkBtc();

  // Create onchain
  const wallet = getDeployerWallet();
  const txHash = await wallet.writeContract({
    address: GAME_MANAGER_ADDRESS,
    abi: GAME_MANAGER_ABI,
    functionName: "createRound",
    args: [BigInt(roundId), threshold],
    gas: BigInt(200000),
  });
  await publicClient.waitForTransactionReceipt({ hash: txHash });

  // Record in Supabase (onConflict no-op in case of race)
  await supabaseAdmin
    .from("onchain_rounds")
    .upsert(
      {
        round_id: roundId,
        threshold: threshold.toString(),
        end_time: endTime,
        resolved: false,
        created_tx: txHash,
      },
      { onConflict: "round_id" }
    );

  return { roundId, threshold: threshold.toString(), endTime, created: true };
}

export async function resolveDueRounds(nowSec: number = Math.floor(Date.now() / 1000)): Promise<
  Array<{ roundId: number; txHash: `0x${string}`; resolutionPrice: string; yesWins: boolean; participants: number }>
> {
  if (!supabaseAdmin) throw new Error("supabase not configured");
  if (GAME_MANAGER_ADDRESS === ZERO) throw new Error("GameManager not deployed");

  const grace = 30; // seconds past end_time before we try to resolve
  const { data: due, error } = await supabaseAdmin
    .from("onchain_rounds")
    .select("round_id, threshold, end_time")
    .eq("resolved", false)
    .lte("end_time", nowSec - grace);
  if (error) throw new Error(error.message);
  if (!due || due.length === 0) return [];

  const wallet = getDeployerWallet();
  const results: Array<{ roundId: number; txHash: `0x${string}`; resolutionPrice: string; yesWins: boolean; participants: number }> = [];

  for (const r of due) {
    const roundId = Number(r.round_id);
    const threshold = BigInt(r.threshold);

    const chainlinkPrice = await readChainlinkBtc();
    const yesWins = chainlinkPrice >= threshold;

    const { data: bets } = await supabaseAdmin
      .from("bets")
      .select("user_address")
      .eq("round_id", roundId);
    const participants = (bets ?? []).map((b) => b.user_address as `0x${string}`);

    const txHash = await wallet.writeContract({
      address: GAME_MANAGER_ADDRESS,
      abi: GAME_MANAGER_ABI,
      functionName: "resolveRound",
      args: [BigInt(roundId), chainlinkPrice, participants],
      // Resolution iterates participants; give it headroom.
      gas: BigInt(500000 + participants.length * 80000),
    });
    await publicClient.waitForTransactionReceipt({ hash: txHash });

    await supabaseAdmin
      .from("onchain_rounds")
      .update({
        resolved: true,
        resolution_price: chainlinkPrice.toString(),
        yes_wins: yesWins,
        resolved_tx: txHash,
        resolved_at: new Date().toISOString(),
      })
      .eq("round_id", roundId);

    results.push({
      roundId,
      txHash,
      resolutionPrice: chainlinkPrice.toString(),
      yesWins,
      participants: participants.length,
    });
  }

  return results;
}
