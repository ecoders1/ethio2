// Server-only MCQ extraction from PDF, DOCX, XLSX, PPTX, TXT
// Each extractor returns raw text, then parseMCQ converts to questions

export interface MCQQuestion {
  question_number: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string; // A B C D
  explanation: string | null;
}

// ── Text extraction ───────────────────────────────────────────

export async function extractTextFromBuffer(
  buffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<string> {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";

  // Plain text / CSV
  if (mimeType === "text/plain" || mimeType === "text/csv" || ext === "txt" || ext === "csv") {
    return buffer.toString("utf-8");
  }

  // PDF
  if (mimeType === "application/pdf" || ext === "pdf") {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse");
      const data = await pdfParse(buffer);
      return data.text || "";
    } catch (e) {
      console.error("PDF parse error:", e);
      return "";
    }
  }

  // DOCX
  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    ext === "docx"
  ) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mammoth = require("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      return result.value || "";
    } catch (e) {
      console.error("DOCX parse error:", e);
      return "";
    }
  }

  // XLSX / XLS
  if (
    mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mimeType === "application/vnd.ms-excel" ||
    ext === "xlsx" || ext === "xls"
  ) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const XLSX = require("xlsx");
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const lines: string[] = [];
      workbook.SheetNames.forEach((sheetName: string) => {
        const sheet = workbook.Sheets[sheetName];
        const rows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
        rows.forEach((row: string[]) => {
          const line = row.map((c) => String(c).trim()).filter(Boolean).join("\t");
          if (line) lines.push(line);
        });
      });
      return lines.join("\n");
    } catch (e) {
      console.error("XLSX parse error:", e);
      return "";
    }
  }

  // PPTX — extract text from slides
  if (
    mimeType === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
    ext === "pptx"
  ) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const officeparser = require("officeparser");
      return await new Promise<string>((resolve) => {
        officeparser.parseOfficeAsync(buffer, (data: string, err: Error) => {
          if (err) { console.error("PPTX error:", err); resolve(""); }
          else resolve(data || "");
        });
      });
    } catch (e) {
      console.error("PPTX parse error:", e);
      return "";
    }
  }

  return "";
}

// ── MCQ Parser ────────────────────────────────────────────────
// Supports multiple formats:
//
// Format 1 (standard):
//   Q: Question?
//   A) Option A
//   B) Option B
//   C) Option C
//   D) Option D
//   Answer: B
//   Explanation: Optional
//
// Format 2 (numbered):
//   1. Question?
//   a) Option A   b) Option B   c) Option C   d) Option D
//   Answer: C
//
// Format 3 (table row from Excel):
//   Question\tA\tB\tC\tD\tB\tExplanation

