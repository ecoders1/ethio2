// Server-only MCQ extraction
// Supports PDF, DOCX, XLSX, PPTX, TXT
export const dynamic = "force-dynamic";

export interface MCQQuestion {
  question_number: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation: string | null;
}

// ── Text Extraction ───────────────────────────────────────────

export async function extractTextFromBuffer(
  buffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<string> {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";

  // Plain text
  if (mimeType === "text/plain" || mimeType === "text/csv" || ext === "txt" || ext === "csv") {
    return buffer.toString("utf-8");
  }

  // PDF — try multiple methods
  if (mimeType === "application/pdf" || ext === "pdf") {
    return extractPDF(buffer);
  }

  // DOCX
  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    ext === "docx"
  ) {
    return extractDOCX(buffer);
  }

  // XLSX / XLS
  if (
    mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mimeType === "application/vnd.ms-excel" ||
    ext === "xlsx" || ext === "xls"
  ) {
    return extractXLSX(buffer);
  }

  // PPTX
  if (
    mimeType === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
    ext === "pptx"
  ) {
    return extractPPTX(buffer);
  }

  return "";
}

// ── PDF Extraction ────────────────────────────────────────────

async function extractPDF(buffer: Buffer): Promise<string> {
  // Method 1: pdf2json (works in Node.js/Vercel)
  try {
    const PDFParser = require("pdf2json"); // eslint-disable-line
    return await new Promise<string>((resolve) => {
      const parser = new PDFParser(null, true);
      parser.on("pdfParser_dataReady", (data: { Pages?: { Texts?: { R?: { T?: string }[] }[] }[] }) => {
        const texts: string[] = [];
        data.Pages?.forEach(page => {
          page.Texts?.forEach(textObj => {
            textObj.R?.forEach(r => {
              if (r.T) texts.push(decodeURIComponent(r.T));
            });
          });
          texts.push("\n");
        });
        resolve(texts.join(" ").replace(/ +/g, " ").trim());
      });
      parser.on("pdfParser_dataError", () => resolve(""));
      parser.parseBuffer(buffer);
    });
  } catch { /* try next */ }

  // Method 2: pdf-parse fallback
  try {
    const pdfParse = require("pdf-parse"); // eslint-disable-line
    const data = await pdfParse(buffer, {
      // Disable test files that cause issues
      max: 0,
    });
    return data.text || "";
  } catch { /* try next */ }

  // Method 3: Raw text extraction from PDF bytes (last resort)
  try {
    return extractPDFRawText(buffer);
  } catch { return ""; }
}

// Extract visible text from PDF bytes directly (no library needed)
function extractPDFRawText(buffer: Buffer): string {
  const content = buffer.toString("latin1");
  const texts: string[] = [];

  // Match text in BT...ET blocks
  const btRegex = /BT([\s\S]*?)ET/g;
  let match;
  while ((match = btRegex.exec(content)) !== null) {
    const block = match[1];
    // Extract strings from Tj, TJ, ' operators
    const strRegex = /\(((?:[^\\)]|\\[\\()nrtbf]|\\[0-7]{1,3})*?)\)\s*(?:Tj|'|")/g;
    let strMatch;
    while ((strMatch = strRegex.exec(block)) !== null) {
      const str = strMatch[1]
        .replace(/\\n/g, "\n").replace(/\\r/g, "\r").replace(/\\t/g, "\t")
        .replace(/\\\\/g, "\\").replace(/\\\(/g, "(").replace(/\\\)/g, ")")
        .replace(/\\([0-7]{1,3})/g, (_, o) => String.fromCharCode(parseInt(o, 8)));
      if (str.trim()) texts.push(str);
    }
    // TJ arrays
    const tjRegex = /\[((?:[^[\]]*|\[.*?\])*)\]\s*TJ/g;
    let tjMatch;
    while ((tjMatch = tjRegex.exec(block)) !== null) {
      const arr = tjMatch[1];
      const parts = arr.match(/\(([^)]*)\)/g) || [];
      const combined = parts.map(p => p.slice(1, -1)).join("");
      if (combined.trim()) texts.push(combined);
    }
    texts.push(" ");
  }

  return texts.join("").replace(/ +/g, " ").trim();
}

