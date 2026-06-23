import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth.server";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getAuthUser();
  if (!payload?.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { status } = await req.json();

  if (!["approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();

  const { data: payment, error: fetchError } = await supabase
    .from("payments")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("payments")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If approved, grant department access
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

  return NextResponse.json({ payment: data });
}
