import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth.server";

export async function GET(req: NextRequest) {
  void req;
  const payload = await getAuthUser();
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("exam_results")
    .select("*, exams(title, year, departments(name))")
    .eq("user_id", payload.userId)
    .order("completed_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ results: data });
}

export async function POST(req: NextRequest) {
  const payload = await getAuthUser();
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { exam_id, score, total_questions, answers } = await req.json();

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("exam_results")
    .insert({
      id: crypto.randomUUID(),
      user_id: payload.userId,
      exam_id,
      score,
      total_questions,
      answers,
      completed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ result: data }, { status: 201 });
}
