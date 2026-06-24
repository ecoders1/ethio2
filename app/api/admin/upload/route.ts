import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth.server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { extractTextFromBuffer, parseMCQFromText } from "@/lib/extractMCQ";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const payload = await getAuthUser();
  if (!payload?.isAdmin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file   = formData.get("file") as File | null;
  const examId = formData.get("exam_id") as string | null;

  if (!file || !examId)
    return NextResponse.json({ error: "file and exam_id are required" }, { status: 400 });

  const bytes  = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const supabase = createServerSupabaseClient();

  // Upload to storage
  await supabase.storage
    .from("exam-files")
    .upload(`uploads/${examId}/${Date.now()}_${file.name.replace(/\s+/g,"_")}`, buffer, {
      contentType: file.type,
    }).catch(() => null);

  // Extract text
  const text = await extractTextFromBuffer(buffer, file.type, file.name).catch(() => "");

  // Get current question count
  const { count } = await supabase
    .from("questions").select("id", { count: "exact" }).eq("exam_id", examId);
  const startNumber = (count || 0) + 1;

  // Parse MCQ
  const questions = parseMCQFromText(text, examId, startNumber);
  let savedCount = 0;

  if (questions.length > 0) {
    const { error } = await supabase.from("questions").insert(
      questions.map(q => ({
        id: crypto.randomUUID(),
        exam_id: examId,
        question_number: q.question_number,
        question_text: q.question_text,
        option_a: q.option_a, option_b: q.option_b,
        option_c: q.option_c, option_d: q.option_d,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
      }))
    );
    if (!error) savedCount = questions.length;
  }

  return NextResponse.json({
    success: true,
    extracted: questions.length,
    saved: savedCount,
    message: savedCount > 0
      ? `✅ ${savedCount} questions extracted and saved from ${file.name}`
      : `📄 File uploaded. Use TXT/MCQ format for auto-extraction.`,
  });
}
