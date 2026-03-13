'use client';

import { useEffect, useRef } from 'react';

interface BTCChartProps {
  price: number;
  threshold: number;
  priceHistory: { time: number; price: number }[];
}

// Catmull-Rom spline
function drawSmoothLine(ctx: CanvasRenderingContext2D, points: { x: number; y: number }[]) {
  if (points.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  if (points.length === 2) {
    ctx.lineTo(points[1].x, points[1].y);
    return;
  }
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const t = 0.3;
    ctx.bezierCurveTo(
      p1.x + (p2.x - p0.x) * t,
      p1.y + (p2.y - p0.y) * t,
      p2.x - (p3.x - p1.x) * t,
      p2.y - (p3.y - p1.y) * t,
      p2.x,
      p2.y,
    );
  }
}

function getPriceTicks(min: number, max: number, count: number): number[] {
  const range = max - min;
  const rawStep = range / (count + 1);
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const norm = rawStep / mag;
  const nice = norm <= 1.5 ? mag : norm <= 3.5 ? 2 * mag : norm <= 7.5 ? 5 * mag : 10 * mag;
  const ticks: number[] = [];
  const start = Math.ceil(min / nice) * nice;
  for (let v = start; v <= max; v += nice) ticks.push(Math.round(v * 100) / 100);
  return ticks;
}

export default function BTCChart({ price, threshold, priceHistory }: BTCChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const priceRef = useRef(price);
  const displayPriceRef = useRef(price);
  const thresholdRef = useRef(threshold);
  const historyRef = useRef(priceHistory);
  const rafRef = useRef(0);

  // Update refs without triggering re-renders
  priceRef.current = price;
  thresholdRef.current = threshold;
  historyRef.current = priceHistory;

  // Initialize display price
  useEffect(() => {
    if (displayPriceRef.current === 0 && price > 0) {
      displayPriceRef.current = price;
    }
  }, [price]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const draw = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const history = historyRef.current;
      const target = priceRef.current;
      const th = thresholdRef.current;

      // Interpolate display price toward target
      if (displayPriceRef.current === 0 && target > 0) {
        displayPriceRef.current = target;
      } else if (target > 0) {
        const diff = target - displayPriceRef.current;
        displayPriceRef.current += diff * 0.08;
      }
      const dp = displayPriceRef.current;

      if (history.length < 2 || dp <= 0) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const needsResize =
        canvas.width !== Math.round(rect.width * dpr) ||
        canvas.height !== Math.round(rect.height * dpr);
      if (needsResize) {
        canvas.width = Math.round(rect.width * dpr);
        canvas.height = Math.round(rect.height * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const w = rect.width;
      const h = rect.height;
      const pad = { top: 30, right: 80, bottom: 14, left: 10 };

      ctx.clearRect(0, 0, w, h);

      // Price range
      const allP = history.map((p) => p.price);
      allP.push(th, dp);
      const dMin = Math.min(...allP);
      const dMax = Math.max(...allP);
      const rPad = Math.max((dMax - dMin) * 0.15, 10);
      const minP = dMin - rPad;
      const maxP = dMax + rPad;
      const range = maxP - minP;
      const cW = w - pad.left - pad.right;
      const cH = h - pad.top - pad.bottom;
      const toY = (p: number) => pad.top + cH - ((p - minP) / range) * cH;
      const rEdge = w - pad.right;

      // Header
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('↙ BTC Price', pad.left + 2, 14);

      // Beat label
      ctx.fillStyle = 'rgba(234,179,8,0.6)';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText(
        `— Beat: $${th.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        pad.left + 2,
        26,
      );

      // Y-axis ticks
      const ticks = getPriceTicks(minP, maxP, 4);
      for (const tick of ticks) {
        const y = toY(tick);
        if (y < pad.top + 5 || y > h - pad.bottom - 5) continue;
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(pad.left, y);
        ctx.lineTo(rEdge, y);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = '11px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`$${Math.round(tick).toLocaleString()}`, rEdge + 8, y + 4);
      }

      // Threshold line
      const thY = toY(th);
      ctx.strokeStyle = 'rgba(234,179,8,0.45)';
      ctx.setLineDash([5, 4]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(pad.left, thY);
      ctx.lineTo(rEdge, thY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Target badge
      const bW = 56,
        bH = 18;
      const bX = rEdge - bW - 6,
        bY = thY - bH / 2;
      ctx.fillStyle = 'rgba(50,50,60,0.9)';
      ctx.beginPath();
      ctx.roundRect(bX, bY, bW, bH, 9);
      ctx.fill();
      ctx.strokeStyle = 'rgba(234,179,8,0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(bX, bY, bW, bH, 9);
      ctx.stroke();
      ctx.fillStyle = 'rgba(234,179,8,0.9)';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Target ⬆', bX + bW / 2, bY + 12.5);

      // Threshold price on axis
      ctx.fillStyle = 'rgba(234,179,8,0.65)';
      ctx.font = '11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`$${Math.round(th).toLocaleString()}`, rEdge + 8, thY + 4);

      // Price line — time-based positioning for smooth continuous scrolling
      const now = Date.now();
      const pxPerMs = 6 / 1000; // 6 pixels per second
      const windowMs = cW / pxPerMs; // visible time window in ms
      const windowStart = now - windowMs;

      // Filter to visible points and map time → x
      const points: { x: number; y: number }[] = [];
      for (const pt of history) {
        if (pt.time < windowStart) continue;
        const x = pad.left + (pt.time - windowStart) * pxPerMs;
        points.push({ x, y: toY(pt.price) });
      }
      // Append the smoothly interpolated current price at the right edge
      points.push({ x: rEdge, y: toY(dp) });

      const isAbove = dp >= th;
      ctx.strokeStyle = isAbove ? 'rgba(34,197,94,0.9)' : 'rgba(239,68,68,0.9)';
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      drawSmoothLine(ctx, points);
      ctx.stroke();

      // Fill under curve
      const grad = ctx.createLinearGradient(0, pad.top, 0, h);
      grad.addColorStop(0, isAbove ? 'rgba(34,197,94,0.10)' : 'rgba(239,68,68,0.10)');
      grad.addColorStop(1, isAbove ? 'rgba(34,197,94,0)' : 'rgba(239,68,68,0)');
      const last = points[points.length - 1];
      const first = points[0];
      ctx.lineTo(last.x, h - pad.bottom);
      ctx.lineTo(first.x, h - pad.bottom);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Current price dot + glow
      ctx.beginPath();
      ctx.arc(last.x, last.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = isAbove ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(last.x, last.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = isAbove ? '#22c55e' : '#ef4444';
      ctx.fill();
      ctx.strokeStyle = '#0a0a0a';
      ctx.lineWidth = 1.5;
      ctx.stroke();


      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, []); // Only run once — all data read from refs

  return (
    <div className="w-full bg-gray-900/50 rounded-xl border border-gray-800/50 overflow-hidden">
      <canvas ref={canvasRef} className="w-full" style={{ height: 220 }} />
    </div>
  );
}
