import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth.server";
import { createServerSupabaseClient } from "@/lib/supabase";

// File upload + basic MCQ extraction
// Supports text-based content extraction; real PDF/DOCX needs server-side libs
export async function POST(req: NextRequest) {
  const payload = await getAuthUser();
  if (!payload?.isAdmin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const examId = formData.get("exam_id") as string | null;

  if (!file || !examId)
    return NextResponse.json(
      { error: "file and exam_id are required" },
      { status: 400 }
    );

  const allowedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "text/plain",
    "text/csv",
  ];

  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: "Unsupported file type. Use PDF, DOCX, PPTX, XLSX, or TXT." },
      { status: 400 }
    );
  }

  // For text/csv files, attempt MCQ extraction
  let extractedQuestions: object[] = [];
  if (file.type === "text/plain" || file.type === "text/csv") {
    const text = await file.text();
    extractedQuestions = parseMCQText(text, examId);
  }

  // Upload file to Supabase Storage
  const supabase = createServerSupabaseClient();
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const fileName = `uploads/${examId}/${Date.now()}_${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("exam-files")
    .upload(fileName, buffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    // Storage bucket may not exist yet — still return extracted questions
    console.warn("Storage upload warning:", uploadError.message);
  }

  // Save extracted questions to DB if any
  let savedCount = 0;
  if (extractedQuestions.length > 0) {
    const { error: qErr } = await supabase
      .from("questions")
      .insert(extractedQuestions);
    if (!qErr) savedCount = extractedQuestions.length;
  }

  return NextResponse.json({
    success: true,
    fileName,
    extracted: extractedQuestions.length,
    saved: savedCount,
    message:
      extractedQuestions.length > 0
        ? `Extracted and saved ${savedCount} questions.`
        : "File uploaded. For PDF/DOCX, manually add questions or use the bulk import format.",
  });
}

/**
 * Parse plain-text MCQ format:
 *
 * Q: What is 2+2?
 * A) 3
 * B) 4
 * C) 5
 * D) 6
 * Answer: B
 * Explanation: Basic arithmetic
 */
function parseMCQText(
  text: string,
  examId: string
): {
  id: string;
  exam_id: string;
  question_number: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation: string | null;
}[] {
  const questions = [];
  // Split on blank lines or "Q:" markers
  const blocks = text.split(/\n\s*\n/).filter((b) => b.trim());
  let qNum = 1;

  for (const block of blocks) {
    const lines = block
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    let qText = "";
    let optA = "",
      optB = "",
      optC = "",
      optD = "";
    let answer = "";
    let explanation = "";

    for (const line of lines) {
      if (/^Q[:.]?\s+/i.test(line)) {
        qText = line.replace(/^Q[:.]?\s+/i, "").trim();
      } else if (/^A[).]\s+/i.test(line)) {
        optA = line.replace(/^A[).]\s+/i, "").trim();
      } else if (/^B[).]\s+/i.test(line)) {
        optB = line.replace(/^B[).]\s+/i, "").trim();
      } else if (/^C[).]\s+/i.test(line)) {
        optC = line.replace(/^C[).]\s+/i, "").trim();
      } else if (/^D[).]\s+/i.test(line)) {
        optD = line.replace(/^D[).]\s+/i, "").trim();
      } else if (/^Answer[:.]?\s+/i.test(line)) {
        answer = line
          .replace(/^Answer[:.]?\s+/i, "")
          .trim()
          .toUpperCase()
          .charAt(0);
      } else if (/^Explanation[:.]?\s+/i.test(line)) {
        explanation = line.replace(/^Explanation[:.]?\s+/i, "").trim();
      }
    }

    if (
      qText &&
      optA &&
      optB &&
      optC &&
      optD &&
      ["A", "B", "C", "D"].includes(answer)
    ) {
      questions.push({
        id: crypto.randomUUID(),
        exam_id: examId,
        question_number: qNum++,
        question_text: qText,
        option_a: optA,
        option_b: optB,
        option_c: optC,
        option_d: optD,
        correct_answer: answer,
        explanation: explanation || null,
      });
    }
  }

  return questions;
}
