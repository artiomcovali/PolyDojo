import { env } from "@/lib/env";
import { DOJO_TOKEN_ADDRESS, DOJO_TOKEN_ABI } from "@/lib/contracts";
import { createPublicClient, createWalletClient, http, parseUnits, formatUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import * as jose from "jose";
import { NextRequest, NextResponse } from "next/server";

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

export async function POST(req: NextRequest) {
  try {
    // Verify auth
    const token = req.cookies.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);
    const walletAddress = payload.walletAddress as string;

    if (!walletAddress || walletAddress === "0x0000000000000000000000000000000000000000") {
      return NextResponse.json({ error: "No wallet address" }, { status: 400 });
    }

    // Get request body
    const { gameBalance } = await req.json();
    if (typeof gameBalance !== "number" || gameBalance < 0) {
      return NextResponse.json({ error: "Invalid game balance" }, { status: 400 });
    }

    // Check deployer key is configured
    if (!env.DEPLOYER_PRIVATE_KEY) {
      return NextResponse.json({ error: "Cashout not configured" }, { status: 503 });
    }

    // Read current onchain balance
    const rawOnchain = await publicClient.readContract({
      address: DOJO_TOKEN_ADDRESS,
      abi: DOJO_TOKEN_ABI,
      functionName: "balanceOf",
      args: [walletAddress as `0x${string}`],
    });
    const onchainBalance = parseFloat(formatUnits(rawOnchain as bigint, 18));

    // Calculate how much to mint (game balance - onchain balance)
    const toMint = Math.floor(gameBalance - onchainBalance);
    if (toMint <= 0) {
      return NextResponse.json({
        success: true,
        message: "Onchain balance already up to date",
        onchainBalance,
        minted: 0,
      });
    }

    // Mint the difference
    const account = privateKeyToAccount(env.DEPLOYER_PRIVATE_KEY as `0x${string}`);
    const walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(),
    });

    const hash = await walletClient.writeContract({
      address: DOJO_TOKEN_ADDRESS,
      abi: DOJO_TOKEN_ABI,
      functionName: "mint",
      args: [walletAddress as `0x${string}`, parseUnits(String(toMint), 18)],
    });

    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    return NextResponse.json({
      success: true,
      minted: toMint,
      txHash: hash,
      onchainBalance: onchainBalance + toMint,
      blockNumber: Number(receipt.blockNumber),
    });
  } catch (error) {
    console.error("Cashout error:", error);
    return NextResponse.json({ error: "Cashout failed" }, { status: 500 });
  }
}
