export const dynamic = "force-dynamic";
import { getSupabase } from "@/lib/supabase";
import { NextResponse } from "next/server";
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
export async function GET() {
  const { data } = await getSupabase()
    .from("weekly_data")
    .select("week_key, data")
    .order("week_key", { ascending: true })
    .limit(6);
  const rows = (data || []).map(r => ({
    week_key: r.week_key,
    ca: normCsCa(r.data?.cs?.ca),
  }));
  return NextResponse.json({ rows });
}
