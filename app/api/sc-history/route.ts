export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

const SC_KEYS = ["kiyono","ibaraki","kikuchi","fukuda","onishi","minami"];

function getRecentMondays(): string[] {
  const weeks: string[] = [];
  // JST = UTC+9
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const day = now.getUTCDay(); // 0=日, 1=月
  const diffToMonday = day === 0 ? 6 : day - 1;
  now.setUTCDate(now.getUTCDate() - diffToMonday);
  for (let i = 0; i < 8; i++) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i * 7);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    weeks.push(`Week_${y}_${m}_${dd}`);
  }
  return weeks;
}

export async function GET() {
  const candidates = getRecentMondays();
  const results = await Promise.all(
    candidates.map(async week => {
      try {
        const r = await fetch(`https://sc-weekly.vercel.app/api/data?week=${week}`, { cache: "no-store" });
        if (!r.ok) return null;
        const d = await r.json();
        if (!d.payload?.caData) return null;
        const hasData = SC_KEYS.some(k => (Number(d.payload.caData[k]?.meetings)||0) > 0 || (Number(d.payload.caData[k]?.decided)||0) > 0);
        if (!hasData) return null;
        return {
          week_key: week,
          ca: SC_KEYS.map(k => ({
            sales:    Number(d.payload.caData[k]?.sales)    || 0,
            decided:  Number(d.payload.caData[k]?.decided)  || 0,
            meetings: Number(d.payload.caData[k]?.meetings) || 0,
            active:   Number(d.payload.caData[k]?.active)   || 0,
            zuha:     Number(d.payload.caData[k]?.zuha)     || 0,
            cl:       Number(d.payload.caData[k]?.cl)       || 0,
          }))
        };
      } catch { return null; }
    })
  );
  const rows = results.filter(Boolean).slice(0, 6);
  return NextResponse.json({ rows });
}
