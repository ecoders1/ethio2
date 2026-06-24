import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth.server";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getAuthUser();
  if (!payload?.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { status, amount } = body;

  const supabase = createServerSupabaseClient();

  const { data: payment, error: fetchError } = await supabase
    .from("payments")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !payment)
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });

  // Build update object
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (status) {
    if (!["approved", "rejected", "pending"].includes(status))
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    updates.status = status;
  }

  if (amount !== undefined) updates.amount = amount;

  const { data, error } = await supabase
    .from("payments")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Approve → grant access
  if (status === "approved") {
    await supabase
      .from("user_department_access")
      .upsert({
        id: crypto.randomUUID(),
        user_id: payment.user_id,
        department_id: payment.department_id,
        granted_at: new Date().toISOString(),
      }, { onConflict: "user_id,department_id" });
  }

  // Reject / reset → revoke access
  if (status === "rejected" || status === "pending") {
    await supabase
      .from("user_department_access")
      .delete()
      .eq("user_id", payment.user_id)
      .eq("department_id", payment.department_id);
  }

  return NextResponse.json({ payment: data });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  void req;
  const payload = await getAuthUser();
  if (!payload?.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = createServerSupabaseClient();

  // Get payment first to revoke access if needed
  const { data: payment } = await supabase
    .from("payments")
    .select("user_id, department_id, status")
    .eq("id", id)
    .single();

  if (payment?.status === "approved") {
    // Revoke department access when deleting an approved payment
    await supabase
      .from("user_department_access")
      .delete()
      .eq("user_id", payment.user_id)
      .eq("department_id", payment.department_id);
  }

  const { error } = await supabase.from("payments").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
