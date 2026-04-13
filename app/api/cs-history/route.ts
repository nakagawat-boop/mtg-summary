export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

export async function GET() {
  const weeksR = await fetch("https://carista-weekly.vercel.app/api/weeks", { cache: "no-store" });
  const { weeks } = await weeksR.json();

  // 今月の全パターン + 先月の全パターンを候補に
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth() + 1;
  const pm = m === 1 ? 12 : m - 1;
  const py = m === 1 ? y - 1 : y;
  const mm = String(m).padStart(2,'0');
  const pmm = String(pm).padStart(2,'0');
  const thisCandidates = [1,2,3,4,5].map(n => `${y}_${mm}_${n}W`);
  const prevCandidates = [4,5].map(n => `${py}_${pmm}_${n}W`);

  const allKeys: string[] = [];
  [...thisCandidates, ...prevCandidates].forEach(k => { if(!allKeys.includes(k)) allKeys.push(k); });
  (weeks||[]).forEach((k: string) => { if(!allKeys.includes(k)) allKeys.push(k); });

  const results = await Promise.all(
    allKeys.slice(0, 15).map(async (week: string) => {
      try {
        const r = await fetch(`https://carista-weekly.vercel.app/api/data?week=${week}`, { cache: "no-store" });
        if (!r.ok) return null;
        const d = await r.json();
        const csCA: any[] = d?.data?.cs?.ca || [];
        const cslCA: any[] = d?.data?.csl?.ca || [];
        const hasData = [...csCA, ...cslCA].some((c: any) =>
          (c.meetings||0) > 0 || (c.active||0) > 0 || (c.decided||0) > 0
        );
        if (!hasData) return null;
        const len = Math.max(csCA.length, cslCA.length);
        const ca = Array.from({ length: len }, (_: unknown, i: number) => {
          const cs = csCA[i] || {};
          const csl = cslCA[i] || {};
          return {
            sales:    (Number(cs.sales)||0)    + (Number(csl.sales)||0),
            decided:  (Number(cs.decided)||0)  + (Number(csl.decided)||0),
            meetings: (Number(cs.meetings)||0) + (Number(csl.meetings)||0),
            active:   (Number(cs.active)||0)   + (Number(csl.active)||0),
            zuba:     (Number(cs.zuba)||0)     + (Number(csl.zuba)||0),
            cl:       (Number(cs.cl)||0)       + (Number(csl.cl)||0),
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
