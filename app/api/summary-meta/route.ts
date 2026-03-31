export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const week = req.nextUrl.searchParams.get("week");
  const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!key || !url) {
    return NextResponse.json({ error: "Env vars missing", hasKey: !!key, hasUrl: !!url }, { status: 500 });
  }

  const res = await fetch(
    `${url}/rest/v1/mtg_summary_meta?week_key=eq.${encodeURIComponent(week||"")}&select=*`,
    { headers: { "apikey": key, "Authorization": `Bearer ${key}` }, cache: "no-store" }
  );

  if (!res.ok) {
    const errorText = await res.text();
    return NextResponse.json({ error: "Supabase error", status: res.status, details: errorText }, { status: res.status });
  }

  const rows = await res.json();
  return NextResponse.json({ meta: rows?.[0] ?? null, debug: { count: rows?.length, isArray: Array.isArray(rows) } });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!key || !url) {
    return NextResponse.json({ error: "Env vars missing", hasKey: !!key, hasUrl: !!url }, { status: 500 });
  }

  const res = await fetch(`${url}/rest/v1/mtg_summary_meta`, {
    method: "POST",
    headers: { "apikey": key, "Authorization": `Bearer ${key}`, "Content-Type": "application/json", "Prefer": "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ week_key: body.week, ...body.meta, updated_at: new Date().toISOString() }),
    cache: "no-store"
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: "Supabase error", status: res.status, details: err }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
