"use client";

import dynamic from "next/dynamic";

const Home = dynamic(() => import("@/components/Home"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
      <div className="text-center">
        <img src="/LogoWhite.png" alt="PolyDojo" width={48} height={48} className="mx-auto mb-3" />
        <h1 className="text-xl font-bold text-white">PolyDojo</h1>
        <p className="text-xs text-gray-500 mt-1">Loading...</p>
      </div>
    </div>
  ),
});

export default function App() {
  return <Home />;
}
