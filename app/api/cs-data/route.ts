export const dynamic = "force-dynamic";
import { getSupabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const week = req.nextUrl.searchParams.get("week");
  if (!week) return NextResponse.json({ error: "week required" }, { status: 400 });
  const { data } = await getSupabase()
    .from("weekly_data").select("data").eq("week_key", week).single();
  if (!data?.data) return NextResponse.json({ payload: null });
  const ca = (data.data.cs?.ca || []).map((r: any) => ({
    sales:    r.sales    ?? 0,
    decided:  r.decided  ?? 0,
    meetings: r.meetings ?? 0,
    active:   r.active   ?? 0,
    zuha:     r.zuha     ?? 0,
    cl:       r.cl       ?? 0,
  }));
  return NextResponse.json({ payload: { ca } });
}
