"use client";
import { useEffect, useState } from "react";

interface Exam {
  id: string;
  title: string;
  year: number;
  departments?: { name: string };
}

export default function UploadExamFilePage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [examId, setExamId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<{
    success?: boolean;
    message?: string;
    extracted?: number;
    error?: string;
  } | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch("/api/exams")
      .then((r) => r.json())
      .then((d) => setExams(d.exams || []));
  }, []);

  const handleUpload = async () => {
    if (!file || !examId) return;
    setUploading(true);
    setResult(null);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("exam_id", examId);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const data = await res.json();
    setResult(data);
    setUploading(false);
  };

  return (
    <div className="max-w-xl space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Upload Exam File</h1>
        <p className="text-gray-500 text-sm mt-1">
          Upload PDF, DOCX, PPTX, XLSX or plain TXT. TXT/CSV files with the
          standard MCQ format will be auto-converted to questions.
        </p>
      </div>

      {/* Format guide */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-800">
        <p className="font-bold mb-2">📋 Plain-text MCQ format (auto-extract):</p>
        <pre className="text-xs bg-white rounded-xl p-3 overflow-x-auto border border-blue-100">
          {`Q: What is the capital of Ethiopia?
A) Nairobi
B) Addis Ababa
C) Cairo
D) Lagos
Answer: B
Explanation: Addis Ababa is the capital city.`}
        </pre>
        <p className="mt-2 text-xs">
          Separate each question with a blank line. For PDF/DOCX, upload the
          file and manually enter questions after.
        </p>
      </div>

      {/* Select exam */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Assign to Exam
        </label>
        <select
          className="input-field"
          value={examId}
          onChange={(e) => setExamId(e.target.value)}
        >
          <option value="">Select exam…</option>
          {exams.map((e) => (
            <option key={e.id} value={e.id}>
              {e.departments?.name} – {e.title} ({e.year})
            </option>
          ))}
        </select>
      </div>

      {/* File picker */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Select File
        </label>
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-8 cursor-pointer hover:border-green-400 transition-colors">
          {file ? (
            <div className="text-center">
              <div className="text-3xl mb-1">📄</div>
              <div className="font-medium text-gray-800 text-sm">{file.name}</div>
              <div className="text-xs text-gray-400 mt-1">
                {(file.size / 1024).toFixed(1)} KB
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400">
              <div className="text-4xl mb-2">📂</div>
              <div className="text-sm">Click to browse</div>
              <div className="text-xs mt-1">PDF, DOCX, PPTX, XLSX, TXT</div>
            </div>
          )}
          <input
            type="file"
            className="hidden"
            accept=".pdf,.docx,.pptx,.xlsx,.xls,.txt,.csv"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </label>
      </div>

      {/* Upload button */}
      <button
        onClick={handleUpload}
        disabled={!file || !examId || uploading}
        className="btn-primary w-full py-3.5 text-base"
      >
        {uploading ? "⏳ Uploading & Extracting…" : "🚀 Upload & Convert to MCQ"}
      </button>

      {/* Result */}
      {result && (
        <div
          className={`rounded-2xl p-4 text-sm font-medium ${
            result.success
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {result.success ? "✅ " : "❌ "}
          {result.message || result.error}
          {result.extracted !== undefined && result.extracted > 0 && (
            <span className="block mt-1 text-xs">
              {result.extracted} questions extracted and saved to the exam.
            </span>
          )}
        </div>
      )}
    </div>
  );
}
