import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

// GET /api/users?fid=123 or ?address=0x...
export async function GET(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const fid = req.nextUrl.searchParams.get("fid");
  const address = req.nextUrl.searchParams.get("address");

  let query = supabaseAdmin.from("players").select("*");
  if (fid) query = query.eq("fid", Number(fid));
  else if (address) query = query.eq("address", address);
  else return NextResponse.json({ error: "fid or address required" }, { status: 400 });

  const { data, error } = await query.single();
  if (error) {
    return NextResponse.json({ user: null });
  }
  return NextResponse.json({ user: data });
}

// POST /api/users — upsert user on login
export async function POST(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { fid, address, display_name, pfp_url } = await req.json();

  const { data, error } = await supabaseAdmin
    .from("players")
    .upsert(
      {
        fid: fid || null,
        address: address || null,
        display_name: display_name || null,
        pfp_url: pfp_url || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: fid ? "fid" : "address" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ user: data });
}
