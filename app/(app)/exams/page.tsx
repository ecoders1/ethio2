"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";

interface Exam {
  id: string; year: number; title: string; is_free: boolean;
  department_id: string; departments?: { name: string };
}

export default function ExamsPage() {
  const [unlockedExams, setUnlockedExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    Promise.all([
      fetch("/api/exams").then(r => r.json()),
      fetch("/api/access").then(r => r.json()),
    ]).then(([eData, aData]) => {
      const allExams: Exam[] = eData.exams || [];
      const accessList: string[] = aData.access || [];
      // Only show exams user has unlocked (paid for)
      const unlocked = allExams.filter(e =>
        e.is_free || accessList.includes(e.department_id)
      );
      setUnlockedExams(unlocked);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="px-4 py-6 space-y-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-20 bg-gray-200 rounded-2xl animate-pulse" />
      ))}
    </div>
  );

  return (
    <div className="px-4 py-6 animate-fade-in">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-800">{t("exams")}</h1>
        <p className="text-gray-500 text-sm mt-1">Your unlocked exams</p>
      </div>

      {unlockedExams.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🔒</div>
          <h3 className="font-bold text-gray-700 text-lg mb-2">No exams unlocked yet</h3>
          <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
            Pay 200 ETB to unlock a department and access all its exams and questions.
          </p>
          <button onClick={() => router.push("/departments")}
            className="btn-primary px-8 py-3">
            Browse Departments →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {unlockedExams
            .sort((a, b) => a.year - b.year)
            .map(exam => (
              <button key={exam.id}
                onClick={() => router.push(`/exams/${exam.id}`)}
                className="w-full card text-left flex items-center justify-between hover:shadow-md hover:-translate-y-0.5 transition-all border-l-4 border-green-500">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm text-white flex-shrink-0"
                    style={{ background: "linear-gradient(135deg,#16a34a,#15803d)" }}>
                    {exam.year}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800 text-sm">{exam.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {exam.departments?.name} · {exam.year}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="badge-unlocked">{t("unlocked")}</span>
                  <span className="text-gray-400 text-lg">›</span>
                </div>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
