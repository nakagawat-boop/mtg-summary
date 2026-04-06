export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

function mondayWeekNum(date: Date): number {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  const day = date.getUTCDate();
  let count = 0;
  for (let d = 1; d <= day; d++) {
    if (new Date(Date.UTC(y, m, d)).getUTCDay() === 1) count++;
  }
  return count || 1;
}

function getRecentCsWeeks(): string[] {
  const result: string[] = [];
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const dow = now.getUTCDay();
  const diff = dow === 0 ? 6 : dow - 1;
  now.setUTCDate(now.getUTCDate() - diff);
  for (let i = 0; i < 8; i++) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i * 7);
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth() + 1;
    const w = mondayWeekNum(d);
    const key = `${y}_${String(m).padStart(2,'0')}_${w}W`;
    if (!result.includes(key)) result.push(key);
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
  const seen = new Set<string>();
  const rows = results.filter((r): r is NonNullable<typeof r> => {
    if (!r) return false;
    if (seen.has(r.week_key)) return false;
    seen.add(r.week_key);
    return true;
  }).slice(0, 6);
  return NextResponse.json({ rows, debug_candidates: candidates });
}
