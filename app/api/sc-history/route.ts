export const dynamic = "force-dynamic";
import { getSupabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

const SC_CA_KEYS = ["kiyono","ibaraki","kikuchi","fukuda","onishi","minami"];

export async function GET() {
  const { data } = await getSupabase()
    .from("sc_weekly_data").select("week_key, payload")
    .order("week_key", { ascending: true }).limit(6);
  const rows = (data || []).map(r => {
    const caData = r.payload?.caData || {};
    const ca = SC_CA_KEYS.map(k => ({
      sales:    caData[k]?.sales    ?? 0,
      decided:  caData[k]?.decided  ?? 0,
      meetings: caData[k]?.meetings ?? 0,
      active:   caData[k]?.active   ?? 0,
      zuha:     caData[k]?.zuha     ?? 0,
      cl:       caData[k]?.cl       ?? 0,
    }));
    return { week_key: r.week_key, ca };
  });
  return NextResponse.json({ rows });
}
