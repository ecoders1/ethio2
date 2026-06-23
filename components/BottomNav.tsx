"use client";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";

const navItems = [
  { path: "/home", key: "home", icon: "🏠", activeIcon: "🏠" },
  { path: "/departments", key: "department", icon: "📚", activeIcon: "📚" },
  { path: "/exams", key: "exam", icon: "📝", activeIcon: "📝" },
  { path: "/settings", key: "settings", icon: "⚙️", activeIcon: "⚙️" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <nav className="bottom-nav">
      <div className="max-w-lg mx-auto grid grid-cols-4 h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.path || pathname?.startsWith(item.path + "/");
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`flex flex-col items-center justify-center gap-0.5 transition-all ${
                isActive ? "text-green-600" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <span className="text-xl">{isActive ? item.activeIcon : item.icon}</span>
              <span className={`text-xs font-medium ${isActive ? "text-green-600" : "text-gray-400"}`}>
                {t(item.key)}
              </span>
              {isActive && (
                <div className="absolute bottom-0 w-6 h-0.5 rounded-full bg-green-600" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
