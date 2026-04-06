export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

const SC_KEYS = ["kiyono","ibaraki","kikuchi","fukuda","onishi","minami"];

export async function GET() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const res = await fetch(
    `${url}/rest/v1/sc_weekly_data?select=week_key,payload&order=week_key.asc&limit=6`,
    { headers: { "apikey": key, "Authorization": `Bearer ${key}` }, cache: "no-store" }
  );
  const data = await res.json();
  const rows = (data || []).map((r: any) => ({
    week_key: r.week_key,
    ca: SC_KEYS.map(k => ({
      sales:    Number(r.payload?.caData?.[k]?.sales)    || 0,
      decided:  Number(r.payload?.caData?.[k]?.decided)  || 0,
      meetings: Number(r.payload?.caData?.[k]?.meetings) || 0,
      active:   Number(r.payload?.caData?.[k]?.active)   || 0,
      zuha:     Number(r.payload?.caData?.[k]?.zuha)     || 0,
      cl:       Number(r.payload?.caData?.[k]?.cl)       || 0,
    }))
  }));
  return NextResponse.json({ rows });
}
