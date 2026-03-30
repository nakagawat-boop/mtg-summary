export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
export async function GET(req: NextRequest) {
  const week = req.nextUrl.searchParams.get("week");
  if (!week) return NextResponse.json({ error: "week required" }, { status: 400 });
  const r = await fetch(`https://carista-weekly.vercel.app/api/data?week=${week}`, { cache: "no-store" });
  const d = await r.json();
  if (!d?.data) return NextResponse.json({ payload: null });
  const ca = (d.data.cs?.ca || []).map((c: any) => ({
    sales: Number(c?.sales) || 0,
    decided: Number(c?.decided) || 0,
    meetings: Number(c?.meetings) || 0,
    active: Number(c?.active) || 0,
    zuha: Number(c?.zuha) || 0,
    cl: Number(c?.cl) || 0,
  }));
  return NextResponse.json({ payload: { ca } });
}
