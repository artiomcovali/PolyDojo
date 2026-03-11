"use client";

import { UserRow } from "@/lib/supabase";
import { useCallback, useEffect, useRef, useState } from "react";

interface UseUserDataProps {
  fid?: number | null;
  address?: string | null;
  displayName?: string | null;
  pfpUrl?: string | null;
}

export function useUserData({ fid, address, displayName, pfpUrl }: UseUserDataProps) {
  const [dbUser, setDbUser] = useState<UserRow | null>(null);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  // Upsert user on mount
  useEffect(() => {
    if (initialized.current) return;
    if (!fid && !address) {
      // Dev bypass — use a fixed dev user so it persists across reloads
      fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: "dev-local-user",
          display_name: displayName || "Trader",
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.user) setDbUser(data.user);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
      initialized.current = true;
      return;
    }

    initialized.current = true;
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
        if (data.user) setDbUser(data.user);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
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

        // Refresh user data
        const res = await fetch(`/api/users?address=${encodeURIComponent(dbUser.address || "")}`);
        const data = await res.json();
        if (data.user) setDbUser(data.user);
      } catch {}
    },
    [dbUser]
  );

  return { dbUser, loading, saveRound };
}
