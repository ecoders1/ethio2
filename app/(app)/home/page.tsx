"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRouter } from "next/navigation";

interface Department { id: string; name: string; name_am: string; name_om: string; }
interface Exam { id: string; department_id: string; year: number; title: string; is_free: boolean; departments?: { name: string }; }
interface Result { id: string; score: number; total_questions: number; exam_id: string; completed_at: string; exams?: { title: string; year: number; departments?: { name: string } } }

export default function HomePage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/departments").then((r) => r.json()),
      fetch("/api/exams").then((r) => r.json()),
      fetch("/api/results").then((r) => r.json()),
    ]).then(([depts, exmsData, resData]) => {
      setDepartments(depts.departments?.slice(0, 6) || []);
      setExams(exmsData.exams?.slice(0, 4) || []);
      setResults(resData.results?.slice(0, 3) || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const getDeptName = (d: Department) => language === "am" ? d.name_am || d.name : language === "om" ? d.name_om || d.name : d.name;

  const totalAnswered = results.reduce((s, r) => s + r.total_questions, 0);
  const totalCorrect = results.reduce((s, r) => s + r.score, 0);
  const avgScore = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  if (loading) {
    return (
      <div className="px-4 py-6 space-y-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-2xl animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-6 animate-fade-in">
      {/* Welcome hero */}
      <div className="rounded-2xl p-5 text-white relative overflow-hidden" style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
        <div className="relative">
          <p className="text-green-200 text-sm">{t("welcomeUser")} 👋</p>
          <h2 className="text-2xl font-bold mt-0.5">{user?.full_name.split(" ")[0]}</h2>
          <p className="text-green-200 text-sm mt-1">&quot;Prepare, Practice, Pass.&quot;</p>
        </div>
      </div>

      {/* Progress card */}
      <div className="card">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-gray-800">{t("progress")}</h3>
          <span className="text-2xl font-black text-green-600">{avgScore}%</span>
        </div>
        <div className="progress-bar mb-2">
          <div className="progress-fill" style={{ width: `${avgScore}%` }} />
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { label: "Exams Taken", value: results.length, color: "text-blue-600" },
            { label: "Questions", value: totalAnswered, color: "text-green-600" },
            { label: "Correct", value: totalCorrect, color: "text-green-700" },
          ].map((s) => (
            <div key={s.label} className="text-center bg-gray-50 rounded-xl p-3">
              <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Available Departments */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-gray-800">{t("availableDepts")}</h3>
          <button onClick={() => router.push("/departments")} className="text-green-600 text-sm font-semibold">See all →</button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {departments.map((d) => (
            <button key={d.id} onClick={() => router.push(`/departments/${d.id}`)}
              className="card text-left hover:shadow-md transition-all hover:-translate-y-0.5 active:translate-y-0">
              <div className="text-2xl mb-2">📚</div>
              <div className="font-semibold text-gray-800 text-sm">{getDeptName(d)}</div>
              <div className="text-xs text-green-600 mt-1 font-medium">View exams →</div>
            </button>
          ))}
        </div>
      </div>

      {/* Latest Exams */}
      {exams.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-800">{t("latestExams")}</h3>
            <button onClick={() => router.push("/exams")} className="text-green-600 text-sm font-semibold">See all →</button>
          </div>
          <div className="space-y-2">
            {exams.map((exam) => (
              <button key={exam.id} onClick={() => router.push(`/exams/${exam.id}`)}
                className="card w-full text-left flex items-center justify-between hover:shadow-md transition-all">
                <div>
                  <div className="font-semibold text-gray-800 text-sm">{exam.title}</div>
                  <div className="text-xs text-gray-500">{exam.departments?.name} · {exam.year}</div>
                </div>
                <div className="flex items-center gap-2">
                  {exam.is_free ? <span className="badge-free">Free</span> : <span className="badge-locked">🔒</span>}
                  <span className="text-gray-400">›</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* User Profile Summary */}
      <div className="card">
        <h3 className="font-bold text-gray-800 mb-3">{t("profile")}</h3>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
            style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}>
            {user?.full_name[0]?.toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-gray-800">{user?.full_name}</div>
            <div className="text-xs text-gray-500">{user?.email}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
