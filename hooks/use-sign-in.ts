import { MESSAGE_EXPIRATION_TIME } from "@/lib/constants";
import { NeynarUser } from "@/lib/neynar";
import { useAuthenticate, useMiniKit } from "@coinbase/onchainkit/minikit";
import { useCallback, useEffect, useState } from "react";
import { useAccount, useConnect } from "wagmi";

export const useSignIn = ({ autoSignIn = false }: { autoSignIn?: boolean }) => {
  const { context } = useMiniKit();
  // SIWF — only available in a mini-app host (Warpcast / Base app)
  const { signIn } = useAuthenticate();
  // Browser fallback: connect via wagmi (OnchainKit registers a Coinbase Wallet
  // connector automatically when there is no mini-app context)
  const { connectAsync, connectors } = useConnect();
  const { address, isConnected } = useAccount();
  const [user, setUser] = useState<NeynarUser | null>(null);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // ─── Mini-app host path (Warpcast / Base app) ─────────────────────
      if (context) {
        let referrerFid: number | null = null;
        const result = await signIn({
          nonce: Math.random().toString(36).substring(2),
          notBefore: new Date().toISOString(),
          expirationTime: new Date(Date.now() + MESSAGE_EXPIRATION_TIME).toISOString(),
        });
        if (!result) throw new Error("Sign in failed");
        referrerFid =
          context.location?.type === "cast_embed"
            ? (context.location.cast as { fid?: number }).fid ?? null
            : null;

        const res = await fetch("/api/auth/sign-in", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            signature: result.signature,
            message: result.message,
            fid: context.user.fid,
            referrerFid,
          }),
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || "Sign in failed");
        }
        const data = await res.json();
        setUser(data.user);
        setIsSignedIn(true);
        return data;
      }

      // ─── Browser path: connect Base Smart Wallet via wagmi ────────────
      let connectedAddress = address;
      if (!isConnected || !connectedAddress) {
        const connector = connectors[0];
        if (!connector) throw new Error("No wallet connector available");
        const res = await connectAsync({ connector });
        connectedAddress = res.accounts[0];
      }
      if (!connectedAddress) throw new Error("Wallet connection failed");

      // No JWT for browser users — the wallet address is the identity.
      // Upsert the player row so the rest of the app works normally.
      const upsert = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: connectedAddress,
          display_name: `${connectedAddress.slice(0, 6)}...${connectedAddress.slice(-4)}`,
        }),
      });
      const upsertData = await upsert.json().catch(() => ({}));

      setUser({
        fid: 0,
        username: "base-user",
        display_name: upsertData.user?.display_name || "Base Wallet",
        pfp_url: "",
        custody_address: connectedAddress,
        verifications: [],
      } as unknown as NeynarUser);
      setIsSignedIn(true);
      return { user: upsertData.user };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Sign in failed";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [context, signIn, connectAsync, connectors, address, isConnected]);

  // If wagmi auto-reconnects an existing session on page reload, pick it up
  useEffect(() => {
    if (context) return; // mini-app path handles itself
    if (isSignedIn) return;
    if (isConnected && address) {
      fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          display_name: `${address.slice(0, 6)}...${address.slice(-4)}`,
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          setUser({
            fid: 0,
            username: "base-user",
            display_name: data.user?.display_name || "Base Wallet",
            pfp_url: "",
            custody_address: address,
            verifications: [],
          } as unknown as NeynarUser);
          setIsSignedIn(true);
        })
        .catch(() => {});
    }
  }, [context, isConnected, address, isSignedIn]);

  useEffect(() => {
    if (autoSignIn) handleSignIn();
  }, [autoSignIn, handleSignIn]);

  return { signIn: handleSignIn, isSignedIn, isLoading, error, user };
};
