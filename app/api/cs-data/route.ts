export const dynamic = "force-dynamic";
import { getSupabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
function normCsCa(caArr: any[]) {
  return (caArr || []).map(r => ({
    sales:    Number(r?.sales)    || 0,
    decided:  Number(r?.decided)  || 0,
    meetings: Number(r?.meetings) || 0,
    active:   Number(r?.active)   || 0,
    zuha:     Number(r?.zuha)     || 0,
    cl:       Number(r?.cl)       || 0,
  }));
}
export async function GET(req: NextRequest) {
  const week = req.nextUrl.searchParams.get("week");
  if (!week) return NextResponse.json({ error: "week required" }, { status: 400 });
  const { data } = await getSupabase()
    .from("weekly_data").select("data").eq("week_key", week).single();
  if (!data?.data) return NextResponse.json({ payload: null });
  const ca = normCsCa(data.data.cs?.ca);
  return NextResponse.json({ payload: { ca } });
}