// ── DOCX Extraction ───────────────────────────────────────────

async function extractDOCX(buffer: Buffer): Promise<string> {
  try {
    const mammoth = require("mammoth"); // eslint-disable-line
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
  } catch { return ""; }
}

// ── XLSX Extraction ───────────────────────────────────────────

function extractXLSX(buffer: Buffer): string {
  try {
    const XLSX = require("xlsx"); // eslint-disable-line
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const lines: string[] = [];
    workbook.SheetNames.forEach((sheetName: string) => {
      const sheet = workbook.Sheets[sheetName];
      const rows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
      rows.forEach((row: string[]) => {
        const cells = row.map(c => String(c ?? "").trim()).filter(Boolean);
        if (cells.length >= 2) lines.push(cells.join("\t"));
      });
    });
    return lines.join("\n");
  } catch { return ""; }
}

// ── PPTX Extraction ───────────────────────────────────────────

async function extractPPTX(buffer: Buffer): Promise<string> {
  try {
    // PPTX is a ZIP file — extract text from slide XML
    const AdmZip = require("adm-zip"); // eslint-disable-line
    const zip = new AdmZip(buffer);
    const entries = zip.getEntries();
    const texts: string[] = [];

    entries.forEach((entry: { entryName: string; getData: () => Buffer }) => {
      if (entry.entryName.match(/ppt\/slides\/slide\d+\.xml/)) {
        const xml = entry.getData().toString("utf-8");
        const matches = xml.match(/<a:t>([^<]*)<\/a:t>/g) || [];
        matches.forEach(m => {
          const t = m.replace(/<\/?a:t>/g, "").trim();
          if (t) texts.push(t);
        });
        texts.push("\n");
      }
    });
    return texts.join(" ").replace(/ +/g, " ").trim();
  } catch {
    // Fallback to officeparser
    try {
      const officeparser = require("officeparser"); // eslint-disable-line
      return await new Promise<string>((resolve) => {
        officeparser.parseOfficeAsync(buffer, (data: string, err: Error) => {
          resolve(err ? "" : (data || ""));
        });
      });
    } catch { return ""; }
  }
}

// ── MCQ Parser ────────────────────────────────────────────────

