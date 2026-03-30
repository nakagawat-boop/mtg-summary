import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder"
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
export async function GET(req: NextRequest) {
  const week = req.nextUrl.searchParams.get("week");
  if (!week) return NextResponse.json({ error: "week required" }, { status: 400 });
  const { data } = await sb()
    .from("sc_weekly_data").select("payload").eq("week_key", week).single();
  if (!data?.payload) return NextResponse.json({ payload: null });
  return NextResponse.json({ payload: { ca: norm(data.payload.caData), pjCards: data.payload.pjCards || [] } });
}
