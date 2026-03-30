export const dynamic = "force-dynamic";
import { getSupabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

// SCのcaDataキーをCA名順にマッピング
// DBキー: kiyono=清野, ibaraki=茨木, kikuchi=菊地, fukuda=福田, onishi=大西, minami=南原
const SC_KEYS = ["kiyono","ibaraki","kikuchi","fukuda","onishi","minami"];
function normScCa(caData: any) {
  return SC_KEYS.map(k => ({
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
  const { data } = await getSupabase()
    .from("sc_weekly_data").select("payload").eq("week_key", week).single();
  if (!data?.payload) return NextResponse.json({ payload: null });
  const ca = normScCa(data.payload.caData);
  const pjCards = data.payload.pjCards || [];
  return NextResponse.json({ payload: { ca, pjCards } });
}
