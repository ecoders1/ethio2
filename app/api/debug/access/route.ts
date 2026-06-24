import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth.server";

// Admin debug endpoint
// GET /api/debug/access?exam_id=xxx
export async function GET(req: NextRequest) {
  const payload = await getAuthUser();
  if (!payload?.isAdmin)
    return NextResponse.json({ error: "Admin only" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const examId    = searchParams.get("exam_id");
  const userId    = searchParams.get("user_id");
  const supabase  = createServerSupabaseClient();
  const out: Record<string, unknown> = { payload };

  if (examId) {
    const { data: exam, error: ee } = await supabase
      .from("exams").select("*").eq("id", examId).single();
    out.exam = exam; out.exam_error = ee?.message;

    const { data: qs, count, error: qe } = await supabase
      .from("questions").select("id", { count: "exact" }).eq("exam_id", examId);
    out.question_count = count; out.question_error = qe?.message;
    out.sample_question_ids = qs?.slice(0, 3).map(q => q.id);

    if (userId && exam) {
      const { data: acc, error: ae } = await supabase
        .from("user_department_access").select("*")
        .eq("user_id", userId).eq("department_id", exam.department_id);
      out.access_rows = acc; out.access_error = ae?.message;

      const { data: pays, error: pe } = await supabase
        .from("payments").select("id,status,amount")
        .eq("user_id", userId).eq("department_id", exam.department_id);
      out.payments = pays; out.payment_error = pe?.message;
    }
  }

  // Test that service_role can read user_department_access
  const { data: testRead, error: testErr } = await supabase
    .from("user_department_access").select("id").limit(1);
  out.rls_test = { can_read: !!testRead, error: testErr?.message };

  return NextResponse.json(out, { status: 200 });
}