export function parseMCQFromText(text: string, examId: string, startNumber = 1): MCQQuestion[] {
  const questions: MCQQuestion[] = [];

  // Try table/spreadsheet format first (tab-separated rows)
  if (text.includes("\t")) {
    const rows = text.split("\n").map(r => r.split("\t").map(c => c.trim()));
    for (const row of rows) {
      if (row.length < 5) continue;
      const [qText, optA, optB, optC, optD, ans, exp] = row;
      if (!qText || !optA || !optB || !optC || !optD) continue;
      const answer = (ans || "").toUpperCase().trim().charAt(0);
      if (!["A", "B", "C", "D"].includes(answer)) continue;
      questions.push({
        question_number: startNumber + questions.length,
        question_text: qText,
        option_a: optA, option_b: optB, option_c: optC, option_d: optD,
        correct_answer: answer,
        explanation: exp?.trim() || null,
      });
    }
    if (questions.length > 0) return questions;
  }

  // Block-based parser (blank-line separated)
  const blocks = text.split(/\n\s*\n/).filter(b => b.trim().length > 10);

  for (const block of blocks) {
    const lines = block.split("\n").map(l => l.trim()).filter(Boolean);
    let qText = "", optA = "", optB = "", optC = "", optD = "", answer = "", explanation = "";

    for (const line of lines) {
      // Question line patterns
      if (/^(Q\d*[\s:.)-]|^\d+[\s:.)-])/i.test(line)) {
        qText = line.replace(/^(Q\d*[\s:.)-]|\d+[\s:.)-])/i, "").trim();
      }
      // Option patterns: A) / A. / A: / (A) / a) etc.
      else if (/^[Aa][\s).:-]\s*/i.test(line)) optA = line.replace(/^[Aa][\s).:-]\s*/i, "").trim();
      else if (/^[Bb][\s).:-]\s*/i.test(line)) optB = line.replace(/^[Bb][\s).:-]\s*/i, "").trim();
      else if (/^[Cc][\s).:-]\s*/i.test(line)) optC = line.replace(/^[Cc][\s).:-]\s*/i, "").trim();
      else if (/^[Dd][\s).:-]\s*/i.test(line)) optD = line.replace(/^[Dd][\s).:-]\s*/i, "").trim();
      // Answer line
      else if (/^(Answer|Ans|Key|Correct)[\s:.)-]/i.test(line)) {
        answer = line.replace(/^(Answer|Ans|Key|Correct)[\s:.)-]/i, "").trim().toUpperCase().charAt(0);
      }
      // Explanation line
      else if (/^(Explanation|Exp|Note|Reason)[\s:.)-]/i.test(line)) {
        explanation = line.replace(/^(Explanation|Exp|Note|Reason)[\s:.)-]/i, "").trim();
      }
      // If no question yet, first long line is probably the question
      else if (!qText && line.length > 15 && !/^[\d]/.test(line)) {
        qText = line;
      }
    }

    if (qText && optA && optB && optC && optD && ["A","B","C","D"].includes(answer)) {
      questions.push({
        question_number: startNumber + questions.length,
        question_text: qText,
        option_a: optA, option_b: optB, option_c: optC, option_d: optD,
        correct_answer: answer,
        explanation: explanation || null,
      });
    }
  }

  // Also try inline format: single line with all options
  if (questions.length === 0) {
    const lines = text.split("\n").filter(l => l.trim().length > 5);
    let i = 0;
    while (i < lines.length) {
      const line = lines[i].trim();
      if (/^[\d]+[.)]\s+\S/.test(line) || /^Q\d*[.:]\s+\S/i.test(line)) {
        const qText = line.replace(/^[\d]+[.)]\s+|^Q\d*[.:]\s+/i, "");
        let optA = "", optB = "", optC = "", optD = "", answer = "", explanation = "";
        i++;
        while (i < lines.length && !/^[\d]+[.)]\s+|^Q\d*[.:]\s+/i.test(lines[i])) {
          const l = lines[i].trim();
          if (/^[Aa][\s).:-]/i.test(l)) optA = l.replace(/^[Aa][\s).:-]/i, "").trim();
          else if (/^[Bb][\s).:-]/i.test(l)) optB = l.replace(/^[Bb][\s).:-]/i, "").trim();
          else if (/^[Cc][\s).:-]/i.test(l)) optC = l.replace(/^[Cc][\s).:-]/i, "").trim();
          else if (/^[Dd][\s).:-]/i.test(l)) optD = l.replace(/^[Dd][\s).:-]/i, "").trim();
          else if (/^(Answer|Ans)[\s:.)-]/i.test(l)) answer = l.replace(/^(Answer|Ans)[\s:.)-]/i, "").trim().toUpperCase().charAt(0);
          else if (/^Exp/i.test(l)) explanation = l.replace(/^Exp[a-z]*[\s:.)-]/i, "").trim();
          i++;
        }
        if (qText && optA && optB && optC && optD && ["A","B","C","D"].includes(answer)) {
          questions.push({
            question_number: startNumber + questions.length,
            question_text: qText,
            option_a: optA, option_b: optB, option_c: optC, option_d: optD,
            correct_answer: answer,
            explanation: explanation || null,
          });
        }
      } else { i++; }
    }
  }

  return questions.map(q => ({ ...q, exam_id: examId } as MCQQuestion & { exam_id: string }));
}
