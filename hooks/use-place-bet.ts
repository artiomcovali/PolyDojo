"use client";

import { useCallback, useState } from "react";
import { sdk } from "@farcaster/frame-sdk";
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  maxUint256,
  parseUnits,
  type WalletClient,
} from "viem";
import { baseSepolia } from "viem/chains";
import { useWalletClient } from "wagmi";
import {
  DOJO_TOKEN_ABI,
  DOJO_TOKEN_ADDRESS,
  GAME_MANAGER_ABI,
  GAME_MANAGER_ADDRESS,
} from "@/lib/contracts";

const publicClient = createPublicClient({ chain: baseSepolia, transport: http() });

export type PlaceBetStep =
  | "idle"
  | "ensuring-round"
  | "approving"
  | "placing"
  | "recording"
  | "done"
  | "error";

export interface PlaceBetResult {
  ok: boolean;
  txHash?: `0x${string}`;
  roundId?: number;
  error?: string;
}

export function usePlaceBet(walletAddress: string | null) {
  const [step, setStep] = useState<PlaceBetStep>("idle");
  const [error, setError] = useState<string | null>(null);
  const { data: wagmiWalletClient } = useWalletClient();

  const place = useCallback(
    async (params: {
      isYes: boolean;
      amount: number;
      oddsAtEntryBps: number;
    }): Promise<PlaceBetResult> => {
      if (!walletAddress) return { ok: false, error: "no-wallet" };
      setError(null);

      try {
        setStep("ensuring-round");
        const ensureRes = await fetch("/api/rounds/ensure", { method: "POST" });
        const ensure = await ensureRes.json();
        if (!ensureRes.ok || !ensure.ok) {
          throw new Error(ensure.error || "ensure-failed");
        }
        const roundId = Number(ensure.roundId);

        let walletClient: WalletClient;
        const sdkProvider = (sdk as unknown as { wallet?: { ethProvider?: unknown } })
          .wallet?.ethProvider;
        if (sdkProvider) {
          walletClient = createWalletClient({
            account: walletAddress as `0x${string}`,
            chain: baseSepolia,
            transport: custom(sdkProvider as Parameters<typeof custom>[0]),
          });
        } else if (wagmiWalletClient) {
          walletClient = wagmiWalletClient;
        } else {
          throw new Error("no-wallet-provider");
        }

        const amountWei = parseUnits(String(params.amount), 18);

        const allowance = (await publicClient.readContract({
          address: DOJO_TOKEN_ADDRESS,
          abi: DOJO_TOKEN_ABI,
          functionName: "allowance",
          args: [walletAddress as `0x${string}`, GAME_MANAGER_ADDRESS],
        })) as bigint;

        if (allowance < amountWei) {
          setStep("approving");
          const approveHash = await walletClient.writeContract({
            account: walletAddress as `0x${string}`,
            chain: baseSepolia,
            address: DOJO_TOKEN_ADDRESS,
            abi: DOJO_TOKEN_ABI,
            functionName: "approve",
            args: [GAME_MANAGER_ADDRESS, maxUint256],
          });
          await publicClient.waitForTransactionReceipt({ hash: approveHash });
        }

        setStep("placing");
        const txHash = await walletClient.writeContract({
          account: walletAddress as `0x${string}`,
          chain: baseSepolia,
          address: GAME_MANAGER_ADDRESS,
          abi: GAME_MANAGER_ABI,
          functionName: "placeBet",
          args: [
            BigInt(roundId),
            params.isYes,
            amountWei,
            BigInt(params.oddsAtEntryBps),
          ],
        });
        await publicClient.waitForTransactionReceipt({ hash: txHash });

        setStep("recording");
        await fetch("/api/bets/record", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_address: walletAddress,
            round_id: roundId,
            is_yes: params.isYes,
            amount: amountWei.toString(),
            entry_odds_bps: params.oddsAtEntryBps,
            tx_hash: txHash,
          }),
        });

        setStep("done");
        return { ok: true, txHash, roundId };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        setStep("error");
        return { ok: false, error: msg };
      }
    },
    [walletAddress, wagmiWalletClient]
  );

  const reset = useCallback(() => {
    setStep("idle");
    setError(null);
  }, []);

  return { place, reset, step, error };
}
