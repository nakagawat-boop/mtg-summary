import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
  );
}

const SC_KEYS = ["kiyono","ibaraki","kikuchi","fukuda","onishi","minami"];
function norm(caData: any) {
  return SC_KEYS.map((k:string) => ({
    sales:    Number(caData?.[k]?.sales)    || 0,
    decided:  Number(caData?.[k]?.decided)  || 0,
    meetings: Number(caData?.[k]?.meetings) || 0,
    active:   Number(caData?.[k]?.active)   || 0,
    zuha:     Number(caData?.[k]?.zuha)     || 0,
    cl:       Number(caData?.[k]?.cl)       || 0,
  }));
}
export async function GET() {
  const { data } = await sb()
    .from("sc_weekly_data")
    .select("week_key, payload")
    .order("week_key", { ascending: true })
    .limit(6);
  const rows = (data || []).map((r:any) => ({
    week_key: r.week_key,
    ca: norm(r.payload?.caData),
  }));
  return NextResponse.json({ rows });
}
