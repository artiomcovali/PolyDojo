import { NextResponse } from "next/server";
import { resolveDueRounds } from "@/lib/rounds";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST() {
  try {
    const results = await resolveDueRounds();
    console.log(
      `[resolve] ${results.length} round(s) settled:`,
      JSON.stringify(results, null, 2)
    );
    return NextResponse.json({ ok: true, resolved: results });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[resolve] error:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}
