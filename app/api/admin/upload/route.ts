import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth.server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { extractTextFromBuffer, parseMCQFromText } from "@/lib/extractMCQ";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const payload = await getAuthUser();
  if (!payload?.isAdmin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData    = await req.formData();
  const file        = formData.get("file") as File | null;
  const examId      = formData.get("exam_id") as string | null;
  const textContent = formData.get("text_content") as string | null;
  const replaceStr  = formData.get("replace_questions") as string | null;

  if (!examId)
    return NextResponse.json({ error: "exam_id is required" }, { status: 400 });
  if (!file && !textContent?.trim())
    return NextResponse.json({ error: "Either a file or text_content is required" }, { status: 400 });

  const supabase = createServerSupabaseClient();

  // Start with pasted text (if any)
  let combinedText = textContent?.trim() || "";

  if (file) {
    const bytes  = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to storage (non-fatal)
    await supabase.storage
      .from("exam-files")
      .upload(`uploads/${examId}/${Date.now()}_${file.name.replace(/\s+/g, "_")}`, buffer, {
        contentType: file.type,
      }).catch(() => null);

    // Extract text and merge
    const fileText = await extractTextFromBuffer(buffer, file.type, file.name).catch(() => "");
    combinedText = combinedText ? combinedText + "\n\n" + fileText : fileText;
  }

  // Clear existing questions if replace requested
  if (replaceStr === "true") {
    await supabase.from("questions").delete().eq("exam_id", examId);
  }

  // Get current question count for numbering
  const { count } = await supabase
    .from("questions").select("id", { count: "exact" }).eq("exam_id", examId);
  const startNumber = (count || 0) + 1;

  // Parse MCQ
  const questions = parseMCQFromText(combinedText, examId, startNumber);
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
      ? `✅ ${savedCount} questions extracted and saved`
      : `📄 File uploaded. No MCQ format detected. Use TXT format for auto-extraction.`,
  });
}
