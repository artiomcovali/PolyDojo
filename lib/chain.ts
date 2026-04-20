import "server-only";
import { env } from "@/lib/env";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";

export const publicClient = createPublicClient({ chain: baseSepolia, transport: http() });

export function getDeployerAccount() {
  const raw = env.DEPLOYER_PRIVATE_KEY;
  if (!raw) throw new Error("DEPLOYER_PRIVATE_KEY not configured");
  const pk = (raw.startsWith("0x") ? raw : `0x${raw}`) as `0x${string}`;
  return privateKeyToAccount(pk);
}

export function getDeployerWallet() {
  const account = getDeployerAccount();
  return createWalletClient({ account, chain: baseSepolia, transport: http() });
}

// 5-minute market window utilities
export const WINDOW_SECONDS = 300;
export function currentWindowStart(nowMs: number = Date.now()): number {
  return Math.floor(nowMs / 1000 / WINDOW_SECONDS) * WINDOW_SECONDS;
}
export function windowEnd(windowStart: number): number {
  return windowStart + WINDOW_SECONDS;
}
