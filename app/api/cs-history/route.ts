import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder"
  );
}

function norm(caArr: any[]) {
  return (caArr || []).map((r:any) => ({
    sales:    Number(r?.sales)    || 0,
    decided:  Number(r?.decided)  || 0,
    meetings: Number(r?.meetings) || 0,
    active:   Number(r?.active)   || 0,
    zuha:     Number(r?.zuha)     || 0,
    cl:       Number(r?.cl)       || 0,
  }));
}
export async function GET() {
  const { data } = await sb()
    .from("weekly_data")
    .select("week_key, data")
    .order("week_key", { ascending: true })
    .limit(6);
  const rows = (data || []).map((r:any) => ({
    week_key: r.week_key,
    ca: norm(r.data?.cs?.ca),
  }));
  return NextResponse.json({ rows });
}
