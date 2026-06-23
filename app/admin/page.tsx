"use client";
import { useEffect, useState } from "react";

interface Stats {
  total_users: number; total_departments: number; total_exams: number;
  total_payments: number; total_revenue: number; pending_payments: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats").then((r) => r.json()).then((d) => {
      setStats(d.stats);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const cards = stats ? [
    { label: "Total Users", value: stats.total_users, icon: "👥", color: "#3b82f6" },
    { label: "Departments", value: stats.total_departments, icon: "📚", color: "#16a34a" },
    { label: "Exams", value: stats.total_exams, icon: "📝", color: "#8b5cf6" },
    { label: "Payments", value: stats.total_payments, icon: "💳", color: "#f59e0b" },
    { label: "Revenue (ETB)", value: `${stats.total_revenue.toLocaleString()}`, icon: "💰", color: "#16a34a" },
    { label: "Pending Payments", value: stats.pending_payments, icon: "⏳", color: "#ef4444" },
  ] : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 text-sm">EEE Platform Overview</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-28 bg-gray-200 rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {cards.map((c) => (
            <div key={c.label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="text-2xl mb-2">{c.icon}</div>
              <div className="text-2xl font-black" style={{ color: c.color }}>{c.value}</div>
              <div className="text-gray-500 text-xs mt-0.5">{c.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-bold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Add Department", href: "/admin/departments", icon: "➕" },
            { label: "Add Exam", href: "/admin/exams", icon: "📝" },
            { label: "Review Payments", href: "/admin/payments", icon: "💳" },
            { label: "Manage Users", href: "/admin/users", icon: "👥" },
          ].map((a) => (
            <a key={a.label} href={a.href}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 hover:bg-green-50 hover:text-green-700 transition-all text-center text-sm font-medium text-gray-600">
              <span className="text-2xl">{a.icon}</span>
              <span>{a.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
