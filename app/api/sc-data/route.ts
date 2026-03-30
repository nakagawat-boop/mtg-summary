import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
const SC_KEYS = ["kiyono","ibaraki","kikuchi","fukuda","onishi","minami"];
export async function GET(req: NextRequest) {
  const week = req.nextUrl.searchParams.get("week");
  if (!week) return NextResponse.json({ error: "week required" }, { status: 400 });
  const { createClient } = await import("@supabase/supabase-js");
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { data } = await sb.from("sc_weekly_data").select("payload").eq("week_key", week).single();
  if (!data?.payload) return NextResponse.json({ payload: null });
  const ca = SC_KEYS.map((k:string) => ({
    sales: Number(data.payload.caData?.[k]?.sales)||0,
    decided: Number(data.payload.caData?.[k]?.decided)||0,
    meetings: Number(data.payload.caData?.[k]?.meetings)||0,
    active: Number(data.payload.caData?.[k]?.active)||0,
    zuha: Number(data.payload.caData?.[k]?.zuha)||0,
    cl: Number(data.payload.caData?.[k]?.cl)||0,
  }));
  return NextResponse.json({ payload: { ca, pjCards: data.payload.pjCards || [] } });
}
