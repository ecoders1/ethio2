import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth.server";

// Debug endpoint — admin only
// GET /api/debug/access?exam_id=xxx
export async function GET(req: NextRequest) {
  const payload = await getAuthUser();
  if (!payload?.isAdmin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const examId = searchParams.get("exam_id");
  const userId = searchParams.get("user_id");

  const supabase = createServerSupabaseClient();

  const results: Record<string, unknown> = {};

  if (examId) {
    const { data: exam } = await supabase
      .from("exams")
      .select("id, title, is_free, department_id")
      .eq("id", examId)
      .single();
    results.exam = exam;

    const { count } = await supabase
      .from("questions")
      .select("id", { count: "exact" })
      .eq("exam_id", examId);
    results.question_count = count;
  }

  if (userId && examId) {
    const { data: exam } = await supabase
      .from("exams")
      .select("department_id")
      .eq("id", examId)
      .single();

    if (exam) {
      const { data: access } = await supabase
        .from("user_department_access")
        .select("*")
        .eq("user_id", userId)
        .eq("department_id", exam.department_id);
      results.access_rows = access;

      const { data: payments } = await supabase
        .from("payments")
        .select("id, status, amount, created_at")
        .eq("user_id", userId)
        .eq("department_id", exam.department_id);
      results.payments = payments;
    }
  }

  return NextResponse.json(results);
}
