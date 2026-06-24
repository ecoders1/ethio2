"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import BottomNav from "./BottomNav";

// Cache exam data on device after sign-in for offline use
function cacheExamDataOffline(userId: string) {
  if (!("serviceWorker" in navigator)) return;
  const urls = [
    "/api/departments",
    "/api/exams",
    "/api/settings",
    "/api/access",
    `/api/results`,
  ];
  // Store that this user has downloaded data
  localStorage.setItem(`eee_offline_${userId}`, "1");
  navigator.serviceWorker.ready.then(reg => {
    reg.active?.postMessage({ type: "CACHE_EXAM_DATA", urls });
  });
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/signin");
    }
    // Download exam data for offline use after login
    if (!loading && user) {
      const key = `eee_offline_${user.id}`;
      if (!localStorage.getItem(key)) {
        cacheExamDataOffline(user.id);
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
        <div className="text-center">
          <div className="text-4xl font-black text-green-700 mb-2">EEE</div>
          <div className="text-green-500 text-sm">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const isAdminPath = pathname?.startsWith("/admin");
  if (isAdminPath) return <>{children}</>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-black"
              style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}>E</div>
            <span className="font-bold text-gray-800 text-sm">EEE</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm text-gray-600">{t("welcomeUser")},</span>
            <span className="text-sm font-semibold text-green-700 truncate max-w-[120px]">{user.full_name.split(" ")[0]}</span>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="max-w-lg mx-auto page-content">
        {children}
      </main>

      <BottomNav />
    </div>
  );
}
