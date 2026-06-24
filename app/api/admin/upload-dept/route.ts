import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth.server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { extractTextFromBuffer, parseMCQFromText } from "@/lib/extractMCQ";

export const runtime = "nodejs"; // needs fs-based libraries

export async function POST(req: NextRequest) {
  const payload = await getAuthUser();
  if (!payload?.isAdmin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file        = formData.get("file") as File | null;
  const departmentId = formData.get("department_id") as string | null;
  const yearStr     = formData.get("year") as string | null;

  if (!file || !departmentId || !yearStr)
    return NextResponse.json({ error: "file, department_id, and year are required" }, { status: 400 });

  const year = parseInt(yearStr);
  if (isNaN(year))
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });

  const supabase = createServerSupabaseClient();

  // Get department name
  const { data: dept } = await supabase
    .from("departments").select("name").eq("id", departmentId).single();

  const examTitle = `${dept?.name || "Department"} ${year} Exit Exam`;

  // Create or reuse exam
  let examId: string;
  const { data: existing } = await supabase
    .from("exams").select("id")
    .eq("department_id", departmentId).eq("year", year).single();

  if (existing) {
    examId = existing.id;
  } else {
    const { data: newExam, error: examErr } = await supabase
      .from("exams")
      .insert({
        id: crypto.randomUUID(),
        department_id: departmentId,
        year, title: examTitle,
        is_free: false, is_active: true,
      })
      .select("id").single();

    if (examErr || !newExam)
      return NextResponse.json({ error: "Failed to create exam: " + examErr?.message }, { status: 500 });
    examId = newExam.id;
  }

  // Read file buffer
  const bytes  = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Upload to storage (non-fatal if fails)
  const safeFileName = file.name.replace(/\s+/g, "_");
  await supabase.storage
    .from("exam-files")
    .upload(`uploads/${departmentId}/${year}_${Date.now()}_${safeFileName}`, buffer, {
      contentType: file.type, upsert: false,
    }).catch(() => null);

  // Extract text from file
  let extractedText = "";
  let parseError = "";
  try {
    extractedText = await extractTextFromBuffer(buffer, file.type, file.name);
  } catch (e) {
    parseError = String(e);
  }

  // Get existing question count for numbering
  const { count: existingCount } = await supabase
    .from("questions").select("id", { count: "exact" })
    .eq("exam_id", examId);
  const startNumber = (existingCount || 0) + 1;

  // Parse MCQ questions from extracted text
  let savedCount = 0;
  let extractedCount = 0;
  let message = "";

  if (extractedText.trim().length > 0) {
    const questions = parseMCQFromText(extractedText, examId, startNumber);
    extractedCount = questions.length;

    if (questions.length > 0) {
      const { error: insertErr } = await supabase.from("questions").insert(
        questions.map(q => ({
          id: crypto.randomUUID(),
          exam_id: examId,
          question_number: q.question_number,
          question_text: q.question_text,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d,
          correct_answer: q.correct_answer,
          explanation: q.explanation,
        }))
      );
      if (!insertErr) savedCount = questions.length;
    }

    if (savedCount > 0) {
      message = `✅ Extracted and saved ${savedCount} questions from ${file.name}. Exam is now live.`;
    } else if (extractedCount === 0) {
      message = `📄 File uploaded (${file.name}). No MCQ format detected. ` +
        `Use Admin → Questions to add questions manually, or use the TXT format below.`;
    } else {
      message = `⚠️ Found ${extractedCount} questions but failed to save. Check file format.`;
    }
  } else {
    message = `📄 File uploaded (${file.name}). ` +
      (parseError ? `Parse note: ${parseError}. ` : "") +
      `No text extracted. For best results use TXT format or copy-paste content.`;
  }

  return NextResponse.json({
    success: true,
    examId,
    extracted: extractedCount,
    saved: savedCount,
    message,
    fileType: file.type,
    textLength: extractedText.length,
  });
}