export function parseMCQFromText(text: string, examId: string, startNumber = 1): (MCQQuestion & { exam_id: string })[] {
  const questions: (MCQQuestion & { exam_id: string })[] = [];
  if (!text.trim()) return questions;

  // Method 1: Excel/TSV table (Question \t A \t B \t C \t D \t Answer)
  if (text.includes("\t")) {
    const rows = text.split("\n").map(r => r.split("\t").map(c => c.trim()));
    for (const row of rows) {
      if (row.length < 5) continue;
      const [qText, optA, optB, optC, optD, ans, exp] = row;
      if (!qText || !optA || !optB || !optC || !optD) continue;
      // Skip header rows
      if (/^(question|q#|no\.?|#)/i.test(qText)) continue;
      const answer = (ans || "").toUpperCase().replace(/[^ABCD]/g, "").charAt(0);
      if (!["A","B","C","D"].includes(answer)) continue;
      questions.push({
        exam_id: examId,
        question_number: startNumber + questions.length,
        question_text: qText, option_a: optA, option_b: optB, option_c: optC, option_d: optD,
        correct_answer: answer, explanation: exp?.trim() || null,
      });
    }
    if (questions.length > 0) return questions;
  }

  // Normalize text
  const normalized = text
    .replace(/\r\n/g, "\n").replace(/\r/g, "\n")
    .replace(/[""]/g, '"').replace(/['']/g, "'")
    .replace(/\n{3,}/g, "\n\n");

  // Method 2: Block parser (blank lines separate questions)
  const blocks = normalized.split(/\n\s*\n/).filter(b => b.trim().length > 8);

  for (const block of blocks) {
    const lines = block.split("\n").map(l => l.trim()).filter(Boolean);
    let qText = "", optA = "", optB = "", optC = "", optD = "", answer = "", explanation = "";

    for (const line of lines) {
      if      (/^Q\d*\s*[:.)-]\s*/i.test(line))                    qText = line.replace(/^Q\d*\s*[:.)-]\s*/i, "").trim();
      else if (/^\d+\s*[:.)-]\s*/i.test(line) && !qText)           qText = line.replace(/^\d+\s*[:.)-]\s*/i, "").trim();
      else if (/^[(\[{]?[Aa][)\].}\s:-]/i.test(line))              optA  = line.replace(/^[(\[{]?[Aa][)\].}\s:-]+/i, "").trim();
      else if (/^[(\[{]?[Bb][)\].}\s:-]/i.test(line))              optB  = line.replace(/^[(\[{]?[Bb][)\].}\s:-]+/i, "").trim();
      else if (/^[(\[{]?[Cc][)\].}\s:-]/i.test(line))              optC  = line.replace(/^[(\[{]?[Cc][)\].}\s:-]+/i, "").trim();
      else if (/^[(\[{]?[Dd][)\].}\s:-]/i.test(line))              optD  = line.replace(/^[(\[{]?[Dd][)\].}\s:-]+/i, "").trim();
      else if (/^(Answer|Ans|Key|Correct\s*Answer)\s*[:.)-]/i.test(line)) {
        answer = line.replace(/^(Answer|Ans|Key|Correct\s*Answer)\s*[:.)-]/i,"").trim().toUpperCase().replace(/[^ABCD]/g,"").charAt(0);
      }
      else if (/^(Explanation|Exp|Note|Reason)\s*[:.)-]/i.test(line)) {
        explanation = line.replace(/^(Explanation|Exp|Note|Reason)\s*[:.)-]/i,"").trim();
      }
      else if (!qText && line.length > 10) qText = line;
    }

    if (qText && optA && optB && optC && optD && ["A","B","C","D"].includes(answer)) {
      questions.push({
        exam_id: examId,
        question_number: startNumber + questions.length,
        question_text: qText, option_a: optA, option_b: optB, option_c: optC, option_d: optD,
        correct_answer: answer, explanation: explanation || null,
      });
    }
  }

  // Method 3: Line-by-line parser (questions may not have blank lines between them)
  if (questions.length === 0) {
    const lines = normalized.split("\n").map(l => l.trim()).filter(Boolean);
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      const isQuestion = /^(Q\d*\s*[:.)-]|\d+\s*[:.)-])/i.test(line);
      if (!isQuestion) { i++; continue; }

      const qText = line.replace(/^(Q\d*\s*[:.)-]|\d+\s*[:.)-])/i, "").trim();
      let optA = "", optB = "", optC = "", optD = "", answer = "", explanation = "";
      i++;

      while (i < lines.length && !/^(Q\d*\s*[:.)-]|\d+\s*[:.)-])/i.test(lines[i])) {
        const l = lines[i].trim();
        if      (/^[(\[{]?[Aa][)\].}\s:-]/i.test(l))  optA = l.replace(/^[(\[{]?[Aa][)\].}\s:-]+/i,"").trim();
        else if (/^[(\[{]?[Bb][)\].}\s:-]/i.test(l))  optB = l.replace(/^[(\[{]?[Bb][)\].}\s:-]+/i,"").trim();
        else if (/^[(\[{]?[Cc][)\].}\s:-]/i.test(l))  optC = l.replace(/^[(\[{]?[Cc][)\].}\s:-]+/i,"").trim();
        else if (/^[(\[{]?[Dd][)\].}\s:-]/i.test(l))  optD = l.replace(/^[(\[{]?[Dd][)\].}\s:-]+/i,"").trim();
        else if (/^(Answer|Ans|Key)\s*[:.)-]/i.test(l)) {
          answer = l.replace(/^(Answer|Ans|Key)\s*[:.)-]/i,"").trim().toUpperCase().replace(/[^ABCD]/g,"").charAt(0);
        }
        else if (/^Exp/i.test(l)) explanation = l.replace(/^Exp[a-z]*\s*[:.)-]/i,"").trim();
        i++;
      }

      if (qText && optA && optB && optC && optD && ["A","B","C","D"].includes(answer)) {
        questions.push({
          exam_id: examId,
          question_number: startNumber + questions.length,
          question_text: qText, option_a: optA, option_b: optB, option_c: optC, option_d: optD,
          correct_answer: answer, explanation: explanation || null,
        });
      }
    }
  }

  return questions;
}
