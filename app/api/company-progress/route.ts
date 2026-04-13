export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";

function getEnv() {
  const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  return { key, url };
}

function headers(key: string) {
  return { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
}

export async function GET(req: NextRequest) {
  const week = req.nextUrl.searchParams.get("week");
  const { key, url } = getEnv();
  if (!key || !url) return NextResponse.json({ error: "Env vars missing" }, { status: 500 });

  const res = await fetch(
    `${url}/rest/v1/company_progress?week_key=eq.${encodeURIComponent(week || "")}&select=*&order=created_at.asc`,
    { headers: headers(key), cache: "no-store" }
  );

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: "Supabase error", status: res.status, details: err }, { status: res.status });
  }

  const rows = await res.json();
  return NextResponse.json({ rows });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { key, url } = getEnv();
  if (!key || !url) return NextResponse.json({ error: "Env vars missing" }, { status: 500 });

  const res = await fetch(`${url}/rest/v1/company_progress`, {
    method: "POST",
    headers: { ...headers(key), Prefer: "return=representation" },
    body: JSON.stringify({
      week_key: body.week_key,
      company: body.company,
      ca_name: body.ca_name,
      applied: body.applied || 0,
      first_interview: body.first_interview || 0,
      final_interview: body.final_interview || 0,
      offered: body.offered || 0,
      decided: body.decided || 0,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: "Supabase error", details: err }, { status: 500 });
  }

  const rows = await res.json();
  return NextResponse.json({ ok: true, id: rows?.[0]?.id });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { key, url } = getEnv();
  if (!key || !url) return NextResponse.json({ error: "Env vars missing" }, { status: 500 });

  const { id, ...fields } = body;
  const res = await fetch(
    `${url}/rest/v1/company_progress?id=eq.${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: { ...headers(key), Prefer: "return=minimal" },
      body: JSON.stringify({ ...fields, updated_at: new Date().toISOString() }),
      cache: "no-store",
    }
  );

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: "Supabase error", details: err }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  const { key, url } = getEnv();
  if (!key || !url) return NextResponse.json({ error: "Env vars missing" }, { status: 500 });

  const res = await fetch(
    `${url}/rest/v1/company_progress?id=eq.${encodeURIComponent(id || "")}`,
    {
      method: "DELETE",
      headers: { ...headers(key), Prefer: "return=minimal" },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: "Supabase error", details: err }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
