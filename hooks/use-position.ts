"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatUnits, parseUnits } from "viem";

export interface Position {
  isYes: boolean;
  amount: string; // wei
  amountFmt: number;
  entryOddsBps: number;
}

export interface PoolStats {
  yesPool: string;
  noPool: string;
  yesPoolFmt: number;
  noPoolFmt: number;
  yesOddsBps: number;
  noOddsBps: number;
}

interface UsePositionReturn {
  position: Position | null;
  pool: PoolStats | null;
  realizedDojo: number; // net P&L already banked via mid-round sells
  loading: boolean;
  error: string | null;
  setPosition: (
    isYes: boolean,
    amountDojo: number,
    entryOddsBps: number
  ) => Promise<{ ok: boolean; error?: string }>;
  withdraw: (sellYesOddsBps: number) => Promise<{ ok: boolean; error?: string }>;
  refetch: () => Promise<void>;
}

function computeOdds(yesWei: bigint, noWei: bigint): { yes: number; no: number } {
  const total = yesWei + noWei;
  if (total === BigInt(0)) return { yes: 5000, no: 5000 };
  // Basis points, scaled by 10000
  const yesBps = Number((yesWei * BigInt(10000)) / total);
  return { yes: yesBps, no: 10000 - yesBps };
}

export function usePosition(
  walletAddress: string | null,
  roundId: number | null,
  pollMs: number = 3000
): UsePositionReturn {
  const [position, setPositionState] = useState<Position | null>(null);
  const [pool, setPool] = useState<PoolStats | null>(null);
  const [realizedDojo, setRealizedDojo] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reqIdRef = useRef(0);

  const load = useCallback(async () => {
    if (!roundId) {
      setPositionState(null);
      setPool(null);
      setRealizedDojo(0);
      return;
    }
    const reqId = ++reqIdRef.current;
    try {
      setLoading(true);
      const q = new URLSearchParams({ round_id: String(roundId) });
      if (walletAddress) q.set("user", walletAddress);
      const res = await fetch(`/api/positions?${q.toString()}`);
      const data = await res.json();
      if (reqId !== reqIdRef.current) return;
      if (!res.ok || !data.ok) {
        setError(data.error || "fetch-failed");
        return;
      }
      const yesWei = BigInt(data.yes_pool as string);
      const noWei = BigInt(data.no_pool as string);
      const { yes, no } = computeOdds(yesWei, noWei);
      setPool({
        yesPool: data.yes_pool,
        noPool: data.no_pool,
        yesPoolFmt: parseFloat(formatUnits(yesWei, 18)),
        noPoolFmt: parseFloat(formatUnits(noWei, 18)),
        yesOddsBps: yes,
        noOddsBps: no,
      });
      if (data.my_position) {
        const amtWei = BigInt(data.my_position.amount as string);
        setPositionState({
          isYes: data.my_position.is_yes as boolean,
          amount: data.my_position.amount as string,
          amountFmt: parseFloat(formatUnits(amtWei, 18)),
          entryOddsBps: (data.my_position.entry_odds_bps as number) ?? 5000,
        });
      } else {
        setPositionState(null);
      }
      if (data.my_realized_wei !== undefined) {
        const rw = BigInt(data.my_realized_wei as string);
        const neg = rw < BigInt(0);
        const abs = neg ? -rw : rw;
        const fmt = parseFloat(formatUnits(abs, 18));
        setRealizedDojo(neg ? -fmt : fmt);
      }
    } catch (err) {
      if (reqId !== reqIdRef.current) return;
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      if (reqId === reqIdRef.current) setLoading(false);
    }
  }, [walletAddress, roundId]);

  useEffect(() => {
    load();
    const id = setInterval(load, pollMs);
    return () => clearInterval(id);
  }, [load, pollMs]);

  const setPosition = useCallback(
    async (isYes: boolean, amountDojo: number, entryOddsBps: number) => {
      if (!walletAddress || !roundId) return { ok: false, error: "not-ready" };
      setError(null);
      // Optimistic update
      const amountWei = parseUnits(String(amountDojo), 18);
      setPositionState({
        isYes,
        amount: amountWei.toString(),
        amountFmt: amountDojo,
        entryOddsBps,
      });
      try {
        const res = await fetch("/api/positions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_address: walletAddress,
            round_id: roundId,
            is_yes: isYes,
            amount: amountWei.toString(),
            entry_odds_bps: entryOddsBps,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          setError(data.error || "failed");
          await load();
          return { ok: false, error: data.error };
        }
        await load();
        return { ok: true };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        await load();
        return { ok: false, error: msg };
      }
    },
    [walletAddress, roundId, load]
  );

  const withdraw = useCallback(async (sellYesOddsBps: number) => {
    if (!walletAddress || !roundId) return { ok: false, error: "not-ready" };
    setError(null);
    setPositionState(null);
    try {
      const res = await fetch("/api/positions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_address: walletAddress,
          round_id: roundId,
          is_yes: false,
          amount: "0",
          sell_yes_odds_bps: sellYesOddsBps,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "failed");
        await load();
        return { ok: false, error: data.error };
      }
      await load();
      return { ok: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      await load();
      return { ok: false, error: msg };
    }
  }, [walletAddress, roundId, load]);

  return { position, pool, realizedDojo, loading, error, setPosition, withdraw, refetch: load };
}
