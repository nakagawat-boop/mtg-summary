export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";

const SB_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SB_KEY = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const headers = () => ({
  "apikey": SB_KEY,
  "Authorization": `Bearer ${SB_KEY}`,
  "Content-Type": "application/json",
  "Prefer": "return=minimal"
});

export async function GET(req: NextRequest) {
  const week = req.nextUrl.searchParams.get("week");
  if (!week) return NextResponse.json({ error: "week required" }, { status: 400 });
  const res = await fetch(
    `${SB_URL}/rest/v1/mtg_summary_meta?week_key=eq.${encodeURIComponent(week)}&select=*`,
    { headers: headers(), cache: "no-store" }
  );
  const rows = await res.json();
  return NextResponse.json({ meta: rows?.[0] ?? null });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const res = await fetch(
    `${SB_URL}/rest/v1/mtg_summary_meta`,
    {
      method: "POST",
      headers: { ...headers(), "Prefer": "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ week_key: body.week, ...body.meta, updated_at: new Date().toISOString() }),
      cache: "no-store"
    }
  );
  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
