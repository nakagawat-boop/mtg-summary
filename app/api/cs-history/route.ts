export const dynamic = "force-dynamic";
import { getSupabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  const { data } = await getSupabase()
    .from("weekly_data").select("week_key, data")
    .order("week_key", { ascending: true }).limit(6);
  const rows = (data || []).map(r => {
    const ca = (r.data?.cs?.ca || []).map((c: any) => ({
      sales:    c.sales    ?? 0,
      decided:  c.decided  ?? 0,
      meetings: c.meetings ?? 0,
      active:   c.active   ?? 0,
      zuha:     c.zuha     ?? 0,
      cl:       c.cl       ?? 0,
    }));
    return { week_key: r.week_key, ca };
  });
  return NextResponse.json({ rows });
}
