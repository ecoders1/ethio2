import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth.server";

export async function GET(req: NextRequest) {
  void req;
  const payload = await getAuthUser();
  if (!payload?.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServerSupabaseClient();

  const [usersRes, deptsRes, examsRes, paymentsRes] = await Promise.all([
    supabase.from("users").select("id", { count: "exact" }).eq("is_admin", false),
    supabase.from("departments").select("id", { count: "exact" }).eq("is_active", true),
    supabase.from("exams").select("id", { count: "exact" }).eq("is_active", true),
    supabase.from("payments").select("id, amount, status", { count: "exact" }),
  ]);

  const totalRevenue = paymentsRes.data
    ?.filter((p) => p.status === "approved")
    .reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;

  return NextResponse.json({
    stats: {
      total_users: usersRes.count || 0,
      total_departments: deptsRes.count || 0,
      total_exams: examsRes.count || 0,
      total_payments: paymentsRes.count || 0,
      total_revenue: totalRevenue,
      pending_payments: paymentsRes.data?.filter((p) => p.status === "pending").length || 0,
    },
  });
}
