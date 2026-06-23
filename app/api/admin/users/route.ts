import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth.server";
import { hashPassword } from "@/lib/auth";

export async function GET(req: NextRequest) {
  void req;
  const payload = await getAuthUser();
  if (!payload?.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, full_name, email, is_admin, device_id, created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ users: data });
}

export async function POST(req: NextRequest) {
  const payload = await getAuthUser();
  if (!payload?.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { full_name, email, password, is_admin } = await req.json();
  const supabase = createServerSupabaseClient();
  const passwordHash = await hashPassword(password || "changeme123");

  const { data, error } = await supabase
    .from("users")
    .insert({ id: crypto.randomUUID(), full_name, email: email.toLowerCase(), password_hash: passwordHash, is_admin: is_admin || false })
    .select("id, full_name, email, is_admin, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ user: data }, { status: 201 });
}
