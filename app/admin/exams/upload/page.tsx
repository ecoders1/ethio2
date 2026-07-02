"use client";
import { useEffect, useState } from "react";

interface Department { id: string; name: string; }
interface Exam {
  id: string; title: string; year: number;
  is_active: boolean; is_free: boolean;
  department_id: string;
}

const EXAM_YEARS = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024];

export default function UploadExamPage() {
  const [depts, setDepts]       = useState<Department[]>([]);
  const [exams, setExams]       = useState<Exam[]>([]);
  const [qCounts, setQCounts]   = useState<Record<string, number>>({});

  // Step tracking
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);

  // Upload form
  const [file, setFile]         = useState<File | null>(null);
  const [text, setText]         = useState("");
  const [isFree, setIsFree]     = useState(false);
  const [replaceQ, setReplaceQ] = useState(true);

  // Status
  const [uploading, setUploading] = useState(false);
  const [result, setResult]       = useState<{ success: boolean; message: string; saved?: number } | null>(null);
  const [toast, setToast]         = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3500); };

  const fetchData = async () => {
    const [dData, eData] = await Promise.all([
      fetch("/api/departments").then(r => r.json()),
      fetch("/api/exams").then(r => r.json()),
    ]);
    setDepts(dData.departments || []);
    const examList: Exam[] = eData.exams || [];
    setExams(examList);

    // Fetch question counts
    const counts: Record<string, number> = {};
    await Promise.all(
      examList.map(async (e) => {
        const r = await fetch(`/api/questions?exam_id=${e.id}`).then(r => r.json());
        counts[e.id] = r.count ?? r.questions?.length ?? 0;
      })
    );
    setQCounts(counts);
  };

  useEffect(() => { fetchData(); }, []);

  // When dept selected, reset year/exam selection
  const handleSelectDept = (dept: Department) => {
    setSelectedDept(dept);
    setSelectedYear(null);
    setSelectedExam(null);
    setResult(null);
    setFile(null);
    setText("");
  };

  // When year button clicked
  const handleSelectYear = (year: number) => {
    const existing = exams.find(e => e.department_id === selectedDept?.id && e.year === year);
    setSelectedYear(year);
    setSelectedExam(existing || null);
    setResult(null);
    setFile(null);
    setText("");
    setIsFree(existing?.is_free || false);
    setReplaceQ(true);
  };

  const handleUpload = async () => {
    if (!selectedDept || !selectedYear) return;
    if (!file && !text.trim()) return;

    setUploading(true);
    setResult(null);

    const fd = new FormData();
    fd.append("department_id", selectedDept.id);
    fd.append("year", String(selectedYear));
    fd.append("is_free", String(isFree));
    fd.append("replace_questions", String(replaceQ));
    if (file) fd.append("file", file);
    if (text.trim()) fd.append("text_content", text.trim());

    try {
      // 55-second client timeout (Vercel function limit is 60s)
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 55000);

      const res = await fetch("/api/admin/upload-dept", {
        method: "POST",
        body: fd,
        signal: controller.signal,
      });
      clearTimeout(timer);

      const data = await res.json();
      setResult({ success: res.ok, message: data.message || data.error, saved: data.saved });
      if (res.ok) {
        showToast(`✅ ${data.saved || 0} questions saved for ${selectedDept.name} ${selectedYear}`);
        await fetchData();
      }
    } catch (err) {
      const isTimeout = err instanceof Error && err.name === "AbortError";
      setResult({
        success: false,
        message: isTimeout
          ? "⏱️ Upload timed out. Try pasting the MCQ text directly instead of uploading a file."
          : `❌ Network error: ${err}`,
      });
    }

    setUploading(false);
  };

  const handleToggleActive = async (exam: Exam) => {
    await fetch(`/api/exams/${exam.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !exam.is_active }),
    });
    showToast(`✅ Exam ${exam.is_active ? "deactivated" : "activated"}`);
    fetchData();
  };

  const handleToggleFree = async (exam: Exam) => {
    await fetch(`/api/exams/${exam.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_free: !exam.is_free }),
    });
    showToast(`✅ Exam marked as ${exam.is_free ? "paid" : "free"}`);
    fetchData();
  };

  const handleDeleteExam = async (exam: Exam) => {
    if (!confirm(`Delete "${exam.title}" and all its questions?`)) return;
    await fetch(`/api/exams/${exam.id}`, { method: "DELETE" });
    showToast("🗑️ Exam deleted");
    setSelectedYear(null);
    setSelectedExam(null);
    fetchData();
  };

  const deptExams = exams.filter(e => e.department_id === selectedDept?.id);

  const getYearExam = (year: number) =>
    exams.find(e => e.department_id === selectedDept?.id && e.year === year);

  const isReady = !!selectedDept && !!selectedYear && (!!file || !!text.trim());

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-xl text-sm font-medium animate-fade-in">
          {toast}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-gray-800">Upload Exam</h1>
        <p className="text-gray-500 text-sm mt-1">
          Select a department, choose an exam year, then upload or paste questions.
        </p>
      </div>

      {/* ── Step 1: Select Department ── */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
          Step 1 — Select Department
        </p>
        <div className="flex flex-wrap gap-2">
          {depts.map(d => {
            const dExamCount = exams.filter(e => e.department_id === d.id).length;
            const hasRealQ   = exams
              .filter(e => e.department_id === d.id)
              .some(e => (qCounts[e.id] ?? 0) > 0);
            const isSelected = selectedDept?.id === d.id;
            return (
              <button key={d.id} onClick={() => handleSelectDept(d)}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border-2 flex items-center gap-2 ${
                  isSelected
                    ? "bg-green-600 text-white border-green-600"
                    : "bg-white text-gray-700 border-gray-200 hover:border-green-400 hover:bg-green-50"
                }`}>
                <span>{d.name}</span>
                {hasRealQ && <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${isSelected ? "bg-white/20 text-white" : "bg-green-100 text-green-700"}`}>✓</span>}
                {!hasRealQ && dExamCount > 0 && <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${isSelected ? "bg-white/20 text-white" : "bg-red-100 text-red-500"}`}>!</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Step 2: Select Exam Year ── */}
      {selectedDept && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
            Step 2 — Choose Exam Year for <span className="text-green-700">{selectedDept.name}</span>
          </p>
          <p className="text-xs text-gray-400 mb-4">
            🟢 = has questions &nbsp;|&nbsp; 🔴 = no questions &nbsp;|&nbsp; ⬜ = exam not created yet
          </p>
          <div className="flex flex-wrap gap-3">
            {EXAM_YEARS.map(year => {
              const exam    = getYearExam(year);
              const qCount  = exam ? (qCounts[exam.id] ?? 0) : 0;
              const hasQ    = qCount > 0;
              const exists  = !!exam;
              const isSelected = selectedYear === year;

              return (
                <button key={year} onClick={() => handleSelectYear(year)}
                  className={`relative w-20 h-20 rounded-2xl flex flex-col items-center justify-center font-black text-lg transition-all border-2 ${
                    isSelected
                      ? "bg-green-600 text-white border-green-600 scale-105 shadow-lg"
                      : exists && hasQ
                        ? "bg-green-50 text-green-700 border-green-300 hover:border-green-500"
                        : exists
                          ? "bg-red-50 text-red-500 border-red-200 hover:border-red-400"
                          : "bg-gray-50 text-gray-400 border-gray-200 hover:border-gray-400 hover:bg-gray-100"
                  }`}>
                  <span>{year}</span>
                  <span className="text-xs font-normal mt-0.5">
                    {exists && hasQ ? `${qCount}q` : exists ? "empty" : "new"}
                  </span>
                  {!exam?.is_active && exists && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-400 rounded-full text-white text-xs flex items-center justify-center">⏸</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Step 3: Upload Questions ── */}
      {selectedDept && selectedYear && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Left: Upload form */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
                Step 3 — Add Questions to{" "}
                <span className="text-green-700">{selectedDept.name} {selectedYear}</span>
              </p>

              {/* File upload */}
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-5 cursor-pointer hover:border-green-400 transition-colors mb-3">
                {file ? (
                  <div className="text-center">
                    <div className="text-2xl mb-1">📄</div>
                    <div className="font-medium text-gray-800 text-sm">{file.name}</div>
                    <div className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</div>
                    <button type="button" onClick={ev => { ev.preventDefault(); setFile(null); }}
                      className="mt-1 text-xs text-red-500 hover:underline">Remove</button>
                  </div>
                ) : (
                  <div className="text-center text-gray-400">
                    <div className="text-3xl mb-1">📂</div>
                    <div className="text-sm font-medium">Upload file</div>
                    <div className="text-xs mt-0.5">PDF, DOCX, XLSX, TXT</div>
                  </div>
                )}
                <input type="file" className="hidden"
                  accept=".pdf,.docx,.pptx,.xlsx,.xls,.txt,.csv"
                  onChange={e => setFile(e.target.files?.[0] || null)} />
              </label>

              {/* Paste text */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Paste MCQ Text</p>
                  <button type="button"
                    onClick={() => setText(`Q: What is the primary function of an operating system?\nA) Store files permanently\nB) Manage hardware and software resources\nC) Browse the internet\nD) Run antivirus software\nAnswer: B\nExplanation: An OS manages CPU, memory, and I/O devices.\n\nQ: Which data structure follows LIFO?\nA) Queue\nB) Array\nC) Stack\nD) Linked List\nAnswer: C\nExplanation: Stack = Last In First Out.\n\nQ: Next question here...`)}
                    className="text-xs text-blue-600 hover:underline font-medium">
                    Load example
                  </button>
                </div>

                {/* Format guide */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
                  <p className="font-bold mb-1.5">📋 TXT MCQ format (auto-extract):</p>
                  <pre className="font-mono leading-relaxed whitespace-pre text-amber-800 text-xs">{`Q: Question?
