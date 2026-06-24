"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";

function LandingContent() {
  const { user, loading } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    if (!loading && user) {
      router.push(user.is_admin ? "/admin" : "/home");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0f4c2a 0%, #166534 50%, #14532d 100%)" }}>
        <div className="text-white text-center">
          <div className="text-4xl font-black mb-2">EEE</div>
          <div className="text-green-300 text-sm">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0f4c2a 0%, #166534 50%, #14532d 100%)" }}>
      {/* Background SVG with graduation cap */}
      <div className="absolute inset-0 pointer-events-none select-none">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/globe.svg" alt="" aria-hidden="true"
          className="w-full h-full object-cover opacity-100" />
      </div>

      {/* Language switcher */}
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        {(["en", "am", "om"] as const).map((lang) => (
          <button key={lang} onClick={() => setLanguage(lang)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${language === lang ? "bg-white text-green-800" : "bg-white/20 text-white hover:bg-white/30"}`}>
            {lang === "en" ? "EN" : lang === "am" ? "አማ" : "OM"}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className={`relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
        {/* Logo */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-white/15 backdrop-blur-sm border border-white/20 shadow-2xl mb-4">
            <span className="text-4xl font-black text-white">EEE</span>
          </div>
          <div className="text-white/80 text-sm tracking-widest uppercase font-medium">Exit Exam Ethiopia</div>
        </div>

        {/* Welcome */}
        <h1 className="text-4xl md:text-6xl font-black text-white mb-4 leading-tight">
          {t("welcome")}
        </h1>

        {/* Tagline */}
        <div className="inline-flex items-center gap-2 bg-yellow-400/20 border border-yellow-400/30 rounded-full px-6 py-2 mb-6">
          <span className="text-yellow-300 font-bold text-lg">&quot;{t("tagline")}&quot;</span>
        </div>

        {/* Description */}
        <p className="text-white/80 text-base md:text-lg max-w-2xl mb-10 leading-relaxed">
          {t("description")}
        </p>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 mb-10 max-w-sm">
          {[
            { icon: "📚", label: "10+ Departments" },
            { icon: "📝", label: "1000+ Questions" },
            { icon: "🌍", label: "3 Languages" },
          ].map((f) => (
            <div key={f.label} className="bg-white/10 rounded-2xl p-3 text-center">
              <div className="text-2xl mb-1">{f.icon}</div>
              <div className="text-white/80 text-xs font-medium">{f.label}</div>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <button
          onClick={() => router.push("/auth/signup")}
          className="group relative inline-flex items-center gap-3 bg-white text-green-800 font-bold text-lg px-10 py-4 rounded-2xl shadow-2xl hover:shadow-green-900/50 transition-all duration-300 hover:-translate-y-1 mb-4"
        >
          <span>🚀</span>
          <span>{t("getStarted")}</span>
          <span className="text-green-600 group-hover:translate-x-1 transition-transform">→</span>
        </button>

        {/* Sign in link */}
        <p className="text-white/60 text-sm">
          Already have an account?{" "}
          <button onClick={() => router.push("/auth/signin")} className="text-white font-semibold underline hover:text-green-300 transition-colors">
            {t("signIn")}
          </button>
        </p>

        {/* Telegram channel */}
        <a href="https://t.me/exitexamethiopia1" target="_blank" rel="noopener noreferrer"
          className="mt-4 flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors">
          <span className="text-lg">✈️</span>
          <span>Join our Telegram channel</span>
          <span className="text-green-400 font-semibold">@exitexamethiopia1</span>
        </a>

        {/* Ethiopian flag colors strip */}
        <div className="absolute bottom-0 left-0 right-0 flex h-1">
          <div className="flex-1 bg-green-500" />
          <div className="flex-1 bg-yellow-400" />
          <div className="flex-1 bg-red-500" />
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <LandingContent />
      </LanguageProvider>
    </AuthProvider>
  );
}
