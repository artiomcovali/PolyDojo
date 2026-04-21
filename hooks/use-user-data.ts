"use client";

import { UserRow } from "@/lib/supabase";
import { useCallback, useEffect, useState } from "react";

interface UseUserDataProps {
  fid?: number | null;
  address?: string | null;
  displayName?: string | null;
  pfpUrl?: string | null;
}

export function useUserData({ fid, address, displayName, pfpUrl }: UseUserDataProps) {
  const [dbUser, setDbUser] = useState<UserRow | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Wait until we actually have an identity. Don't upsert a shared
    // placeholder row before sign-in — that row leaks state between users.
    if (!fid && !address) {
      setDbUser(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fid,
        address,
        display_name: displayName,
        pfp_url: pfpUrl,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.user) setDbUser(data.user);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [fid, address, displayName, pfpUrl]);

  const saveRound = useCallback(
    async (roundData: {
      round_number: number;
      threshold: number;
      resolution_price: number;
      winner: "YES" | "NO";
      total_pnl: number;
      total_wagered: number;
      positions: unknown[];
      ai_review?: string;
    }) => {
      if (!dbUser) return;

      try {
        await fetch("/api/rounds", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: dbUser.id,
            ...roundData,
          }),
        });

        const res = await fetch(`/api/users?address=${encodeURIComponent(dbUser.address || "")}`);
        const data = await res.json();
        if (data.user) setDbUser(data.user);
      } catch {}
    },
    [dbUser]
  );

  return { dbUser, loading, saveRound };
}
