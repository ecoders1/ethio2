"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Language } from "@/lib/i18n";

interface Result { id: string; score: number; total_questions: number; completed_at: string; exams?: { title: string; year: number; departments?: { name: string } } }

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const router = useRouter();
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    fetch("/api/results").then((r) => r.json()).then((d) => {
      setResults(d.results || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    router.push("/");
  };

  const langs: { code: Language; label: string; native: string }[] = [
    { code: "en", label: "English", native: "English" },
    { code: "am", label: "Amharic", native: "አማርኛ" },
    { code: "om", label: "Afaan Oromo", native: "Afaan Oromoo" },
  ];

  return (
    <div className="px-4 py-6 animate-fade-in space-y-5">
      <h1 className="text-2xl font-bold text-gray-800">{t("settings")}</h1>

      {/* Profile */}
      <div className="card">
        <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wide mb-3">Profile</h2>
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}>
            {user?.full_name[0]?.toUpperCase()}
          </div>
          <div>
            <div className="font-bold text-gray-800">{user?.full_name}</div>
            <div className="text-sm text-gray-500">{user?.email}</div>
            {user?.is_admin && <span className="badge-free text-xs mt-1 inline-block">Admin</span>}
          </div>
        </div>
      </div>

      {/* Language */}
      <div className="card">
        <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wide mb-3">{t("language")}</h2>
        <div className="space-y-2">
          {langs.map((l) => (
            <button key={l.code} onClick={() => setLanguage(l.code)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                language === l.code ? "bg-green-50 border-2 border-green-400" : "bg-gray-50 border-2 border-transparent hover:bg-gray-100"
              }`}>
              <div className="flex items-center gap-3">
                <span className="text-xl">{l.code === "en" ? "🇬🇧" : l.code === "am" ? "🇪🇹" : "🌍"}</span>
                <div className="text-left">
                  <div className="font-semibold text-gray-800 text-sm">{l.label}</div>
                  <div className="text-xs text-gray-500">{l.native}</div>
                </div>
              </div>
              {language === l.code && <span className="text-green-500 font-bold">✓</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Exam History */}
      <div className="card">
        <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wide mb-3">{t("examHistory")}</h2>
        {loading ? (
          <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-gray-200 rounded-xl animate-pulse" />)}</div>
        ) : results.length === 0 ? (
          <div className="text-center py-4 text-gray-400">
            <div className="text-3xl mb-1">📝</div>
            <p className="text-sm">No exams taken yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {results.map((r) => {
              const pct = Math.round((r.score / r.total_questions) * 100);
              return (
                <div key={r.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5">
                  <div>
                    <div className="font-medium text-gray-800 text-sm">{r.exams?.title || "Exam"}</div>
                    <div className="text-xs text-gray-500">{r.exams?.departments?.name} · {new Date(r.completed_at).toLocaleDateString()}</div>
                  </div>
                  <div className={`text-sm font-bold px-2 py-1 rounded-lg ${pct >= 50 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                    {pct}%
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* App info */}
      <div className="card bg-gray-50">
        <div className="text-center text-sm text-gray-500">
          <div className="font-bold text-gray-700 mb-1">Exit Exam Ethiopia</div>
          <div className="text-xs">Version 1.0.0 · &quot;Prepare, Practice, Pass.&quot;</div>
          <div className="flex justify-center gap-1 mt-2">
            <div className="w-4 h-1 rounded-full bg-green-500" />
            <div className="w-4 h-1 rounded-full bg-yellow-400" />
            <div className="w-4 h-1 rounded-full bg-red-500" />
          </div>
        </div>
      </div>

      {/* Logout */}
      <button onClick={handleLogout} disabled={loggingOut}
        className="w-full py-3.5 rounded-xl border-2 border-red-200 text-red-600 font-semibold hover:bg-red-50 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
        {loggingOut ? "Logging out..." : <><span>🚪</span><span>{t("logout")}</span></>}
      </button>
    </div>
  );
}
