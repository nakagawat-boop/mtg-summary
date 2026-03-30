export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
const SC_KEYS = ["kiyono","ibaraki","kikuchi","fukuda","onishi","minami"];
export async function GET(req: NextRequest) {
  const week = req.nextUrl.searchParams.get("week");
  if (!week) return NextResponse.json({ error: "week required" }, { status: 400 });
  const r = await fetch(`https://sc-weekly.vercel.app/api/data?week=${week}`, { cache: "no-store" });
  const { payload } = await r.json();
  if (!payload) return NextResponse.json({ payload: null });
  const ca = SC_KEYS.map((k: string) => ({
    sales: Number(payload.caData?.[k]?.sales) || 0,
    decided: Number(payload.caData?.[k]?.decided) || 0,
    meetings: Number(payload.caData?.[k]?.meetings) || 0,
    active: Number(payload.caData?.[k]?.active) || 0,
    zuha: Number(payload.caData?.[k]?.zuha) || 0,
    cl: Number(payload.caData?.[k]?.cl) || 0,
  }));
  return NextResponse.json({ payload: { ca, pjCards: payload.pjCards || [] } });
}
