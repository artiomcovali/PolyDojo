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
      subtitle: "Live Polymarket. Zero Risk.",
      description:
        "Trade live Polymarket BTC markets with $DOJO on Base. Real odds, real data, no real money on the line.",
      primaryCategory: "games",
      tags: ["trading", "prediction-markets", "polymarket", "btc", "base", "defi"],
      tagline: "Real Markets. Fake Money. Real Skill.",
      ogTitle: frameName,
      ogDescription:
        "Trade live Polymarket BTC markets with $DOJO on Base. Real odds, AI coaching, onchain leaderboard.",
      screenshotUrls: [`${appUrl}/images/feed.png`],
      heroImageUrl: `${appUrl}/images/feed.png`,
      ogImageUrl: `${appUrl}/images/feed.png`,
      noindex: noindex,
    },
  };
}
