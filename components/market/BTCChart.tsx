"use client";

import { useEffect, useRef } from "react";

interface BTCChartProps {
  price: number;
  threshold: number;
  priceHistory: { time: number; price: number }[];
}

export default function BTCChart({ price, threshold, priceHistory }: BTCChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || priceHistory.length < 2) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const padding = { top: 20, right: 60, bottom: 20, left: 10 };

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Calculate price range
    const prices = priceHistory.map((p) => p.price);
    prices.push(threshold);
    const minPrice = Math.min(...prices) - 50;
    const maxPrice = Math.max(...prices) + 50;
    const priceRange = maxPrice - minPrice;

    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    const priceToY = (p: number) =>
      padding.top + chartH - ((p - minPrice) / priceRange) * chartH;

    // Draw threshold line
    const thresholdY = priceToY(threshold);
    ctx.strokeStyle = "rgba(59, 130, 246, 0.5)";
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, thresholdY);
    ctx.lineTo(w - padding.right, thresholdY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Threshold label
    ctx.fillStyle = "rgba(59, 130, 246, 0.8)";
    ctx.font = "10px monospace";
    ctx.textAlign = "left";
    ctx.fillText(
      `$${threshold.toLocaleString()}`,
      w - padding.right + 4,
      thresholdY + 3
    );

    // Draw price line
    const step = chartW / Math.max(priceHistory.length - 1, 1);
    ctx.strokeStyle =
      price >= threshold ? "rgba(34, 197, 94, 0.9)" : "rgba(239, 68, 68, 0.9)";
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.beginPath();
    priceHistory.forEach((point, i) => {
      const x = padding.left + i * step;
      const y = priceToY(point.price);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Fill area under line
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    if (price >= threshold) {
      gradient.addColorStop(0, "rgba(34, 197, 94, 0.15)");
      gradient.addColorStop(1, "rgba(34, 197, 94, 0)");
    } else {
      gradient.addColorStop(0, "rgba(239, 68, 68, 0.15)");
      gradient.addColorStop(1, "rgba(239, 68, 68, 0)");
    }
    ctx.lineTo(padding.left + (priceHistory.length - 1) * step, h - padding.bottom);
    ctx.lineTo(padding.left, h - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Current price dot
    const lastX = padding.left + (priceHistory.length - 1) * step;
    const lastY = priceToY(price);
    ctx.beginPath();
    ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
    ctx.fillStyle = price >= threshold ? "#22c55e" : "#ef4444";
    ctx.fill();

    // Current price label
    ctx.fillStyle = "#fff";
    ctx.font = "bold 11px monospace";
    ctx.textAlign = "left";
    ctx.fillText(
      `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      w - padding.right + 4,
      lastY + 3
    );
  }, [price, threshold, priceHistory]);

  return (
    <div className="w-full bg-gray-900/50 rounded-xl border border-gray-800/50 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full"
        style={{ height: 200 }}
      />
    </div>
  );
}
