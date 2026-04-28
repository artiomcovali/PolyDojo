import "server-only";
import { supabaseAdmin } from "@/lib/supabase";
import { publicClient, getDeployerWallet, currentWindowStart, windowEnd } from "@/lib/chain";
import {
  CHAINLINK_ABI,
  CHAINLINK_BTC_USD,
  DOJO_TOKEN_ABI,
  DOJO_TOKEN_ADDRESS,
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
  return data[1];
}

// The display + Polymarket's question treat the Coinbase 1-min candle open at
// window start as the threshold. Settle against the same number or users see
// "won on screen, lost on chain" (and vice versa). Returns a bigint scaled to
// Chainlink's 8 decimals so it's directly comparable with `latestRoundData`.
async function fetchCoinbaseOpenAtWindowStartOnce(
  windowStartSec: number
): Promise<bigint | null> {
  const windowStartMs = windowStartSec * 1000;
  try {
    const startISO = new Date(windowStartMs).toISOString();
    const endISO = new Date(windowStartMs + 60000).toISOString();
    const res = await fetch(
      `https://api.exchange.coinbase.com/products/BTC-USD/candles?granularity=60&start=${startISO}&end=${endISO}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    const candles = (await res.json()) as number[][];
    if (!Array.isArray(candles) || candles.length === 0) return null;
    candles.sort((a, b) => a[0] - b[0]);
    // [time, low, high, open, close, volume] — index 3 is open.
    const open = candles[0][3];
    if (!Number.isFinite(open) || open <= 0) return null;
    return BigInt(Math.round(open * 1e8));
  } catch {
    return null;
  }
}

// The 1-min candle for a window is sometimes not returned by Coinbase for
// several seconds after the minute opens. Retry a few times so we don't fall
// back to Chainlink-now (which diverges from the displayed threshold).
async function fetchCoinbaseOpenAtWindowStart(windowStartSec: number): Promise<bigint | null> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const v = await fetchCoinbaseOpenAtWindowStartOnce(windowStartSec);
    if (v !== null) return v;
    await new Promise((r) => setTimeout(r, 2000));
  }
  return null;
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

  // Prefer the same threshold Polymarket's question uses (Coinbase candle
  // open at window start) so screen P&L and onchain settlement agree. Fall
  // back to Chainlink-now only as a last resort — that fallback causes a
  // displayed-winner vs settled-winner mismatch, so log loudly when it fires.
  const coinbaseOpen = await fetchCoinbaseOpenAtWindowStart(roundId);
  let threshold: bigint;
  if (coinbaseOpen !== null) {
    threshold = coinbaseOpen;
  } else {
    threshold = await readChainlinkBtc();
    console.warn(
      `[rounds] round ${roundId}: Coinbase candle unavailable after retries — ` +
        `falling back to Chainlink-now (${threshold}). Display threshold may not match settlement.`
    );
  }

  const wallet = getDeployerWallet();
  const txHash = await wallet.writeContract({
    address: GAME_MANAGER_ADDRESS,
    abi: GAME_MANAGER_ABI,
    functionName: "createRound",
    args: [BigInt(roundId), threshold],
    gas: BigInt(200000),
  });
  const createReceipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
  if (createReceipt.status !== "success") {
    // Don't persist the DB row — otherwise the round becomes a ghost that
    // blocks settlement forever (cron retries, GameManager says "Round does
    // not exist," nothing ever resolves).
    throw new Error(`createRound reverted for round ${roundId} (tx ${txHash})`);
  }

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

interface Position {
  user_address: string;
  is_yes: boolean;
  amount: bigint;
  entry_odds_bps: number; // price of the side they bought, at entry, in bps
  realized_wei: bigint;   // P&L already banked via mid-round sells
}

/// Fixed-odds-at-entry settlement: each open position settles independently
/// against the house based on the Polymarket odds captured at bet time. Winner
/// payout works like a Polymarket share: stake / entryProb = payout, so profit
/// = stake * (1 - entryProb) / entryProb. Loser forfeits stake. Any realized
/// P&L from earlier mid-round sells is added on top.
function computeDeltas(
  positions: Position[],
  yesWins: boolean
): { user: `0x${string}`; delta: bigint }[] {
  const out: { user: `0x${string}`; delta: bigint }[] = [];
  for (const p of positions) {
    let delta = p.realized_wei;
    if (p.amount > BigInt(0)) {
      const won = p.is_yes === yesWins;
      if (won) {
        const bps = Math.max(100, Math.min(9900, p.entry_odds_bps || 5000));
        // profit = stake * (10000 - bps) / bps, using bigint math
        const profit = (p.amount * BigInt(10000 - bps)) / BigInt(bps);
        delta += profit;
      } else {
        delta -= p.amount;
      }
    }
    if (delta !== BigInt(0)) {
      out.push({ user: p.user_address as `0x${string}`, delta });
    }
  }
  return out;
}

export async function resolveDueRounds(nowSec: number = Math.floor(Date.now() / 1000)): Promise<
  Array<{ roundId: number; txHash: `0x${string}`; resolutionPrice: string; yesWins: boolean; participants: number }>
> {
  if (!supabaseAdmin) throw new Error("supabase not configured");
  if (GAME_MANAGER_ADDRESS === ZERO) throw new Error("GameManager not deployed");

  // Small buffer so the Chainlink aggregator has time to post a fresh round
  // after the market window closes; too long and users see stale balances.
  const grace = 3;
  const { data: due, error } = await supabaseAdmin
    .from("onchain_rounds")
    .select("round_id, threshold, end_time")
    .eq("resolved", false)
    .lte("end_time", nowSec - grace);
  if (error) throw new Error(error.message);
  if (!due || due.length === 0) return [];

  const wallet = getDeployerWallet();

  // Owner vs backend-wallet diagnostics. settleRound is onlyOwner on
  // GameManager; if the backend wallet isn't the owner, every tx reverts.
  const ownerAbi = [
    { inputs: [], name: "owner", outputs: [{ name: "", type: "address" }], stateMutability: "view", type: "function" },
  ] as const;
  const [gmOwner, dojoOwner] = await Promise.all([
    publicClient.readContract({ address: GAME_MANAGER_ADDRESS, abi: ownerAbi, functionName: "owner" }) as Promise<`0x${string}`>,
    publicClient.readContract({ address: DOJO_TOKEN_ADDRESS, abi: ownerAbi, functionName: "owner" }) as Promise<`0x${string}`>,
  ]);
  const backendAddr = wallet.account.address;
  console.log(
    `[settle-preflight] backend=${backendAddr} gmOwner=${gmOwner} dojoOwner=${dojoOwner} ` +
      `gmMatch=${backendAddr.toLowerCase() === gmOwner.toLowerCase()} ` +
      `dojoMatch=${backendAddr.toLowerCase() === dojoOwner.toLowerCase()}`
  );

  // Make sure GameManager is authorized to mint/burn DOJO. If the minter bit
  // got lost (fresh deploy, manual override, etc.) settleRound would silently
  // revert and users would see "you won" with no balance change. Authorize
  // once up-front; no-op if it's already set.
  const isMinter = (await publicClient.readContract({
    address: DOJO_TOKEN_ADDRESS,
    abi: DOJO_TOKEN_ABI,
    functionName: "minters",
    args: [GAME_MANAGER_ADDRESS],
  })) as boolean;
  console.log(`[settle-preflight] GameManager isMinter=${isMinter}`);
  if (!isMinter) {
    const setMinterTx = await wallet.writeContract({
      address: DOJO_TOKEN_ADDRESS,
      abi: DOJO_TOKEN_ABI,
      functionName: "setMinter",
      args: [GAME_MANAGER_ADDRESS, true],
      gas: BigInt(80000),
    });
    const setMinterReceipt = await publicClient.waitForTransactionReceipt({ hash: setMinterTx });
    if (setMinterReceipt.status !== "success") {
      throw new Error(`setMinter reverted (${setMinterTx})`);
    }
  }

  const results: Array<{ roundId: number; txHash: `0x${string}`; resolutionPrice: string; yesWins: boolean; participants: number }> = [];

  for (const r of due) {
    const roundId = Number(r.round_id);
    const threshold = BigInt(r.threshold);

    const chainlinkPrice = await readChainlinkBtc();
    const yesWins = chainlinkPrice >= threshold;

    const { data: posRows, error: posErr } = await supabaseAdmin
      .from("bets")
      .select("user_address, is_yes, amount, entry_odds_bps, realized_wei")
      .eq("round_id", roundId);
    if (posErr) throw new Error(posErr.message);

    const positions: Position[] = (posRows ?? []).map((p) => ({
      user_address: p.user_address as string,
      is_yes: p.is_yes as boolean,
      amount: BigInt((p.amount as string) ?? "0"),
      entry_odds_bps: (p.entry_odds_bps as number) ?? 5000,
      realized_wei: BigInt((p.realized_wei as string) ?? "0"),
    }));

    const deltas = computeDeltas(positions, yesWins);

    // Dump every position + computed delta so when users report "mint didn't
    // match what I saw on screen," we have authoritative evidence of what the
    // DB held at settlement time. Prefix tagged for easy grep in Vercel logs.
    for (const p of positions) {
      const d = deltas.find((x) => x.user.toLowerCase() === p.user_address.toLowerCase());
      console.log(
        `[settle r=${roundId} yesWins=${yesWins}] user=${p.user_address} ` +
          `is_yes=${p.is_yes} amount=${p.amount} entry_bps=${p.entry_odds_bps} ` +
          `realized=${p.realized_wei} -> delta=${d ? d.delta : "0 (skipped)"}`
      );
    }

    const users = deltas.map((d) => d.user);
    const deltaValues = deltas.map((d) => d.delta);

    // No participants — nothing to mint/burn. Skip the onchain tx and just
    // mark the round resolved so it stops tripping the cron. This also
    // clears orphan rounds (DB row with no successful onchain createRound).
    if (users.length === 0) {
      console.log(`[settle r=${roundId}] no participants — marking resolved with no onchain tx`);
      await supabaseAdmin
        .from("onchain_rounds")
        .update({
          resolved: true,
          resolution_price: chainlinkPrice.toString(),
          yes_wins: yesWins,
          resolved_tx: null,
          resolved_at: new Date().toISOString(),
        })
        .eq("round_id", roundId);
      results.push({
        roundId,
        txHash: "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`,
        resolutionPrice: chainlinkPrice.toString(),
        yesWins,
        participants: 0,
      });
      continue;
    }

    // Simulate first so a revert surfaces the actual reason string instead of
    // just "execution reverted". Common causes: backend wallet isn't the
    // GameManager owner, round wasn't created onchain, round already settled.
    try {
      await publicClient.simulateContract({
        account: wallet.account,
        address: GAME_MANAGER_ADDRESS,
        abi: GAME_MANAGER_ABI,
        functionName: "settleRound",
        args: [BigInt(roundId), chainlinkPrice, users, deltaValues],
      });
    } catch (simErr) {
      const msg = simErr instanceof Error ? simErr.message : String(simErr);
      console.error(`[settle r=${roundId}] simulation failed:`, msg);
      throw new Error(`settleRound simulation reverted for round ${roundId}: ${msg}`);
    }

    const txHash = await wallet.writeContract({
      address: GAME_MANAGER_ADDRESS,
      abi: GAME_MANAGER_ABI,
      functionName: "settleRound",
      args: [BigInt(roundId), chainlinkPrice, users, deltaValues],
      gas: BigInt(300000 + users.length * 80000),
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    if (receipt.status !== "success") {
      // Leave the bets rows un-settled so the next cron run can retry. Don't
      // flip the round to `resolved`, either — that's what `onchain_rounds`
      // controls and we only set it after a successful mint/burn below.
      throw new Error(`settleRound reverted for round ${roundId} (tx ${txHash})`);
    }

    // Mark DB rows as settled with their realized delta. Zero out the stake
    // and realized_wei so any lingering polls don't subtract an already-paid
    // position from the user's displayed balance.
    if (positions.length > 0) {
      const deltaMap = new Map(deltas.map((d) => [d.user.toLowerCase(), d.delta]));
      for (const p of positions) {
        const d = deltaMap.get(p.user_address.toLowerCase()) ?? p.realized_wei - p.amount;
        await supabaseAdmin
          .from("bets")
          .update({
            settled: true,
            settled_delta: d.toString(),
            amount: "0",
            realized_wei: "0",
          })
          .eq("user_address", p.user_address)
          .eq("round_id", roundId);
      }
    }

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
      participants: positions.length,
    });
  }

  return results;
}
