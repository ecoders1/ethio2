"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";

interface Exam {
  id: string; year: number; title: string; is_free: boolean; department_id: string;
  departments?: { name: string };
}

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [access, setAccess] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    Promise.all([
      fetch("/api/exams").then((r) => r.json()),
      fetch("/api/access").then((r) => r.json()),
    ]).then(([eData, aData]) => {
      setExams(eData.exams || []);
      setAccess(aData.access || []);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="px-4 py-6 space-y-3">
      {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-gray-200 rounded-2xl animate-pulse" />)}
    </div>
  );

  return (
    <div className="px-4 py-6 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t("exams")}</h1>
        <p className="text-gray-500 text-sm mt-1">All available exams across departments</p>
      </div>

      {exams.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-5xl mb-3">📝</div>
          <p>No exams available yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {exams.map((exam) => {
            const hasAccess = access.includes(exam.department_id);
            const isLocked = !exam.is_free && !hasAccess;
            return (
              <button key={exam.id} onClick={() => router.push(isLocked ? `/payment/${exam.department_id}` : `/exams/${exam.id}`)}
                className="w-full card text-left flex items-center justify-between hover:shadow-md transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                    style={!isLocked ? { background: "linear-gradient(135deg, #dcfce7, #bbf7d0)" } : { background: "#f1f5f9" }}>
                    {isLocked ? "🔒" : "📝"}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800 text-sm">{exam.title}</div>
                    <div className="text-xs text-gray-500">{exam.departments?.name} · {exam.year}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {exam.is_free ? (
                    <span className="badge-free">{t("free")}</span>
                  ) : isLocked ? (
                    <span className="badge-locked">{t("locked")}</span>
                  ) : (
                    <span className="badge-unlocked">{t("unlocked")}</span>
                  )}
                  <span className="text-gray-400">›</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
