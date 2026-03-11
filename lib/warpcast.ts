import { env } from "@/lib/env";

export async function getFarcasterManifest() {
  let frameName = "PolyDojo";
  let noindex = false;
  const appUrl = env.NEXT_PUBLIC_URL;
  if (appUrl.includes("localhost")) {
    frameName += " Local";
    noindex = true;
  } else if (appUrl.includes("ngrok")) {
    frameName += " Dev";
    noindex = true;
  } else if (appUrl.includes("https://dev.")) {
    frameName += " Dev";
    noindex = true;
  }
  return {
    accountAssociation: {
      header: env.NEXT_PUBLIC_FARCASTER_HEADER,
      payload: env.NEXT_PUBLIC_FARCASTER_PAYLOAD,
      signature: env.NEXT_PUBLIC_FARCASTER_SIGNATURE,
    },
    frame: {
      version: "1",
      name: frameName,
      iconUrl: `${appUrl}/images/icon.png`,
      homeUrl: appUrl,
      imageUrl: `${appUrl}/images/feed.png`,
      buttonTitle: "Open PolyDojo",
      splashImageUrl: `${appUrl}/images/splash.png`,
      splashBackgroundColor: "#0a0a0a",
      webhookUrl: `${appUrl}/api/webhook`,
      subtitle: "BTC Prediction Market Trainer",
      description:
        "Practice BTC prediction markets with $DOJO tokens on Base. Real data, AI coaching, zero risk.",
      primaryCategory: "games",
      tags: ["trading", "prediction-markets", "btc", "base", "defi"],
      tagline: "Beat the Market. Train First.",
      ogTitle: frameName,
      ogDescription:
        "Practice BTC prediction markets with $DOJO on Base. AI coaching, NFT achievements, onchain leaderboard.",
      screenshotUrls: [`${appUrl}/images/feed.png`],
      heroImageUrl: `${appUrl}/images/feed.png`,
      ogImageUrl: `${appUrl}/images/feed.png`,
      noindex: noindex,
    },
  };
}
