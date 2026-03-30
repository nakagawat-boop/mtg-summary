export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
export async function GET(_req: NextRequest) {
  return NextResponse.json({ meta: null });
}
export async function POST(_req: NextRequest) {
  return NextResponse.json({ ok: true });
}
