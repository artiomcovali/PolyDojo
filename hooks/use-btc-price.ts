"use client";

import { btcPriceManager } from "@/lib/btcPrice";
import { useEffect, useState } from "react";

export function useBTCPrice() {
  const [price, setPrice] = useState(0);
  const [timestamp, setTimestamp] = useState(0);

  useEffect(() => {
    const unsub = btcPriceManager.subscribe((p, t) => {
      setPrice(p);
      setTimestamp(t);
    });
    return unsub;
  }, []);

  return { price, timestamp };
}
