import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth.server";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getAuthUser();
  if (!payload?.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  // Don't allow password_hash update via this endpoint
  delete body.password_hash;

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id, full_name, email, is_admin, device_id, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ user: data });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  void req;
  const payload = await getAuthUser();
  if (!payload?.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (id === payload.userId) {
    return NextResponse.json({ error: "Cannot delete your own account." }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("users").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
