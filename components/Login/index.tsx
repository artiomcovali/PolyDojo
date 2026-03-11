"use client";

import Image from "next/image";

interface LoginProps {
  onSignIn: () => void;
  isLoading: boolean;
  error: string | null;
  onBypass?: () => void;
}

export default function Login({ onSignIn, isLoading, error, onBypass }: LoginProps) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="text-center mb-10">
        <div className="mb-4 flex justify-center"><Image src="/LogoWhite.png" alt="PolyDojo" width={120} height={120} /></div>
        <h1 className="text-3xl font-bold tracking-tight">PolyDojo</h1>
        <p className="text-sm text-gray-400 mt-2 max-w-xs mx-auto leading-relaxed">
          The training dojo for Polymarket traders. Practice. Learn. Beat the
          market.
        </p>
      </div>

      {/* Features */}
      <div className="w-full max-w-sm space-y-3 mb-10">
        {[
          {
            icon: "📊",
            title: "Live BTC Markets",
            desc: "5-minute prediction markets with real price data",
          },
          {
            icon: "🪙",
            title: "$DOJO Token",
            desc: "Trade with onchain tokens on Base — zero real risk",
          },
          {
            icon: "🤖",
            title: "AI Coaching",
            desc: "Get tips before trades and reviews after every round",
          },
          {
            icon: "🏆",
            title: "Onchain Leaderboard",
            desc: "Earn NFT achievements and climb the rankings",
          },
        ].map((feature) => (
          <div
            key={feature.title}
            className="flex items-center gap-3 bg-gray-800/30 rounded-xl p-3 border border-gray-800/50"
          >
            <span className="text-xl">{feature.icon}</span>
            <div>
              <div className="text-xs font-medium text-white">
                {feature.title}
              </div>
              <div className="text-[10px] text-gray-500">{feature.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Sign In Button */}
      <div className="w-full max-w-sm space-y-3">
        <button
          onClick={onSignIn}
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              <svg
                width="16"
                height="16"
                viewBox="0 0 111 111"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M54.921 110.034C85.359 110.034 110.034 85.402 110.034 55.017C110.034 24.6319 85.359 0 54.921 0C26.0432 0 2.35281 22.1714 0 50.3923H72.8467V59.6416H0C2.35281 87.8625 26.0432 110.034 54.921 110.034Z"
                  fill="white"
                />
              </svg>
              Sign in with Base
            </>
          )}
        </button>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
            <p className="text-xs text-red-400">{error}</p>
            <button
              onClick={onSignIn}
              className="text-xs text-red-300 underline mt-1"
            >
              Try again
            </button>
          </div>
        )}

        <p className="text-[10px] text-gray-600 text-center">
          Powered by Base MiniKit. Your wallet is your identity.
        </p>

        {process.env.NODE_ENV === "development" && onBypass && (
          <button
            onClick={onBypass}
            className="w-full text-[10px] text-gray-600 hover:text-gray-400 py-2 transition-colors"
          >
            Skip login (dev only)
          </button>
        )}
      </div>
    </div>
  );
}
