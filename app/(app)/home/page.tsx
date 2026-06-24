"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRouter } from "next/navigation";

interface Department { id: string; name: string; name_am: string; name_om: string; }
interface Result {
  id: string; score: number; total_questions: number; completed_at: string;
  exams?: { title: string; year: number; departments?: { name: string } };
}

export default function HomePage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [unlockedDeptIds, setUnlockedDeptIds] = useState<string[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/departments").then(r => r.json()),
      fetch("/api/access").then(r => r.json()),
      fetch("/api/results").then(r => r.json()),
    ]).then(([dData, aData, rData]) => {
      setDepartments(dData.departments || []);
      setUnlockedDeptIds(aData.access || []);
      setResults((rData.results || []).slice(0, 3));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const getDeptName = (d: Department) =>
    language === "am" ? d.name_am || d.name : language === "om" ? d.name_om || d.name : d.name;

  const totalAnswered = results.reduce((s, r) => s + r.total_questions, 0);
  const totalCorrect = results.reduce((s, r) => s + r.score, 0);
  const avgScore = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  const unlockedDepts = departments.filter(d => unlockedDeptIds.includes(d.id));
  const lockedDepts = departments.filter(d => !unlockedDeptIds.includes(d.id));

  if (loading) return (
    <div className="px-4 py-6 space-y-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
      ))}
    </div>
  );

  return (
    <div className="px-4 py-6 space-y-6 animate-fade-in">

      {/* Welcome hero */}
      <div className="rounded-2xl p-5 text-white relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,#16a34a,#15803d)" }}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
        <div className="relative">
          <p className="text-green-200 text-sm">{t("welcomeUser")} 👋</p>
          <h2 className="text-2xl font-bold mt-0.5">{user?.full_name.split(" ")[0]}</h2>
          <p className="text-green-200 text-sm mt-1">&quot;Prepare, Practice, Pass.&quot;</p>
        </div>
      </div>

      {/* Progress */}
      <div className="card">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-gray-800">{t("progress")}</h3>
          <span className="text-2xl font-black text-green-600">{avgScore}%</span>
        </div>
        <div className="progress-bar mb-3">
          <div className="progress-fill" style={{ width: `${avgScore}%` }} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Exams Taken", value: results.length, color: "text-blue-600" },
            { label: "Questions", value: totalAnswered, color: "text-green-600" },
            { label: "Correct", value: totalCorrect, color: "text-green-700" },
          ].map(s => (
            <div key={s.label} className="text-center bg-gray-50 rounded-xl p-3">
              <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Unlocked departments */}
      {unlockedDepts.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-800">✅ Unlocked Departments</h3>
            <button onClick={() => router.push("/exams")}
              className="text-green-600 text-sm font-semibold">My Exams →</button>
          </div>
          <div className="space-y-2">
            {unlockedDepts.map(d => (
              <button key={d.id} onClick={() => router.push(`/departments/${d.id}`)}
                className="w-full card text-left flex items-center justify-between hover:shadow-md transition-all border-l-4 border-green-500">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                    style={{ background: "linear-gradient(135deg,#16a34a,#15803d)" }}>
                    {getDeptName(d)[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800 text-sm">{getDeptName(d)}</div>
                    <div className="text-xs text-green-600 font-medium">✓ All exams unlocked</div>
                  </div>
                </div>
                <span className="text-gray-400">›</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* All departments */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-gray-800">{t("availableDepts")}</h3>
          <button onClick={() => router.push("/departments")}
            className="text-green-600 text-sm font-semibold">See all →</button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {(lockedDepts.length > 0 ? lockedDepts : departments).slice(0, 6).map(d => (
            <button key={d.id} onClick={() => router.push(`/departments/${d.id}`)}
              className="card text-left hover:shadow-md transition-all hover:-translate-y-0.5">
              <div className="text-2xl mb-2">📚</div>
              <div className="font-semibold text-gray-800 text-sm">{getDeptName(d)}</div>
              <div className="text-xs text-gray-400 mt-1">🔒 Tap to unlock</div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent results */}
      {results.length > 0 && (
        <div>
          <h3 className="font-bold text-gray-800 mb-3">Recent Results</h3>
          <div className="space-y-2">
            {results.map(r => {
              const pct = Math.round((r.score / r.total_questions) * 100);
              return (
                <div key={r.id} className="card flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-800 text-sm">
                      {r.exams?.title || "Exam"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {r.exams?.departments?.name} · {new Date(r.completed_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className={`text-sm font-black px-3 py-1.5 rounded-xl ${
                    pct >= 50 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                  }`}>
                    {pct}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Profile */}
      <div className="card">
        <h3 className="font-bold text-gray-800 mb-3">{t("profile")}</h3>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
            style={{ background: "linear-gradient(135deg,#16a34a,#15803d)" }}>
            {user?.full_name[0]?.toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-gray-800">{user?.full_name}</div>
            <div className="text-xs text-gray-500">{user?.email}</div>
            <div className="text-xs text-green-600 font-medium mt-0.5">
              {unlockedDeptIds.length} department{unlockedDeptIds.length !== 1 ? "s" : ""} unlocked
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
