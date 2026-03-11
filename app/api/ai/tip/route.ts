import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { price, threshold, secondsRemaining, yesOdds } = await req.json();
    const groqKey = process.env.GROQ_API_KEY;
    const noOdds = 1 - yesOdds;
    const distance = price - threshold;
    const isAbove = distance > 0;

    if (!groqKey) {
      return NextResponse.json({ error: "AI unavailable" }, { status: 503 });
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${groqKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content:
                'You are a prediction market trading coach. Respond with ONLY valid JSON in this exact format: {"decision":"YES" or "NO" or "WAIT","reason":"1 short sentence why"}. No other text.',
            },
            {
              role: "user",
              content: `BTC: $${price}. Threshold: $${threshold}. Distance: $${distance.toFixed(0)}. Time left: ${secondsRemaining}s. YES: ${Math.round(yesOdds * 100)}¢. NO: ${Math.round(noOdds * 100)}¢.`,
            },
          ],
          max_tokens: 60,
          temperature: 0.5,
        }),
      }
    );

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || "";

    if (!raw) {
      return NextResponse.json({ error: "AI unavailable" }, { status: 503 });
    }

    try {
      const parsed = JSON.parse(raw);
      if (!parsed.decision || parsed.decision === "WAIT") {
        return NextResponse.json({ error: "AI unavailable" }, { status: 503 });
      }
      return NextResponse.json({
        decision: parsed.decision,
        reason: parsed.reason || "Unable to determine.",
        context: {
          price: Math.round(price),
          yesOdds: Math.round(yesOdds * 100),
          noOdds: Math.round(noOdds * 100),
        },
      });
    } catch {
      const hasYes = raw.toUpperCase().includes("YES");
      const hasNo = raw.toUpperCase().includes("NO");
      if (!hasYes && !hasNo) {
        return NextResponse.json({ error: "AI unavailable" }, { status: 503 });
      }
      return NextResponse.json({
        decision: hasYes ? "YES" : "NO",
        reason: raw.slice(0, 100),
        context: {
          price: Math.round(price),
          yesOdds: Math.round(yesOdds * 100),
          noOdds: Math.round(noOdds * 100),
        },
      });
    }
  } catch {
    return NextResponse.json({ error: "AI unavailable" }, { status: 503 });
  }
}
