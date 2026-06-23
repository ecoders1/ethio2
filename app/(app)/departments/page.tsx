"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";

interface Department { id: string; name: string; name_am: string; name_om: string; description: string | null; }

const deptIcons: Record<string, string> = {
  "Computer Science": "💻", "Information Technology": "🖥️", "Software Engineering": "⚙️",
  "ICT": "📡", "Nursing": "🏥", "Accounting": "📊", "Economics": "💹",
  "Management": "📋", "Civil Engineering": "🏗️", "Electrical Engineering": "⚡",
};

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [access, setAccess] = useState<string[]>([]);
  const { t, language } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    Promise.all([
      fetch("/api/departments").then((r) => r.json()),
      fetch("/api/access").then((r) => r.json()),
    ]).then(([dData, aData]) => {
      setDepartments(dData.departments || []);
      setAccess(aData.access || []);
      setLoading(false);
    });
  }, []);

  const getDeptName = (d: Department) =>
    language === "am" ? d.name_am || d.name : language === "om" ? d.name_om || d.name : d.name;

  if (loading) {
    return (
      <div className="px-4 py-6 space-y-3">
        <div className="h-8 bg-gray-200 rounded-xl animate-pulse w-40" />
        {[...Array(6)].map((_, i) => <div key={i} className="h-20 bg-gray-200 rounded-2xl animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="px-4 py-6 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t("departments")}</h1>
        <p className="text-gray-500 text-sm mt-1">Select a department to start practicing</p>
      </div>

      <div className="space-y-3">
        {departments.map((dept) => {
          const hasAccess = access.includes(dept.id);
          return (
            <button key={dept.id} onClick={() => router.push(`/departments/${dept.id}`)}
              className="w-full card text-left flex items-center gap-4 hover:shadow-md transition-all hover:-translate-y-0.5 active:translate-y-0">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #f0fdf4, #dcfce7)" }}>
                {deptIcons[dept.name] || "📖"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-800">{getDeptName(dept)}</div>
                {dept.description && <div className="text-xs text-gray-500 truncate">{dept.description}</div>}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {hasAccess ? (
                  <span className="badge-unlocked">✓ Unlocked</span>
                ) : (
                  <span className="text-gray-400 text-lg">›</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
