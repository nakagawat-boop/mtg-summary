import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
const SC_KEYS = ["kiyono","ibaraki","kikuchi","fukuda","onishi","minami"];
export async function GET() {
  const { createClient } = await import("@supabase/supabase-js");
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { data } = await sb.from("sc_weekly_data").select("week_key, payload").order("week_key", { ascending: true }).limit(6);
  const rows = (data || []).map((r:any) => ({
    week_key: r.week_key,
    ca: SC_KEYS.map((k:string) => ({
      sales: Number(r.payload?.caData?.[k]?.sales)||0,
      decided: Number(r.payload?.caData?.[k]?.decided)||0,
      meetings: Number(r.payload?.caData?.[k]?.meetings)||0,
      active: Number(r.payload?.caData?.[k]?.active)||0,
      zuha: Number(r.payload?.caData?.[k]?.zuha)||0,
      cl: Number(r.payload?.caData?.[k]?.cl)||0,
    })),
  }));
  return NextResponse.json({ rows });
}
