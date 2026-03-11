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
    title: "PolyDojo — Prediction Market Trainer",
    description:
      "Practice BTC prediction markets with $DOJO tokens on Base. Zero risk. Real data. AI coaching.",
    openGraph: {
      title: "PolyDojo — Prediction Market Trainer",
      description:
        "Practice BTC prediction markets with $DOJO tokens on Base. Zero risk. Real data. AI coaching.",
    },
    other: {
      "fc:frame": JSON.stringify(frame),
    },
  };
}

export default function Home() {
  return <App />;
}
