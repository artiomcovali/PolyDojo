import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const groqKey = process.env.GROQ_API_KEY;

    // New multi-position format
    if (body.positions) {
      const { positions, threshold, resolutionPrice, winner, totalPnl, totalWagers } = body;

      if (!groqKey) {
        const won = totalPnl >= 0;
        const tradeCount = positions.length;
        if (tradeCount === 0) {
          return NextResponse.json({
            review: "You sat this round out. Sometimes patience is a strategy, but you can't learn without placing trades. Try starting with a small position next round to get a feel for the market.",
          });
        }
        const winCount = positions.filter((p: { won: boolean }) => p.won).length;
        const avgEntry = positions.reduce((s: number, p: { entryOdds: number }) => s + p.entryOdds, 0) / tradeCount;

        const summary = won
          ? `Nice round! You went ${winCount}/${tradeCount} and netted +${totalPnl} $DOJO.`
          : `Tough round. You went ${winCount}/${tradeCount} and lost ${Math.abs(totalPnl)} $DOJO.`;

        const pros = ["You had the confidence to enter a position"];
        const cons = [];

        if (avgEntry > 30 && avgEntry < 70) pros.push("Solid entry timing — you bought at reasonable odds");
        if (winCount > 0) pros.push("You read the market direction correctly on at least one trade");
        if (avgEntry > 70) cons.push("You entered at high odds — less upside. Try catching moves earlier");
        if (avgEntry < 30) cons.push("You bought at very low odds — high risk. Read the trend before committing");
        if (totalWagers > 500) cons.push("Heavy wagering this round. Consider sizing down to manage risk");
        if (winCount === 0) cons.push("None of your trades won. Try waiting for clearer signals before entering");
        if (cons.length === 0) cons.push("Consider diversifying with both YES and NO positions to hedge");

        const review = `${summary}\n\nPros:\n${pros.map(p => `- ${p}`).join("\n")}\n\nCons:\n${cons.map(c => `- ${c}`).join("\n")}`;
        return NextResponse.json({ review });
      }

      const posDesc = positions.map((p: { side: string; amount: number; entryOdds: number; entryTime: number; won: boolean; pnl: number }, i: number) =>
        `Trade ${i + 1}: ${p.side} ${p.amount} $DOJO @ ${p.entryOdds}¢ with ${p.entryTime}s left → ${p.won ? "WON" : "LOST"} (${p.pnl >= 0 ? "+" : ""}${p.pnl})`
      ).join("\n");

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
                  "You are a prediction market trading coach. Address the player as \"you\". Respond in this exact format:\n\n1 sentence summary.\n\nPros:\n- (1-2 short bullet points)\n\nCons:\n- (1-2 short bullet points)\n\nKeep each bullet under 12 words. Be specific but extremely concise.",
              },
              {
                role: "user",
                content: `Round recap:\nThreshold: $${threshold.toLocaleString()}\nResolution price: $${resolutionPrice.toLocaleString()}\nWinner: ${winner}\nTotal P&L: ${totalPnl >= 0 ? "+" : ""}${totalPnl} $DOJO\nTotal wagered: ${totalWagers} $DOJO\n\nTrades:\n${posDesc}`,
              },
            ],
            max_tokens: 150,
            temperature: 0.7,
          }),
        }
      );

      const data = await response.json();
      const review = data.choices?.[0]?.message?.content || "Unable to generate review.";
      return NextResponse.json({ review });
    }

    // Legacy single-position format
    const { entryOdds, exitOdds, position, won, pnl, secondsAtEntry, secondsAtExit } = body;

    if (!groqKey) {
      const score = won ? "solid" : "needs improvement";
      return NextResponse.json({
        review: `Round ${score}. You entered ${position} at ${Math.round(entryOdds * 100)}¢${
          exitOdds ? ` and exited at ${Math.round(exitOdds * 100)}¢` : " and held to resolution"
        }. P&L: ${pnl >= 0 ? "+" : ""}${pnl.toFixed(0)} $DOJO.`,
      });
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
                "You are a prediction market trading coach reviewing a completed round. Give specific feedback. Be concise — 2-3 sentences max. End with one actionable tip.",
            },
            {
              role: "user",
              content: `Position: ${position}. Entry odds: ${Math.round(
                entryOdds * 100
              )}¢ (${secondsAtEntry}s remaining). ${
                exitOdds
                  ? `Exit odds: ${Math.round(exitOdds * 100)}¢ (${secondsAtExit}s remaining).`
                  : "Held to resolution."
              } Result: ${won ? "WON" : "LOST"}. P&L: ${pnl >= 0 ? "+" : ""}${pnl.toFixed(
                0
              )} $DOJO.`,
            },
          ],
          max_tokens: 200,
          temperature: 0.7,
        }),
      }
    );

    const data = await response.json();
    const review = data.choices?.[0]?.message?.content || "Unable to generate review.";
    return NextResponse.json({ review });
  } catch {
    return NextResponse.json(
      { review: "Unable to generate review right now." },
      { status: 200 }
    );
  }
}
