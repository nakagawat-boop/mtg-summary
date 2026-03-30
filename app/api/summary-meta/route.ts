export const dynamic = "force-dynamic";
import { getSupabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
export async function GET(req: NextRequest) {
  const week = req.nextUrl.searchParams.get("week");
  if (!week) return NextResponse.json({ error: "week required" }, { status: 400 });
  const { data } = await getSupabase().from("mtg_summary_meta").select("*").eq("week_key", week).single();
  return NextResponse.json({ meta: data ?? null });
}
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { error } = await getSupabase().from("mtg_summary_meta").upsert(
    { week_key: body.week, ...body.meta, updated_at: new Date().toISOString() },
    { onConflict: "week_key" }
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
