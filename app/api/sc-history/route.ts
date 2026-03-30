export const dynamic = "force-dynamic";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
export async function GET(req: NextRequest) {
  const { data } = await sb.from("sc_weekly_data")
    .select("week_key, payload")
    .order("week_key", { ascending: false })
    .limit(6);
  return NextResponse.json({ rows: data ?? [] });
}
