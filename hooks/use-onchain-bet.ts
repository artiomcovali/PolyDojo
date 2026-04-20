"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPublicClient, http, formatUnits } from "viem";
import { baseSepolia } from "viem/chains";
import { GAME_MANAGER_ABI, GAME_MANAGER_ADDRESS } from "@/lib/contracts";

const client = createPublicClient({ chain: baseSepolia, transport: http() });
const ZERO = "0x0000000000000000000000000000000000000000";

export interface OnchainBet {
  isYes: boolean;
  amount: string;
  amountFmt: number;
  oddsAtEntryBps: number;
  exists: boolean;
}

export interface OnchainRound {
  threshold: string;
  resolutionPrice: string;
  startTime: number;
  resolved: boolean;
}

export function useOnchainBet(
  walletAddress: string | null,
  roundId: number | null,
  pollMs: number = 8000
) {
  const [bet, setBet] = useState<OnchainBet | null>(null);
  const [round, setRound] = useState<OnchainRound | null>(null);
  const [loading, setLoading] = useState(false);
  const refetchRef = useRef<() => Promise<void>>(() => Promise.resolve());

  const load = useCallback(async () => {
    if (!walletAddress || !roundId || GAME_MANAGER_ADDRESS === ZERO) {
      setBet(null);
      setRound(null);
      return;
    }
    try {
      setLoading(true);
      const [betData, roundData] = await Promise.all([
        client.readContract({
          address: GAME_MANAGER_ADDRESS,
          abi: GAME_MANAGER_ABI,
          functionName: "getBet",
          args: [BigInt(roundId), walletAddress as `0x${string}`],
        }) as Promise<readonly [boolean, bigint, bigint, boolean]>,
        client.readContract({
          address: GAME_MANAGER_ADDRESS,
          abi: GAME_MANAGER_ABI,
          functionName: "rounds",
          args: [BigInt(roundId)],
        }) as Promise<readonly [bigint, bigint, bigint, boolean]>,
      ]);
      const [isYes, amount, oddsAtEntry, exists] = betData;
      const [threshold, resolutionPrice, startTime, resolved] = roundData;
      setBet(
        exists
          ? {
              isYes,
              amount: amount.toString(),
              amountFmt: parseFloat(formatUnits(amount, 18)),
              oddsAtEntryBps: Number(oddsAtEntry),
              exists: true,
            }
          : null
      );
      setRound({
        threshold: threshold.toString(),
        resolutionPrice: resolutionPrice.toString(),
        startTime: Number(startTime),
        resolved,
      });
    } catch (err) {
      console.error("onchain bet read failed:", err);
    } finally {
      setLoading(false);
    }
  }, [walletAddress, roundId]);

  refetchRef.current = load;

  useEffect(() => {
    load();
    const id = setInterval(() => refetchRef.current(), pollMs);
    return () => clearInterval(id);
  }, [load, pollMs]);

  return { bet, round, loading, refetch: load };
}
