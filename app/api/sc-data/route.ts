export const dynamic = "force-dynamic";
import { getSupabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

const SC_CA_KEYS = ["kiyono","ibaraki","kikuchi","fukuda","onishi","minami"];

export async function GET(req: NextRequest) {
  const week = req.nextUrl.searchParams.get("week");
  if (!week) return NextResponse.json({ error: "week required" }, { status: 400 });
  const { data } = await getSupabase()
    .from("sc_weekly_data").select("payload").eq("week_key", week).single();
  if (!data?.payload) return NextResponse.json({ payload: null });
  const caData = data.payload.caData || {};
  const ca = SC_CA_KEYS.map(k => ({
    sales:    caData[k]?.sales    ?? 0,
    decided:  caData[k]?.decided  ?? 0,
    meetings: caData[k]?.meetings ?? 0,
    active:   caData[k]?.active   ?? 0,
    zuha:     caData[k]?.zuha     ?? 0,
    cl:       caData[k]?.cl       ?? 0,
  }));
  const pjCards = data.payload.pjCards || [];
  return NextResponse.json({ payload: { ca, pjCards } });
}
