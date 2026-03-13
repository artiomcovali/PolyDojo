import App from "@/components/App";
import { Metadata } from "next";

const appUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

const frame = {
  version: "next",
  imageUrl: `${appUrl}/images/feed.png`,
  button: {
    title: "Open PolyDojo",
    action: {
      type: "launch_frame",
      name: "PolyDojo",
      url: appUrl,
      splashImageUrl: `${appUrl}/images/splash.png`,
      splashBackgroundColor: "#0a0a0a",
    },
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "PolyDojo — Trade Polymarket Live. Zero Risk.",
    description:
      "Trade live Polymarket BTC markets with $DOJO on Base. Real odds. Real data. No real money on the line.",
    openGraph: {
      title: "PolyDojo — Trade Polymarket Live. Zero Risk.",
      description:
        "Trade live Polymarket BTC markets with $DOJO on Base. Real odds. Real data. No real money on the line.",
    },
    other: {
      "fc:frame": JSON.stringify(frame),
    },
  };
}

export default function Home() {
  return <App />;
}
