import "server-only";
import { env } from "@/lib/env";
import { GAME_MANAGER_ABI, GAME_MANAGER_ADDRESS } from "@/lib/contracts";
import { createPublicClient, createWalletClient, http, isAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export type MintResult =
  | { ok: true; txHash: `0x${string}` }
  | { ok: false; reason: string };

const publicClient = createPublicClient({ chain: baseSepolia, transport: http() });

function getAccount() {
  const raw = env.DEPLOYER_PRIVATE_KEY;
  const pk = (raw.startsWith("0x") ? raw : `0x${raw}`) as `0x${string}`;
  return privateKeyToAccount(pk);
}

export async function mintInitialDojo(userAddress: string): Promise<MintResult> {
  if (!env.DEPLOYER_PRIVATE_KEY) return { ok: false, reason: "deployer-key-missing" };
  if (GAME_MANAGER_ADDRESS === ZERO_ADDRESS) return { ok: false, reason: "game-manager-not-deployed" };
  if (!isAddress(userAddress)) return { ok: false, reason: "invalid-address" };

  try {
    const user = userAddress as `0x${string}`;

    // Contract-level idempotency: GameManager tracks hasMinted on-chain.
    const already = await publicClient.readContract({
      address: GAME_MANAGER_ADDRESS,
      abi: GAME_MANAGER_ABI,
      functionName: "hasMinted",
      args: [user],
    });
    if (already) return { ok: false, reason: "already-minted" };

    const account = getAccount();
    const walletClient = createWalletClient({ account, chain: baseSepolia, transport: http() });
    const txHash = await walletClient.writeContract({
      address: GAME_MANAGER_ADDRESS,
      abi: GAME_MANAGER_ABI,
      functionName: "firstMint",
      args: [user],
      gas: BigInt(200000),
    });
    return { ok: true, txHash };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, reason: msg.slice(0, 240) };
  }
}