A) Option A
B) Option B
C) Option C
D) Option D
Answer: B
Explanation: Optional`}</pre>
                  <p className="mt-1.5 text-amber-700">Separate each question with a blank line.</p>
                </div>

                <div className="relative">
                  <textarea
                    className="input-field text-xs font-mono resize-y w-full"
                    style={{ minHeight: "300px" }}
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder={`Q: What is the primary function of an operating system?\nA) Store files permanently\nB) Manage hardware and software resources\nC) Browse the internet\nD) Run antivirus software\nAnswer: B\nExplanation: An OS manages CPU, memory, and I/O devices.\n\nQ: Which data structure follows LIFO?\nA) Queue\nB) Array\nC) Stack\nD) Linked List\nAnswer: C\nExplanation: Stack = Last In First Out.\n\nQ: Add more questions here...`}
                  />
                  {text.trim() && (
                    <div className="absolute bottom-2 right-2 flex items-center gap-2">
                      <span className="text-xs bg-gray-800/70 text-white px-2 py-0.5 rounded-full">
                        {text.split(/\n\s*\n/).filter(b => b.trim()).length} blocks
                        &nbsp;·&nbsp;
                        {text.length} chars
                      </span>
                      <button type="button" onClick={() => setText("")}
                        className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full hover:bg-red-600">
                        Clear
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Options */}
              <div className="mt-3 space-y-2">
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input type="checkbox" checked={replaceQ} onChange={e => setReplaceQ(e.target.checked)}
                    className="w-4 h-4 accent-orange-500" />
                  Replace existing questions (clears old first)
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input type="checkbox" checked={isFree} onChange={e => setIsFree(e.target.checked)}
                    className="w-4 h-4 accent-green-600" />
                  Free exam (no payment required)
                </label>
              </div>
            </div>

            {/* Upload button */}
            <button onClick={handleUpload} disabled={!isReady || uploading}
              className="btn-primary w-full py-3.5 text-base disabled:opacity-50">
              {uploading
                ? "⏳ Uploading…"
                : `🚀 Save Questions → ${selectedDept.name} ${selectedYear}`}
            </button>

            {/* Result */}
            {result && (
              <div className={`rounded-2xl p-4 text-sm font-medium ${
                result.success
                  ? "bg-green-50 border border-green-200 text-green-800"
                  : "bg-red-50 border border-red-200 text-red-700"
              }`}>
                <div>{result.success ? "✅ " : "❌ "}{result.message}</div>
                {result.success && (result.saved ?? 0) > 0 && (
                  <div className="mt-2 flex items-center gap-3">
                    <span className="text-xs font-bold bg-green-200 text-green-800 px-2 py-1 rounded-lg">
                      {result.saved} questions saved
                    </span>
                    <span className="text-xs text-green-700">
                      ✓ Unlocked users can now take this exam
                    </span>
                  </div>
                )}
                {result.success && (result.saved ?? 0) === 0 && (
                  <div className="mt-2 text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                    💡 No questions were extracted. Make sure your text uses the MCQ format shown on the right, or use a TXT file.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Exam status + actions */}
          <div className="space-y-4">
            {/* All exams for this department */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-800 text-sm">{selectedDept.name} — All Exams</h3>
              </div>
              {deptExams.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-sm">No exams created yet.</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {deptExams.sort((a, b) => a.year - b.year).map(e => {
                    const qCount = qCounts[e.id] ?? 0;
                    const hasQ   = qCount > 0;
                    const isSel  = e.year === selectedYear;
                    return (
                      <div key={e.id}
                        className={`px-4 py-3 flex items-center justify-between gap-2 transition-all ${isSel ? "bg-green-50" : "hover:bg-gray-50"}`}>
                        <div className="flex items-center gap-3 min-w-0">
                          <button onClick={() => handleSelectYear(e.year)}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs flex-shrink-0 transition-all ${
                              isSel
                                ? "bg-green-600 text-white"
                                : hasQ
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-500"
                            }`}>
                            {e.year.toString().slice(2)}
                          </button>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-gray-800">{e.year} Exam</div>
                            <div className="flex gap-1 flex-wrap mt-0.5">
                              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${hasQ ? "bg-green-100 text-green-700" : "bg-red-100 text-red-500"}`}>
                                {hasQ ? `${qCount} q` : "empty"}
                              </span>
                              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${e.is_active ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400"}`}>
                                {e.is_active ? "live" : "off"}
                              </span>
                              {e.is_free && <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-yellow-100 text-yellow-700">free</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <button onClick={() => handleToggleFree(e)} title={e.is_free ? "Set Paid" : "Set Free"}
                            className="p-1.5 rounded-lg bg-yellow-50 text-yellow-600 hover:bg-yellow-100 text-xs">
                            {e.is_free ? "🔒" : "🆓"}
                          </button>
                          <button onClick={() => handleToggleActive(e)} title={e.is_active ? "Deactivate" : "Activate"}
                            className={`p-1.5 rounded-lg text-xs ${e.is_active ? "bg-orange-50 text-orange-500 hover:bg-orange-100" : "bg-green-50 text-green-600 hover:bg-green-100"}`}>
                            {e.is_active ? "⏸" : "▶"}
                          </button>
                          <button onClick={() => handleDeleteExam(e)} title="Delete"
                            className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 text-xs">
                            🗑️
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* MCQ format guide removed — shown inline above textarea */}
          </div>
        </div>
      )}
    </div>
  );
}
