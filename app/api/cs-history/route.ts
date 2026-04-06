export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

function getRecentCsWeeks(): string[] {
  const result: string[] = [];
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
  for (let i = 0; i < 8; i++) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i * 7);
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth() + 1;
    const day = d.getUTCDate();
    // 両方の計算方法を試す
    const w1 = Math.ceil(day / 7);
    const w2 = Math.floor((day - 1) / 7) + 1;
    const k1 = `${y}_${String(m).padStart(2,'0')}_${w1}W`;
    const k2 = `${y}_${String(m).padStart(2,'0')}_${w2}W`;
    if (!result.includes(k1)) result.push(k1);
    if (!result.includes(k2)) result.push(k2);
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
  // 重複week_keyを除去して最新6件
  const seen = new Set<string>();
  const rows = results.filter(r => {
    if (!r) return false;
    if (seen.has((r as any).week_key)) return false;
    seen.add((r as any).week_key);
    return true;
  }).slice(0, 6);
  return NextResponse.json({ rows });
}
