export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

function getRecentCsWeeks(): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
  for (let i = 0; i < 10; i++) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i * 7);
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth() + 1;
    const day = d.getUTCDate();
    // carista-weeklyの週番号: 日付÷7の切り上げ
    const weekNum = Math.ceil(day / 7);
    const key = `${y}_${String(m).padStart(2,'0')}_${weekNum}W`;
    if (!seen.has(key)) { seen.add(key); result.push(key); }
  }
  return result;
}

export async function GET() {
  const candidates = getRecentCsWeeks();
  const results = await Promise.all(
    candidates.map(async week => {
      try {
        const r = await fetch(`https://carista-weekly.vercel.app/api/data?week=${week}`, { cache: "no-store" });
        if (!r.ok) return null;
        const d = await r.json();
        const ca = d?.data?.cs?.ca;
        if (!ca?.length) return null;
        const hasData = ca.some((c: any) => (c.meetings||0) > 0 || (c.active||0) > 0 || (c.decided||0) > 0);
        if (!hasData) return null;
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
