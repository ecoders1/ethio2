"use client";
import { useEffect, useState } from "react";

type ExamKey = "cs2015" | "cs2018" | "civil2015";

interface ExamStatus {
  id: string;
  title: string;
  year: number;
  questionCount: number;
  is_active: boolean;
}

const EXAMS: {
  key: ExamKey; label: string; dept: string; year: number; count: number;
  icon: string; color: string; bgLight: string; endpoint: string; topics: string;
}[] = [
  {
    key: "cs2015",
    label: "Computer Science 2015",
    dept: "Computer Science",
    year: 2015,
    count: 40,
    icon: "💻",
    color: "bg-purple-600 hover:bg-purple-700",
    bgLight: "bg-purple-50 border-purple-200",
    endpoint: "/api/admin/seed-cs-2015",
    topics: "Knowledge Representation, Security, Software Engineering, DBMS, AI, Networking, HTML, Data Structures",
  },
  {
    key: "cs2018",
    label: "Computer Science 2018",
    dept: "Computer Science",
    year: 2018,
    count: 100,
    icon: "💻",
    color: "bg-blue-600 hover:bg-blue-700",
    bgLight: "bg-blue-50 border-blue-200",
    endpoint: "/api/admin/seed-cs-2018",
    topics: "Web Dev, AI, DBMS, Data Structures, OS, Networking, OOP, Compiler Design, Security, Formal Languages",
  },
  {
    key: "civil2015",
    label: "Civil Engineering 2015",
    dept: "Civil Engineering",
    year: 2015,
    count: 101,
    icon: "🏗️",
    color: "bg-orange-600 hover:bg-orange-700",
    bgLight: "bg-orange-50 border-orange-200",
    endpoint: "/api/admin/seed-civil-2015",
    topics: "RC Design, Steel Structures, Highway Engineering, Geotechnical, Hydraulics, Construction Management",
  },
];

export default function AdminSeedPage() {
  const [seeding, setSeeding]   = useState<ExamKey | null>(null);
  const [results, setResults]   = useState<{ exam: string; success: boolean; message: string }[]>([]);
  const [statuses, setStatuses] = useState<Record<string, ExamStatus>>({});
  const [loadingStatus, setLoadingStatus] = useState(true);

  // Load current question counts from DB
  const loadStatuses = async () => {
    setLoadingStatus(true);
    try {
      const [eRes, qRes] = await Promise.all([
        fetch("/api/exams").then(r => r.json()),
        // We'll count per exam below
      ]);
      const exams: { id: string; year: number; title: string; is_active: boolean; departments?: { name: string } }[] = eRes.exams || [];
      const counts: Record<string, ExamStatus> = {};

      await Promise.all(exams.map(async (e) => {
        const qData = await fetch(`/api/questions?exam_id=${e.id}`).then(r => r.json());
        const key = `${e.departments?.name}__${e.year}`;
        counts[key] = {
          id: e.id,
          title: e.title,
          year: e.year,
          questionCount: qData.count ?? qData.questions?.length ?? 0,
          is_active: e.is_active,
        };
      }));
      setStatuses(counts);
    } catch { /* silent */ }
    setLoadingStatus(false);
  };

  useEffect(() => { loadStatuses(); }, []);

  const seedExam = async (exam: typeof EXAMS[number]) => {
    setSeeding(exam.key);
    try {
      const res  = await fetch(exam.endpoint, { method: "POST" });
      const data = await res.json();
      const ok   = res.ok && data.success !== false;
      setResults(prev => [{
        exam: exam.label,
        success: ok,
        message: ok
          ? `✅ ${data.questions_inserted} questions inserted into ${exam.label} exam`
          : `❌ Failed: ${data.error || data.errors?.join(", ")}`,
      }, ...prev]);
      if (ok) loadStatuses();
    } catch (err) {
      setResults(prev => [{
        exam: exam.label, success: false, message: `❌ Network error: ${err}`,
      }, ...prev]);
    }
    setSeeding(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Seed Exams</h1>
          <p className="text-gray-500 text-sm mt-1">
            One-click question insertion for each exam. Existing questions are replaced.
          </p>
        </div>
        <button onClick={loadStatuses} disabled={loadingStatus}
          className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg flex items-center gap-1 disabled:opacity-50">
          {loadingStatus ? "⏳" : "🔄"} Refresh
        </button>
      </div>

      {/* Seed Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {EXAMS.map(exam => {
          const statusKey = `${exam.dept}__${exam.year}`;
          const status    = statuses[statusKey];
          const hasQ      = (status?.questionCount ?? 0) > 0;
          const isSeeding = seeding === exam.key;

          return (
            <div key={exam.key}
              className={`rounded-2xl p-5 border-2 flex flex-col transition-all ${
                hasQ ? "bg-white border-green-200" : `border ${exam.bgLight}`
              }`}>

              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 bg-white rounded-xl shadow-sm flex items-center justify-center text-2xl flex-shrink-0 border border-gray-100">
                    {exam.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-sm leading-tight">{exam.label}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{exam.count} questions</p>
                  </div>
                </div>
                {/* Status badge */}
                {!loadingStatus && (
                  <span className={`text-xs px-2 py-1 rounded-full font-bold flex-shrink-0 ${
                    hasQ
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-600"
                  }`}>
                    {hasQ ? `✓ ${status?.questionCount}q` : "Empty"}
                  </span>
                )}
              </div>

              {/* Topics */}
              <p className="text-xs text-gray-500 mb-4 flex-1 leading-relaxed">{exam.topics}</p>

              {/* DB status */}
              {!loadingStatus && status && (
                <div className="text-xs text-gray-400 mb-3 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${status.is_active ? "bg-green-400" : "bg-gray-300"}`} />
                  {status.is_active ? "Live" : "Inactive"} — {hasQ ? `${status.questionCount} questions in DB` : "No questions in DB"}
                </div>
              )}
              {!loadingStatus && !status && (
                <div className="text-xs text-red-400 mb-3">⚠️ Exam record not found in DB</div>
              )}

              {/* Seed button */}
              <button
                onClick={() => seedExam(exam)}
                disabled={seeding !== null}
                className={`w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50 transition-all shadow-sm ${exam.color}`}
              >
                {isSeeding
                  ? "🌱 Seeding…"
                  : hasQ
                    ? `🔄 Re-seed ${exam.year} (${status?.questionCount}q → ${exam.count}q)`
                    : `🌱 Seed ${exam.label}`}
              </button>
            </div>
          );
        })}
      </div>

      {/* Results Log */}
      {results.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-800">Results</h3>
            <button onClick={() => setResults([])}
              className="text-xs text-gray-400 hover:text-gray-600 underline">
              Clear
            </button>
          </div>
          <div className="space-y-2">
            {results.map((r, i) => (
              <div key={i} className={`p-3 rounded-xl ${r.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
                <div className="text-sm font-bold">{r.exam}</div>
                <div className="text-xs mt-0.5 opacity-90">{r.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
        <h4 className="font-bold text-gray-700 mb-2 text-sm">ℹ️ How it works</h4>
        <ul className="text-sm text-gray-500 space-y-1.5">
          <li>• Each seed button creates the exam record if missing, clears old questions, then inserts all questions</li>
          <li>• Once seeded, users see the <strong>2015</strong> / <strong>2018</strong> button as active on the department page</li>
          <li>• Locked users (not paid) still see the button but are redirected to payment</li>
          <li>• Unlocked users open the exam immediately after seeding</li>
        </ul>
      </div>
    </div>
  );
}
