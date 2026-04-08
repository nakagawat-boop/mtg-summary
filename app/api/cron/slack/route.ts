export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

const SC_NAMES = ["清野","茨木","菊地","福田","大西","南原"];
const CS_NAMES = ["中村","大城","小谷","喜多"];

function total(rows: any[], key: string): number {
  return rows.reduce((s: number, r: any) => s + (Number(r[key]) || 0), 0);
}

function diff(now: number, prev: number, unit: string): string {
  const d = now - prev;
  if (d > 0) return `（先週比+${d}${unit}⤴️）`;
  if (d < 0) return `（先週比${d}${unit}⤇）`;
  return `（先週比±0）`;
}

export async function GET(req: Request) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const [scR, csR] = await Promise.all([
    fetch('https://mtg-summary.vercel.app/api/sc-history', { cache: 'no-store' }).then(r => r.json()),
    fetch('https://mtg-summary.vercel.app/api/cs-history', { cache: 'no-store' }).then(r => r.json()),
  ]);

  const scRows: any[] = scR.rows || [];
  const csRows: any[] = csR.rows || [];
  const scThis: any[] = scRows[0]?.ca || [];
  const scPrev: any[] = scRows[1]?.ca || [];
  const csThis: any[] = csRows[0]?.ca || [];
  const csPrev: any[] = csRows[1]?.ca || [];

  const today = new Date(Date.now() + 9*60*60*1000).toISOString().slice(0,10).replace(/-/g,'/');

  const td = total(scThis,'decided') + total(csThis,'decided');
  const pd = total(scPrev,'decided') + total(csPrev,'decided');
  const ts = total(scThis,'sales') + total(csThis,'sales');
  const ps = total(scPrev,'sales') + total(csPrev,'sales');
  const tm = total(scThis,'meetings') + total(csThis,'meetings');
  const pm = total(scPrev,'meetings') + total(csPrev,'meetings');
  const ta = total(scThis,'active') + total(csThis,'active');
  const pa = total(scPrev,'active') + total(csPrev,'active');
  const tz = total(scThis,'zuba') + total(csThis,'zuba');
  const pz = total(scPrev,'zuba') + total(csPrev,'zuba');
  const tc = total(scThis,'cl') + total(csThis,'cl');
  const pc = total(scPrev,'cl') + total(csPrev,'cl');

  const lines: string[] = [
    `📣 *営業週次サマリー｜${today}*（先週比）`,
    '',
    '*【全体 SC＋CS】*',
    `✅ 決定数: *${td}件* ${diff(td,pd,'件')} (SC ${total(scThis,'decided')} / CS ${total(csThis,'decided')})`,
    `💰 売上: *${ts}万* ${diff(ts,ps,'万')} (SC ${total(scThis,'sales')} / CS ${total(csThis,'sales')})`,
    `👥 面談数: *${tm}件* ${diff(tm,pm,'件')} (SC ${total(scThis,'meetings')} / CS ${total(csThis,'meetings')})`,
    `⚡ 稼働数: *${ta}名* ${diff(ta,pa,'名')} (SC ${total(scThis,'active')} / CS ${total(csThis,'active')})`,
    `🎯 ズバ確定: *${tz}万* ${diff(tz,pz,'万')}`,
    `📈 CL見込み: *${tc}万* ${diff(tc,pc,'万')} (SC ${total(scThis,'cl')} / CS ${total(csThis,'cl')})`,
    '',
    '*【SC CA別】*',
  ];

  SC_NAMES.forEach((name, i) => {
    const ca = scThis[i] || {};
    const pca = scPrev[i] || {};
    lines.push(`  ${name}: 決定${ca.decided||0}${diff(ca.decided||0, pca.decided||0,'件')} 売上${ca.sales||0}万 面談${ca.meetings||0} 稼働${ca.active||0}`);
  });

  lines.push('', '*【CS CA別】*');
  CS_NAMES.forEach((name, i) => {
    const ca = csThis[i] || {};
    const pca = csPrev[i] || {};
    lines.push(`  ${name}: 決定${ca.decided||0}${diff(ca.decided||0, pca.decided||0,'件')} 売上${ca.sales||0}万 面談${ca.meetings||0} 稼働${ca.active||0}`);
  });

  await fetch(process.env.SLACK_WEBHOOK_URL!, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({text: lines.join('\n'), username: '月次進捗レポート', icon_emoji: ':mega:'}),
  });

  return NextResponse.json({ ok: true });
}
