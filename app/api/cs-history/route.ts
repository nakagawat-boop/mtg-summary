export const dynamic = "force-dynamic";
import { getSupabase } from "@/lib/supabase";
import { NextResponse } from "next/server";
export async function GET() {
  const { data } = await getSupabase().from("weekly_data").select("week_key, payload").order("week_key", { ascending: false }).limit(6);
  return NextResponse.json({ rows: data ?? [] });
}
