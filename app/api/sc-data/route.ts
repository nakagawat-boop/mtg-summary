import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
export async function GET(req: NextRequest) {
  const week = req.nextUrl.searchParams.get("week");
  if (!week) return NextResponse.json({ error: "week required" }, { status: 400 });
  const { data } = await sb.from("sc_weekly_data").select("payload").eq("week_key", week).single();
  return NextResponse.json({ payload: data?.payload ?? null });
}
