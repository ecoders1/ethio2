import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth.server";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const payload = await getAuthUser();
  if (!payload?.isAdmin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const departmentId = formData.get("department_id") as string | null;
  const yearStr = formData.get("year") as string | null;

  if (!file || !departmentId || !yearStr)
    return NextResponse.json({ error: "file, department_id, and year are required" }, { status: 400 });

  const year = parseInt(yearStr);

  const allowedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "text/plain",
    "text/csv",
  ];
  if (!allowedTypes.includes(file.type))
    return NextResponse.json({ error: "Unsupported file type. Use PDF, DOCX, PPTX, XLSX, TXT, or CSV." }, { status: 400 });

  const supabase = createServerSupabaseClient();

  // Get department name for title
  const { data: dept } = await supabase
    .from("departments")
    .select("name")
    .eq("id", departmentId)
    .single();

  const examTitle = `${dept?.name || "Department"} ${year} Exit Exam`;

  // Check if exam already exists for this dept+year
  const { data: existing } = await supabase
    .from("exams")
    .select("id")
    .eq("department_id", departmentId)
    .eq("year", year)
    .single();

  let examId: string;

  if (existing) {
    examId = existing.id;
  } else {
    // Create a new exam (NOT free — requires payment except first 20 questions)
    const newExamId = crypto.randomUUID();
    const { error: examErr } = await supabase.from("exams").insert({
      id: newExamId,
      department_id: departmentId,
      year,
      title: examTitle,
      is_free: false,
      is_active: true,
    });
    if (examErr)
      return NextResponse.json({ error: "Failed to create exam: " + examErr.message }, { status: 500 });
    examId = newExamId;
  }

  // Upload file to Supabase Storage
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const fileName = `uploads/${departmentId}/${year}_${Date.now()}_${file.name.replace(/\s+/g, "_")}`;

  await supabase.storage
    .from("exam-files")
    .upload(fileName, buffer, { contentType: file.type, upsert: false });
  // Storage errors are non-fatal — questions still extracted below

  // Extract questions from TXT/CSV
  let extractedQuestions: ReturnType<typeof parseMCQText> = [];
  if (file.type === "text/plain" || file.type === "text/csv") {
    const text = await file.text();
    extractedQuestions = parseMCQText(text, examId);
  }

  let savedCount = 0;
  if (extractedQuestions.length > 0) {
    // Get current max question_number for this exam
    const { data: existing_q } = await supabase
      .from("questions")
      .select("question_number")
      .eq("exam_id", examId)
      .order("question_number", { ascending: false })
      .limit(1);

    const offset = existing_q?.[0]?.question_number ?? 0;
    const numbered = extractedQuestions.map((q, i) => ({
      ...q,
      question_number: offset + i + 1,
    }));

    const { error: qErr } = await supabase.from("questions").insert(numbered);
    if (!qErr) savedCount = numbered.length;
  }

  return NextResponse.json({
    success: true,
    examId,
    fileName,
    extracted: extractedQuestions.length,
    saved: savedCount,
    message:
      extractedQuestions.length > 0
        ? `Exam created. ${savedCount} questions extracted and saved. Visible to users after payment unlock.`
        : `Exam created and file uploaded. For PDF/DOCX, use Admin → Questions to add questions manually.`,
  });
}

function parseMCQText(text: string, examId: string) {
  const questions: {
    id: string; exam_id: string; question_number: number;
    question_text: string; option_a: string; option_b: string;
    option_c: string; option_d: string; correct_answer: string;
    explanation: string | null;
  }[] = [];

  const blocks = text.split(/\n\s*\n/).filter(b => b.trim());

  for (const block of blocks) {
    const lines = block.split("\n").map(l => l.trim()).filter(Boolean);
    let qText = "", optA = "", optB = "", optC = "", optD = "", answer = "", explanation = "";

    for (const line of lines) {
      if (/^Q\d*[:.)]\s*/i.test(line))       qText = line.replace(/^Q\d*[:.)]\s*/i, "").trim();
      else if (/^A[).]\s*/i.test(line))      optA = line.replace(/^A[).]\s*/i, "").trim();
      else if (/^B[).]\s*/i.test(line))      optB = line.replace(/^B[).]\s*/i, "").trim();
      else if (/^C[).]\s*/i.test(line))      optC = line.replace(/^C[).]\s*/i, "").trim();
      else if (/^D[).]\s*/i.test(line))      optD = line.replace(/^D[).]\s*/i, "").trim();
      else if (/^Ans(?:wer)?[:.)]\s*/i.test(line)) answer = line.replace(/^Ans(?:wer)?[:.)]\s*/i, "").trim().toUpperCase().charAt(0);
      else if (/^Exp(?:lanation)?[:.)]\s*/i.test(line)) explanation = line.replace(/^Exp(?:lanation)?[:.)]\s*/i, "").trim();
    }

    if (qText && optA && optB && optC && optD && ["A","B","C","D"].includes(answer)) {
      questions.push({
        id: crypto.randomUUID(), exam_id: examId,
        question_number: questions.length + 1,
        question_text: qText, option_a: optA, option_b: optB,
        option_c: optC, option_d: optD, correct_answer: answer,
        explanation: explanation || null,
      });
    }
  }
  return questions;
}
