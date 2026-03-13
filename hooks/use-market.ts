"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useBTCPrice } from "./use-btc-price";

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
  question: string;
  volume: string;
  liquidity: string;
}

interface PolymarketData {
  slug: string;
  question: string;
  yesOdds: number;
  noOdds: number;
  secondsRemaining: number;
  endDate: string;
  windowStart: number;
  threshold: number;
  volume: string;
  liquidity: string;
}

export function useMarket() {
  const { price, timestamp } = useBTCPrice();
  const priceRef = useRef(price);
  priceRef.current = price;
  const [market, setMarket] = useState<MarketState>({
    roundId: 0,
    threshold: 0,
    startTime: 0,
    secondsRemaining: 300,
    yesOdds: 0.5,
    noOdds: 0.5,
    isActive: false,
    isResolved: false,
    resolutionPrice: null,
    winner: null,
    question: "",
    volume: "0",
    liquidity: "0",
  });
  const [positions, setPositions] = useState<Position[]>([]);
  const positionIdRef = useRef(0);
  const currentSlugRef = useRef("");
  const resolvedRef = useRef(false);
  const thresholdRef = useRef(0);
  const endDateRef = useRef(0);
  const roundIdRef = useRef(0);
  const waitingForRecapRef = useRef(false);

  // Fetch Polymarket data
  const fetchPolymarket = useCallback(async (): Promise<PolymarketData | null> => {
    try {
      const res = await fetch("/api/polymarket");
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }, []);

  // Poll Polymarket every 2 seconds for live odds
  useEffect(() => {
    let mounted = true;

    const poll = async () => {
      if (!mounted || waitingForRecapRef.current) return;
      const data = await fetchPolymarket();
      if (!mounted || !data) return;

      const endTime = new Date(data.endDate).getTime();
      const remaining = Math.max(0, Math.round((endTime - Date.now()) / 1000));

      // New market detected
      if (data.slug !== currentSlugRef.current) {
        // If we had a previous active market, resolve it and wait for recap
        if (currentSlugRef.current && !resolvedRef.current) {
          resolvedRef.current = true;
          waitingForRecapRef.current = true;
          const currentPrice = priceRef.current;
          const winner = currentPrice >= thresholdRef.current ? "YES" : "NO";
          setMarket((prev) => ({
            ...prev,
            secondsRemaining: 0,
            yesOdds: winner === "YES" ? 1 : 0,
            noOdds: winner === "NO" ? 1 : 0,
            isActive: false,
            isResolved: true,
            resolutionPrice: currentPrice,
            winner,
          }));
          return;
        }

        // First market or starting after recap
        currentSlugRef.current = data.slug;
        endDateRef.current = endTime;
        resolvedRef.current = false;
        roundIdRef.current += 1;

        // Use threshold from Polymarket (Binance opening price), fallback to current BTC price
        const currentP = priceRef.current;
        const threshold = data.threshold > 0 ? Math.round(data.threshold) : (currentP > 0 ? Math.round(currentP) : 0);
        thresholdRef.current = threshold;

        setMarket({
          roundId: roundIdRef.current,
          threshold,
          startTime: data.windowStart,
          secondsRemaining: remaining,
          yesOdds: data.yesOdds,
          noOdds: data.noOdds,
          isActive: remaining > 0,
          isResolved: false,
          resolutionPrice: null,
          winner: null,
          question: data.question,
          volume: data.volume,
          liquidity: data.liquidity,
        });
        setPositions([]);
        return;
      }

      // Same market — check if time ran out
      if (remaining <= 0 && !resolvedRef.current) {
        resolvedRef.current = true;
        waitingForRecapRef.current = true;
        const resolvePrice = priceRef.current;
        const winner = resolvePrice >= thresholdRef.current ? "YES" : "NO";
        setMarket((prev) => ({
          ...prev,
          secondsRemaining: 0,
          yesOdds: winner === "YES" ? 1 : 0,
          noOdds: winner === "NO" ? 1 : 0,
          isActive: false,
          isResolved: true,
          resolutionPrice: resolvePrice,
          winner,
        }));
        return;
      }

      // Same market, still active — update odds, volume, liquidity from Polymarket
      if (!resolvedRef.current) {
        setMarket((prev) => ({
          ...prev,
          secondsRemaining: remaining,
          yesOdds: data.yesOdds,
          noOdds: data.noOdds,
          volume: data.volume,
          liquidity: data.liquidity,
        }));
      }
    };

    poll();
    const interval = setInterval(poll, 2000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchPolymarket]);

  // Smooth countdown timer between polls
  useEffect(() => {
    if (!market.isActive || market.isResolved) return;

    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.round((endDateRef.current - Date.now()) / 1000));

      if (remaining <= 0 && !resolvedRef.current) {
        resolvedRef.current = true;
        waitingForRecapRef.current = true;
        const currentPrice = price;
        const winner = currentPrice >= thresholdRef.current ? "YES" : "NO";
        setMarket((prev) => ({
          ...prev,
          secondsRemaining: 0,
          yesOdds: winner === "YES" ? 1 : 0,
          noOdds: winner === "NO" ? 1 : 0,
          isActive: false,
          isResolved: true,
          resolutionPrice: currentPrice,
          winner,
        }));
        return;
      }

      setMarket((prev) => ({ ...prev, secondsRemaining: remaining }));
    }, 1000);

    return () => clearInterval(timer);
  }, [market.isActive, market.isResolved, price]);

  // Start next round (called from recap screen)
  const startNewRound = useCallback(async () => {
    waitingForRecapRef.current = false;
    resolvedRef.current = false;
    currentSlugRef.current = ""; // Force re-detection on next poll

    const data = await fetchPolymarket();
    if (!data) return;

    const endTime = new Date(data.endDate).getTime();
    const remaining = Math.max(0, Math.round((endTime - Date.now()) / 1000));
    const threshold = data.threshold > 0 ? Math.round(data.threshold) : (price > 0 ? Math.round(price) : 0);

    currentSlugRef.current = data.slug;
    endDateRef.current = endTime;
    thresholdRef.current = threshold;
    roundIdRef.current += 1;

    setMarket({
      roundId: roundIdRef.current,
      threshold,
      startTime: data.windowStart,
      secondsRemaining: remaining,
      yesOdds: data.yesOdds,
      noOdds: data.noOdds,
      isActive: remaining > 0,
      isResolved: false,
      resolutionPrice: null,
      winner: null,
      question: data.question,
      volume: data.volume,
      liquidity: data.liquidity,
    });
    setPositions([]);
  }, [fetchPolymarket, price]);

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
