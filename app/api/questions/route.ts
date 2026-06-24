import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth.server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const examId = searchParams.get("exam_id");

  if (!examId)
    return NextResponse.json({ error: "exam_id required" }, { status: 400 });

  const payload = await getAuthUser();

  // Always use service-role client — bypasses RLS
  const supabase = createServerSupabaseClient();

  // Get exam — only need department_id and is_free
  const { data: exam, error: examErr } = await supabase
    .from("exams")
    .select("id, is_free, department_id")
    .eq("id", examId)
    .single();

  if (examErr || !exam)
    return NextResponse.json({ error: "Exam not found" }, { status: 404 });

  const deptId = exam.department_id as string;

  // --- Access decision ---
  let limitTo20 = false;

  if (!payload) {
    // Not logged in
    limitTo20 = true;
  } else if (payload.isAdmin) {
    // Admin always sees all
    limitTo20 = false;
  } else if (exam.is_free) {
    // Explicitly free exam
    limitTo20 = false;
  } else {
    // Check user_department_access using service-role (bypasses RLS)
    const { data: accessRow, error: accessErr } = await supabase
      .from("user_department_access")
      .select("id")
      .eq("user_id", payload.userId)
      .eq("department_id", deptId)
      .maybeSingle();

    if (accessErr) {
      console.error("Access check error:", accessErr.message);
    }

    // If access row exists → user paid → show all questions
    limitTo20 = !accessRow;
  }

  // --- Fetch questions ---
  let query = supabase
    .from("questions")
    .select(
      "id, exam_id, question_number, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation"
    )
    .eq("exam_id", examId)
    .order("question_number", { ascending: true });

  if (limitTo20) {
    query = query.lte("question_number", 20);
  }

  const { data, error } = await query;

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    questions: data || [],
    limited: limitTo20,
    count: data?.length ?? 0,
  });
}

export async function POST(req: NextRequest) {
  const payload = await getAuthUser();
  if (!payload?.isAdmin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const questions = await req.json();
  const list = Array.isArray(questions) ? questions : [questions];

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("questions")
    .insert(list.map((q) => ({ id: crypto.randomUUID(), ...q })))
    .select();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ questions: data }, { status: 201 });
}
