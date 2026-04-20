import { NextResponse } from "next/server";
import { resolveDueRounds } from "@/lib/rounds";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const results = await resolveDueRounds();
    return NextResponse.json({ ok: true, resolved: results });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}
