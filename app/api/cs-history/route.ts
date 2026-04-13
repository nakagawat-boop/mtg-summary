export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

function getRecentCsWeeks(): string[] {
  const result: string[] = [];
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const dow = now.getUTCDay();
  now.setUTCDate(now.getUTCDate() - (dow === 0 ? 6 : dow - 1));
  for (let i = 0; i < 8; i++) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i * 7);
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth() + 1;
    let count = 0;
    for (let dd = 1; dd <= d.getUTCDate(); dd++) {
      if (new Date(Date.UTC(y, m - 1, dd)).getUTCDay() === 1) count++;
    }
    const key = `${y}_${String(m).padStart(2,'0')}_${count}W`;
    if (!result.includes(key)) result.push(key);
  }
  return result;
}

export async function GET() {
  const weeksR = await fetch("https://carista-weekly.vercel.app/api/weeks", { cache: "no-store" });
  const { weeks } = await weeksR.json();
  const thisWeekCandidates = getRecentCsWeeks();
  const allKeys: string[] = [];
  thisWeekCandidates.forEach(k => { if (!allKeys.includes(k)) allKeys.push(k); });
  (weeks || []).forEach((k: string) => { if (!allKeys.includes(k)) allKeys.push(k); });
  const targets = allKeys.slice(0, 12);

  const results = await Promise.all(
    targets.map(async (week: string) => {
      try {
        const r = await fetch(`https://carista-weekly.vercel.app/api/data?week=${week}`, { cache: "no-store" });
        if (!r.ok) return null;
        const d = await r.json();
        const csCA: any[] = d?.data?.cs?.ca || [];
        const cslCA: any[] = d?.data?.csl?.ca || [];
        if (!csCA.length && !cslCA.length) return null;
        const len = Math.max(csCA.length, cslCA.length);
        const hasData = [...csCA, ...cslCA].some((c: any) =>
          (c.meetings||0) > 0 || (c.active||0) > 0 || (c.decided||0) > 0
        );
        if (!hasData) return null;
        // CS + CSL を合算
        const ca = Array.from({ length: len }, (_, i) => {
          const cs = csCA[i] || {};
          const csl = cslCA[i] || {};
          return {
            sales:    (Number(cs.sales)    || 0) + (Number(csl.sales)    || 0),
            decided:  (Number(cs.decided)  || 0) + (Number(csl.decided)  || 0),
            meetings: (Number(cs.meetings) || 0) + (Number(csl.meetings) || 0),
            active:   (Number(cs.active)   || 0) + (Number(csl.active)   || 0),
            zuba:     (Number(cs.zuba)     || 0) + (Number(csl.zuba)     || 0),
            cl:       (Number(cs.cl)       || 0) + (Number(csl.cl)       || 0),
          };
        });
        return { week_key: week, ca };
      } catch { return null; }
    })
  );

  const seen: string[] = [];
  const rows = results.filter((r): r is NonNullable<typeof r> => {
    if (!r) return false;
    if (seen.includes(r.week_key)) return false;
    seen.push(r.week_key);
    return true;
  });
  rows.sort((a, b) => b.week_key.localeCompare(a.week_key));
  return NextResponse.json({ rows: rows.slice(0, 6) });
}
