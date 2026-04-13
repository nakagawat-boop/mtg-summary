export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

export async function GET() {
  const weeksR = await fetch("https://carista-weekly.vercel.app/api/weeks", { cache: "no-store" });
  const { weeks } = await weeksR.json();

  const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const y = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2,'0');
  const thisMonthKeys = [`${y}_${mm}_1W`,`${y}_${mm}_2W`,`${y}_${mm}_3W`,`${y}_${mm}_4W`,`${y}_${mm}_5W`];

  const allKeys: string[] = [];
  thisMonthKeys.forEach(k => { if(!allKeys.includes(k)) allKeys.push(k); });
  (weeks||[]).forEach((k: string) => { if(!allKeys.includes(k)) allKeys.push(k); });
  const targets = allKeys.slice(0, 12);

  const results = await Promise.all(
    targets.map(async (week: string) => {
      try {
        const r = await fetch(`https://carista-weekly.vercel.app/api/data?week=${week}`, { cache: "no-store" });
        if (!r.ok) return null;
        const d = await r.json();
        const ca = d?.data?.cs?.ca;
        if (!ca?.length) return null;
        const hasData = ca.some((c: any) => (c.meetings||0)>0 || (c.active||0)>0 || (c.decided||0)>0);
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

  const seen: string[] = [];
  const rows = results.filter((r): r is NonNullable<typeof r> => {
    if (!r) return false;
    if (seen.includes(r.week_key)) return false;
    seen.push(r.week_key);
    return true;
  }).slice(0, 6);

  // week_keyで降順ソート（新しい週が先頭）
  rows.sort((a: any, b: any) => b.week_key.localeCompare(a.week_key));
  return NextResponse.json({ rows });
}
