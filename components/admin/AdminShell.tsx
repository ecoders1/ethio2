"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

const navLinks = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/users", label: "Users", icon: "👥" },
  { href: "/admin/departments", label: "Departments", icon: "📚" },
  { href: "/admin/exams", label: "Exams", icon: "📝" },
  { href: "/admin/seed", label: "Seed Exams", icon: "🌱" },
  { href: "/admin/exams/upload", label: "Upload Files", icon: "📤" },
  { href: "/admin/questions", label: "Questions", icon: "❓" },
  { href: "/admin/payments", label: "Payments", icon: "💳" },
  { href: "/admin/settings", label: "Settings", icon: "⚙️" },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/auth/signin");
      else if (!user.is_admin) router.push("/home");
    }
  }, [user, loading, router]);

  if (loading || !user?.is_admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center text-white">
          <div className="text-4xl font-black mb-2">EEE</div>
          <div className="text-gray-400">Loading admin panel...</div>
        </div>
      </div>
    );
  }

  const handleLogout = async () => { await logout(); router.push("/"); };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-gray-900 z-50 transform transition-transform lg:translate-x-0 lg:static lg:z-auto ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center text-white font-black text-xs leading-tight text-center px-1">EE</div>
            <div>
              <div className="text-white font-bold text-sm">Exit Exam Ethiopia</div>
              <div className="text-gray-400 text-xs">Admin Panel</div>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm font-medium ${
                pathname === link.href ? "bg-green-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
              onClick={() => setSidebarOpen(false)}>
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
          <div className="text-gray-400 text-xs mb-2 px-2 truncate">{user.email}</div>
          <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-red-400 hover:bg-gray-800 rounded-xl text-sm font-medium transition-all">
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm h-14 flex items-center px-4 gap-4">
          <button className="lg:hidden text-gray-500 hover:text-gray-700" onClick={() => setSidebarOpen(true)}>
            ☰
          </button>
          <div className="flex-1" />
          <div className="text-sm text-gray-600 font-medium">
            👋 {user.full_name.split(" ")[0]}
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
