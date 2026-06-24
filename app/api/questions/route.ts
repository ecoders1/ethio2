import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth.server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const examId = searchParams.get("exam_id");

  if (!examId) return NextResponse.json({ error: "exam_id required" }, { status: 400 });

  const payload = await getAuthUser();
  const supabase = createServerSupabaseClient();

  // Get exam + department
  const { data: exam } = await supabase
    .from("exams")
    .select("id, is_free, department_id, departments(id)")
    .eq("id", examId)
    .single();

  if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

  const deptId = exam.department_id;

  // Determine how many questions to return
  let limitTo20 = false;

  if (!payload) {
    // Not logged in — only free preview
    limitTo20 = true;
  } else if (payload.isAdmin) {
    // Admin sees everything
    limitTo20 = false;
  } else if (exam.is_free) {
    // Exam explicitly marked free — all questions
    limitTo20 = false;
  } else {
    // Check if user has paid for this department
    const { data: access } = await supabase
      .from("user_department_access")
      .select("id")
      .eq("user_id", payload.userId)
      .eq("department_id", deptId)
      .maybeSingle();

    limitTo20 = !access; // limit if no access record
  }

  let query = supabase
    .from("questions")
    .select("id, exam_id, question_number, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation")
    .eq("exam_id", examId)
    .order("question_number");

  if (limitTo20) {
    query = query.lte("question_number", 20);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ questions: data, limited: limitTo20 });
}

export async function POST(req: NextRequest) {
  const payload = await getAuthUser();
  if (!payload?.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const questions = await req.json();
  const list = Array.isArray(questions) ? questions : [questions];

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("questions")
    .insert(list.map((q) => ({ id: crypto.randomUUID(), ...q })))
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ questions: data }, { status: 201 });
}
