import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export async function GET() {
  const { createClient } = await import("@supabase/supabase-js");
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { data } = await sb.from("weekly_data").select("week_key, data").order("week_key", { ascending: true }).limit(6);
  const rows = (data || []).map((r:any) => ({
    week_key: r.week_key,
    ca: (r.data?.cs?.ca || []).map((c:any) => ({
      sales: Number(c?.sales)||0, decided: Number(c?.decided)||0,
      meetings: Number(c?.meetings)||0, active: Number(c?.active)||0,
      zuha: Number(c?.zuha)||0, cl: Number(c?.cl)||0,
    })),
  }));
  return NextResponse.json({ rows });
}
