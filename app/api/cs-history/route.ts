export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
export async function GET() {
  const res = await fetch("https://carista-weekly.vercel.app/api/weeks", { cache: "no-store" });
  const { weeks } = await res.json();
  const rows = await Promise.all((weeks || []).slice(-6).map(async (week_key: string) => {
    const r = await fetch(`https://carista-weekly.vercel.app/api/data?week=${week_key}`, { cache: "no-store" });
    const d = await r.json();
    const caArr = d?.data?.cs?.ca || [];
    const ca = caArr.map((c: any) => ({
      sales: Number(c?.sales) || 0,
      decided: Number(c?.decided) || 0,
      meetings: Number(c?.meetings) || 0,
      active: Number(c?.active) || 0,
      zuha: Number(c?.zuha) || 0,
      cl: Number(c?.cl) || 0,
    }));
    return { week_key, ca };
  }));
  return NextResponse.json({ rows });
}
