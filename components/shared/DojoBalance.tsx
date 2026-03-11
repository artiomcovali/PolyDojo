"use client";

interface DojoBalanceProps {
  balance: number;
}

export default function DojoBalance({ balance }: DojoBalanceProps) {
  return (
    <div className="flex items-center gap-1.5 bg-gray-800/60 rounded-full px-3 py-1.5">
      <span className="text-yellow-400 text-sm font-bold">$DOJO</span>
      <span className="text-white text-sm font-mono">
        {balance.toLocaleString()}
      </span>
    </div>
  );
}
