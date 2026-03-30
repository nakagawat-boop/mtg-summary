export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
const SC_KEYS = ["kiyono","ibaraki","kikuchi","fukuda","onishi","minami"];
export async function GET() {
  const res = await fetch("https://sc-weekly.vercel.app/api/weeks", { cache: "no-store" });
  const { weeks } = await res.json();
  const rows = await Promise.all((weeks || []).slice(-6).map(async (week_key: string) => {
    const r = await fetch(`https://sc-weekly.vercel.app/api/data?week=${week_key}`, { cache: "no-store" });
    const { payload } = await r.json();
    const caData = payload?.caData || {};
    const ca = SC_KEYS.map((k: string) => ({
      sales: Number(caData[k]?.sales) || 0,
      decided: Number(caData[k]?.decided) || 0,
      meetings: Number(caData[k]?.meetings) || 0,
      active: Number(caData[k]?.active) || 0,
      zuha: Number(caData[k]?.zuha) || 0,
      cl: Number(caData[k]?.cl) || 0,
    }));
    return { week_key, ca };
  }));
  return NextResponse.json({ rows });
}
