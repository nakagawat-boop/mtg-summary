import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const week = req.nextUrl.searchParams.get("week");
  if (!week) return NextResponse.json({ error: "week required" }, { status: 400 });
  const { createClient } = await import("@supabase/supabase-js");
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { data } = await sb.from("weekly_data").select("data").eq("week_key", week).single();
  if (!data?.data) return NextResponse.json({ payload: null });
  const ca = (data.data.cs?.ca || []).map((r:any) => ({
    sales: Number(r?.sales)||0, decided: Number(r?.decided)||0,
    meetings: Number(r?.meetings)||0, active: Number(r?.active)||0,
    zuha: Number(r?.zuha)||0, cl: Number(r?.cl)||0,
  }));
  return NextResponse.json({ payload: { ca } });
}
