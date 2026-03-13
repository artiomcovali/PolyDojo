"use client";

import { useEffect, useRef } from "react";

interface ScrollingDigitProps {
  char: string;
  direction: "up" | "down";
  tick: number;
}

function ScrollingDigit({ char, direction, tick }: ScrollingDigitProps) {
  if (!/\d/.test(char)) {
    return <span className="inline-block">{char}</span>;
  }

  const anim = direction === "up" ? "digit-in-up" : "digit-in-down";

  return (
    <span
      className="inline-block relative overflow-hidden"
      style={{ width: "0.6em", height: "1.15em" }}
    >
      <span
        key={tick}
        className="flex items-center justify-center h-full"
        style={tick > 0 ? { animation: `${anim} 180ms ease-out` } : undefined}
      >
        {char}
      </span>
    </span>
  );
}

interface ScrollingNumberProps {
  value: string;
  className?: string;
}

export default function ScrollingNumber({ value, className = "" }: ScrollingNumberProps) {
  const prevValueRef = useRef(value);
  const ticksRef = useRef<number[]>([]);

  const prevNumeric = parseFloat(prevValueRef.current.replace(/[^0-9.-]/g, "")) || 0;
  const currNumeric = parseFloat(value.replace(/[^0-9.-]/g, "")) || 0;
  const direction = currNumeric >= prevNumeric ? "up" : "down";

  const chars = value.split("");
  const prevChars = prevValueRef.current.split("");

  // Ensure ticks array matches length
  while (ticksRef.current.length < chars.length) ticksRef.current.push(0);
  if (ticksRef.current.length > chars.length) ticksRef.current.length = chars.length;

  // Only increment tick for positions where the digit actually changed
  for (let i = 0; i < chars.length; i++) {
    if (chars[i] !== prevChars[i]) {
      ticksRef.current[i] += 1;
    }
  }

  useEffect(() => {
    prevValueRef.current = value;
  }, [value]);

  return (
    <span className={`inline-flex ${className}`}>
      {chars.map((char, i) => (
        <ScrollingDigit
          key={`${i}-${chars.length}`}
          char={char}
          direction={direction}
          tick={ticksRef.current[i]}
        />
      ))}
    </span>
  );
}
