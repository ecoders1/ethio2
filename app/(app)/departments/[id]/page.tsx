"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";

interface Exam { id: string; year: number; title: string; is_free: boolean; }
interface Department { id: string; name: string; name_am: string; name_om: string; }

// Always show these year buttons on every department
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
      fetch("/api/departments").then(r => r.json()),
      fetch(`/api/exams?department_id=${id}`).then(r => r.json()),
      fetch("/api/access").then(r => r.json()),
    ]).then(([dData, eData, aData]) => {
      setDept(dData.departments?.find((d: Department) => d.id === id) || null);
      setExams(eData.exams || []);
      setHasAccess((aData.access || []).includes(id));
      setLoading(false);
    });
  }, [id]);

  const getDeptName = (d: Department) =>
    language === "am" ? d.name_am || d.name : language === "om" ? d.name_om || d.name : d.name;

  const getExamForYear = (year: number) => exams.find(e => e.year === year);

  if (loading) return (
    <div className="px-4 py-6 space-y-3">
      {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-gray-200 rounded-2xl animate-pulse" />)}
    </div>
  );

  if (!dept) return <div className="px-4 py-6 text-center text-gray-500">Department not found.</div>;

  return (
    <div className="px-4 py-6 animate-fade-in">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-green-600 font-medium mb-4">
        ← Back
      </button>

      {/* Header */}
      <div className="rounded-2xl p-5 mb-6 text-white relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,#16a34a,#15803d)" }}>
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-6 translate-x-6" />
        <h1 className="text-xl font-bold relative">{getDeptName(dept)}</h1>
        <div className="flex items-center gap-2 mt-2 relative">
          {hasAccess
            ? <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full font-medium">✓ Full Access – All questions unlocked</span>
            : <span className="bg-yellow-400/20 text-yellow-200 text-xs px-3 py-1 rounded-full font-medium">🔒 Q1–20 free preview · Pay to unlock all</span>
          }
        </div>
      </div>

      {/* Exam year buttons — always show 2015, 2016, 2017, 2018 */}
      <h2 className="font-bold text-gray-800 mb-3">Exam Years</h2>
      <div className="space-y-3">
        {EXAM_YEARS.map(year => {
          const exam = getExamForYear(year);
          // ALL uploaded exams are locked — Q1-20 always free by question number
          // Only unlocked if user paid for this department
          const isLocked = !hasAccess && !exam?.is_free;
          const notUploaded = !exam;

          const handleClick = () => {
            if (notUploaded) return;
            if (isLocked) router.push(`/payment/${id}`);
            else router.push(`/exams/${exam.id}`);
          };

          return (
            <button key={year} onClick={handleClick}
              className={`w-full card text-left flex items-center justify-between transition-all ${
                notUploaded ? "opacity-50 cursor-default" :
                "hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
              }`}>
              <div className="flex items-center gap-3">
                {/* Year badge */}
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 ${
                  isLocked ? "bg-gray-100 text-gray-400" :
                  notUploaded ? "bg-gray-50 text-gray-300" :
                  "text-white"
                }`} style={!isLocked && !notUploaded ? { background: "linear-gradient(135deg,#16a34a,#15803d)" } : {}}>
                  {notUploaded ? "📭" : isLocked ? "🔒" : year}
                </div>

                <div>
                  <div className="font-semibold text-gray-800">{year} Exam</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {notUploaded
                      ? "Coming soon"
                      : isLocked
                        ? "Q1–20 free preview · Pay 200 ETB to unlock all"
                        : "All questions unlocked"}
                  </div>
                </div>
              </div>

              {/* Badge */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {notUploaded ? (
                  <span className="text-xs bg-gray-100 text-gray-400 px-2 py-1 rounded-full">Soon</span>
                ) : isLocked ? (
                  <span className="badge-locked">{t("locked")}</span>
                ) : (
                  <span className="badge-unlocked">{t("unlocked")}</span>
                )}
                {!notUploaded && <span className="text-gray-400">›</span>}
              </div>
            </button>
          );
        })}
      </div>

      {/* Unlock CTA */}
      {!hasAccess && (
        <div className="mt-6 rounded-2xl p-5 border-2 border-green-200 bg-green-50 text-center">
          <div className="text-3xl mb-2">🔓</div>
          <h3 className="font-bold text-gray-800 mb-1">Unlock Full Department Access</h3>
          <p className="text-gray-500 text-sm mb-4">
            One payment unlocks all exam years and all questions for this department
          </p>
          <button onClick={() => router.push(`/payment/${id}`)} className="btn-primary">
            {t("payToUnlock")} – 200 ETB
          </button>
        </div>
      )}

      {/* Telegram */}
      <a href="https://t.me/exitexamethiopia1" target="_blank" rel="noopener noreferrer"
        className="mt-5 flex items-center justify-center gap-2 text-green-600 text-sm font-medium hover:underline">
        <span>✈️</span> Join Telegram for exam updates
      </a>
    </div>
  );
}
