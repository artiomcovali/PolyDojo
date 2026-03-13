"use client";

import { useEffect, useRef, useState } from "react";
import { createPublicClient, http, formatUnits } from "viem";
import { baseSepolia } from "viem/chains";
import { DOJO_TOKEN_ADDRESS, DOJO_TOKEN_ABI } from "@/lib/contracts";

const client = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export function useDojoBalance(walletAddress: string | null) {
  const [onchainBalance, setOnchainBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!walletAddress || DOJO_TOKEN_ADDRESS === ZERO_ADDRESS) {
      setOnchainBalance(null);
      return;
    }

    const fetchBalance = async () => {
      try {
        setLoading(true);
        const raw = await client.readContract({
          address: DOJO_TOKEN_ADDRESS,
          abi: DOJO_TOKEN_ABI,
          functionName: "balanceOf",
          args: [walletAddress as `0x${string}`],
        });
        const formatted = parseFloat(formatUnits(raw as bigint, 18));
        setOnchainBalance(formatted);
      } catch (err) {
        console.error("Failed to read DOJO balance:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
    // Poll every 10 seconds
    intervalRef.current = setInterval(fetchBalance, 10000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [walletAddress]);

  return { onchainBalance, loading };
}
