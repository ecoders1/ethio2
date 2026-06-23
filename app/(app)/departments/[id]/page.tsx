"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";

interface Exam { id: string; year: number; title: string; is_free: boolean; }
interface Department { id: string; name: string; name_am: string; name_om: string; }

const EXAM_YEARS = [2015, 2016, 2017, 2018];

export default function DepartmentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { t, language } = useLanguage();
  const [dept, setDept] = useState<Department | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/departments`).then((r) => r.json()),
      fetch(`/api/exams?department_id=${id}`).then((r) => r.json()),
      fetch(`/api/access`).then((r) => r.json()),
    ]).then(([dData, eData, aData]) => {
      const found = dData.departments?.find((d: Department) => d.id === id);
      setDept(found || null);
      setExams(eData.exams || []);
      setHasAccess((aData.access || []).includes(id));
      setLoading(false);
    });
  }, [id]);

  const getDeptName = (d: Department) =>
    language === "am" ? d.name_am || d.name : language === "om" ? d.name_om || d.name : d.name;

  const getExamForYear = (year: number) => exams.find((e) => e.year === year);

  if (loading) {
    return <div className="px-4 py-6 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-gray-200 rounded-2xl animate-pulse" />)}</div>;
  }

  if (!dept) return <div className="px-4 py-6 text-center text-gray-500">Department not found.</div>;

  return (
    <div className="px-4 py-6 animate-fade-in">
      {/* Header */}
      <button onClick={() => router.back()} className="flex items-center gap-2 text-green-600 font-medium mb-4 hover:text-green-700">
        ← Back
      </button>

      <div className="card mb-6" style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}>
        <h1 className="text-xl font-bold text-white">{getDeptName(dept)}</h1>
        <div className="flex items-center gap-2 mt-2">
          {hasAccess ? (
            <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full font-medium">✓ Full Access</span>
          ) : (
            <span className="bg-yellow-400/20 text-yellow-200 text-xs px-3 py-1 rounded-full font-medium">🔒 Partial Access</span>
          )}
        </div>
      </div>

      {/* Exam Years */}
      <h2 className="font-bold text-gray-800 mb-3">Available Exams</h2>
      <div className="space-y-3">
        {EXAM_YEARS.map((year) => {
          const exam = getExamForYear(year);
          const isFree = year === 2015 || exam?.is_free;
          const isLocked = !isFree && !hasAccess;

          return (
            <button
              key={year}
              onClick={() => {
                if (exam) {
                  router.push(`/exams/${exam.id}`);
                } else if (isLocked) {
                  router.push(`/payment/${id}`);
                }
              }}
              disabled={!exam && isFree}
              className="w-full card text-left flex items-center justify-between hover:shadow-md transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm ${
                  isLocked ? "bg-gray-100 text-gray-400" : "text-white"
                }`} style={!isLocked ? { background: "linear-gradient(135deg, #16a34a, #15803d)" } : {}}>
                  {isLocked ? "🔒" : "📝"}
                </div>
                <div>
                  <div className="font-semibold text-gray-800">{year} Exam</div>
                  <div className="text-xs text-gray-500">
                    {year === 2015 ? "Questions 1–100 (Q1-20 free)" : isLocked ? "Locked – Pay to access" : "Full access"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isFree && !isLocked ? (
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

      {/* Payment CTA */}
      {!hasAccess && (
        <div className="mt-6 card border-2 border-green-200 bg-green-50">
          <div className="text-center">
            <div className="text-3xl mb-2">🔓</div>
            <h3 className="font-bold text-gray-800 mb-1">Unlock Full Access</h3>
            <p className="text-gray-500 text-sm mb-4">Get access to all exam years and all questions for 200 ETB</p>
            <button onClick={() => router.push(`/payment/${id}`)} className="btn-primary">
              {t("payToUnlock")} – 200 ETB
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
