import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth.server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  void req;
  const { id } = await params;
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("exams")
    .select("*, departments(name, name_am, name_om)")
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ exam: data });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getAuthUser();
  if (!payload?.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("exams")
    .update(body)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ exam: data });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  void req;
  const payload = await getAuthUser();
  if (!payload?.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("exams").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
