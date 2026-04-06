export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

export async function GET() {
  // carista-weeklyのweeksリストを直接取得
  const weeksR = await fetch("https://carista-weekly.vercel.app/api/weeks", { cache: "no-store" });
  const { weeks } = await weeksR.json();
  
  // 最新8週分を取得
  const targets = (weeks || []).slice(0, 8);
  
  const results = await Promise.all(
    targets.map(async (week: string) => {
      try {
        const r = await fetch(`https://carista-weekly.vercel.app/api/data?week=${week}`, { cache: "no-store" });
        if (!r.ok) return null;
        const d = await r.json();
        const ca = d?.data?.cs?.ca;
        if (!ca?.length) return null;
        return {
          week_key: week,
          ca: ca.map((c: any) => ({
            sales:    Number(c.sales)    || 0,
            decided:  Number(c.decided)  || 0,
            meetings: Number(c.meetings) || 0,
            active:   Number(c.active)   || 0,
            zuba:     Number(c.zuba)     || 0,
            cl:       Number(c.cl)       || 0,
          }))
        };
      } catch { return null; }
    })
  );
  const rows = results.filter(Boolean).slice(0, 6);
  return NextResponse.json({ rows });
}
