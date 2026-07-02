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
  const textContent = formData.get("text_content") as string | null;
  const isFreeStr   = formData.get("is_free") as string | null;
  const replaceStr  = formData.get("replace_questions") as string | null;

  if (!departmentId || !yearStr)
    return NextResponse.json({ error: "department_id and year are required" }, { status: 400 });
  if (!file && !textContent?.trim())
    return NextResponse.json({ error: "Either a file or text_content is required" }, { status: 400 });

  const year = parseInt(yearStr);
  if (isNaN(year))
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });

  const isFree = isFreeStr === "true";
  const replaceQuestions = replaceStr === "true";

  const supabase = createServerSupabaseClient();

  // Get department name
  const { data: dept } = await supabase
    .from("departments").select("name").eq("id", departmentId).single();

  const examTitle = `${dept?.name || "Department"} ${year} Exit Exam`;

  // Create or reuse exam — use maybeSingle to safely handle missing or multiple rows
  let examId: string;
  const { data: existingRows } = await supabase
    .from("exams")
    .select("id")
    .eq("department_id", departmentId)
    .eq("year", year)
    .order("created_at", { ascending: true }); // oldest first

  const existing = existingRows && existingRows.length > 0 ? existingRows[0] : null;

  // If duplicates exist, delete the extras (keep oldest)
  if (existingRows && existingRows.length > 1) {
    const extraIds = existingRows.slice(1).map(r => r.id);
    await supabase.from("exams").delete().in("id", extraIds);
  }

  if (existing) {
    examId = existing.id;
    // Update is_free if provided
    if (isFreeStr !== null) {
      await supabase.from("exams").update({ is_free: isFree }).eq("id", examId);
    }
  } else {
    const { data: newExam, error: examErr } = await supabase
      .from("exams")
      .insert({
        id: crypto.randomUUID(),
        department_id: departmentId,
        year, title: examTitle,
        is_free: isFree, is_active: true,
      })
      .select("id").single();

    if (examErr || !newExam)
      return NextResponse.json({ error: "Failed to create exam: " + examErr?.message }, { status: 500 });
    examId = newExam.id;
  }

  // Clear existing questions if replace is requested
  if (replaceQuestions) {
    await supabase.from("questions").delete().eq("exam_id", examId);
  }

  // Read file buffer
  let extractedText = textContent?.trim() || "";
  let parseError = "";

  if (file) {
    try {
      const bytes  = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Upload to storage (non-fatal if fails)
      const safeFileName = file.name.replace(/\s+/g, "_");
      supabase.storage                                   // fire-and-forget
        .from("exam-files")
        .upload(`uploads/${departmentId}/${year}_${Date.now()}_${safeFileName}`, buffer, {
          contentType: file.type, upsert: false,
        }).catch(() => null);

      // Extract text with a 25-second timeout
      const extractWithTimeout = Promise.race([
        extractTextFromBuffer(buffer, file.type, file.name),
        new Promise<string>((_, reject) =>
          setTimeout(() => reject(new Error("Extraction timed out")), 25000)
        ),
      ]);

      const fileText = await extractWithTimeout.catch((e) => {
        parseError = String(e);
        return "";
      });

      extractedText = extractedText
        ? extractedText + "\n\n" + fileText
        : fileText;
    } catch (e) {
      parseError = String(e);
    }
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
      message = `✅ Extracted and saved ${savedCount} questions. Exam is now live.`;
    } else if (extractedCount === 0) {
      message = `📄 ${file ? `File uploaded (${file.name}).` : "Text received."} No MCQ format detected. Use the TXT format shown on the right.`;
    } else {
      message = `⚠️ Found ${extractedCount} questions but failed to save. Check the format.`;
    }
  } else {
    message = `📄 ${file ? `File uploaded (${file.name}).` : "No content received."} ` +
      (parseError ? `Parse note: ${parseError}. ` : "") +
      `No text extracted. For best results use TXT format or paste MCQ text directly.`;
  }

  return NextResponse.json({
    success: true,
    examId,
    extracted: extractedCount,
    saved: savedCount,
    message,
    fileType: file?.type ?? "text",
    textLength: extractedText.length,
  });
}
