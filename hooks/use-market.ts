"use client";

import { calculateOdds } from "@/lib/odds";
import { useCallback, useEffect, useRef, useState } from "react";
import { useBTCPrice } from "./use-btc-price";

const ROUND_DURATION = 1 * 60; // 1 minute for testing

export interface Position {
  id: number;
  isYes: boolean;
  amount: number;
  entryOdds: number;
  entryTime: number;
}

export interface MarketState {
  roundId: number;
  threshold: number;
  startTime: number;
  secondsRemaining: number;
  yesOdds: number;
  noOdds: number;
  isActive: boolean;
  isResolved: boolean;
  resolutionPrice: number | null;
  winner: "YES" | "NO" | null;
}

export function useMarket() {
  const { price, timestamp } = useBTCPrice();
  const [market, setMarket] = useState<MarketState>({
    roundId: 0,
    threshold: 0,
    startTime: 0,
    secondsRemaining: ROUND_DURATION,
    yesOdds: 0.5,
    noOdds: 0.5,
    isActive: false,
    isResolved: false,
    resolutionPrice: null,
    winner: null,
  });
  const [positions, setPositions] = useState<Position[]>([]);
  const thresholdRef = useRef(0);
  const startTimeRef = useRef(0);
  const roundIdRef = useRef(0);
  const resolvedRef = useRef(false);
  const positionIdRef = useRef(0);

  const startNewRound = useCallback(
    (currentPrice: number) => {
      if (currentPrice <= 0) return;
      const offset = (Math.random() - 0.5) * 100;
      const newThreshold = Math.round(currentPrice + offset);
      const now = Date.now();
      roundIdRef.current += 1;
      thresholdRef.current = newThreshold;
      startTimeRef.current = now;
      resolvedRef.current = false;

      setMarket({
        roundId: roundIdRef.current,
        threshold: newThreshold,
        startTime: now,
        secondsRemaining: ROUND_DURATION,
        yesOdds: 0.5,
        noOdds: 0.5,
        isActive: true,
        isResolved: false,
        resolutionPrice: null,
        winner: null,
      });
      setPositions([]);
    },
    []
  );

  // Start first round when price arrives
  useEffect(() => {
    if (price > 0 && !market.isActive && !market.isResolved) {
      startNewRound(price);
    }
  }, [price, market.isActive, market.isResolved, startNewRound]);

  // Update market state every tick
  useEffect(() => {
    if (!market.isActive || price <= 0) return;

    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    const remaining = Math.max(0, ROUND_DURATION - elapsed);

    if (remaining <= 0 && !resolvedRef.current) {
      resolvedRef.current = true;
      const winner = price >= thresholdRef.current ? "YES" : "NO";
      setMarket((prev) => ({
        ...prev,
        secondsRemaining: 0,
        yesOdds: winner === "YES" ? 0.97 : 0.03,
        noOdds: winner === "NO" ? 0.97 : 0.03,
        isActive: false,
        isResolved: true,
        resolutionPrice: price,
        winner,
      }));

      return;
    }

    const { yesOdds, noOdds } = calculateOdds(
      price,
      thresholdRef.current,
      remaining
    );

    setMarket((prev) => ({
      ...prev,
      secondsRemaining: Math.round(remaining),
      yesOdds,
      noOdds,
    }));
  }, [price, timestamp, market.isActive, startNewRound]);

  const placeBet = useCallback(
    (isYes: boolean, amount: number) => {
      if (!market.isActive) return;
      positionIdRef.current += 1;
      setPositions((prev) => [
        ...prev,
        {
          id: positionIdRef.current,
          isYes,
          amount,
          entryOdds: isYes ? market.yesOdds : market.noOdds,
          entryTime: market.secondsRemaining,
        },
      ]);
    },
    [market.isActive, market.yesOdds, market.noOdds, market.secondsRemaining]
  );

  const sellPosition = useCallback((positionId: number) => {
    setPositions((prev) => prev.filter((p) => p.id !== positionId));
  }, []);

  return {
    price,
    market,
    positions,
    placeBet,
    sellPosition,
    startNewRound,
  };
}
