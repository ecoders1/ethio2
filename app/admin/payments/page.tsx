"use client";
import { useEffect, useState } from "react";

interface Payment {
  id: string; amount: number; status: string; screenshot_url: string | null;
  created_at: string; updated_at: string;
  users?: { full_name: string; email: string };
  departments?: { name: string };
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchPayments = () => {
    setLoading(true);
    fetch("/api/payments").then((r) => r.json()).then((d) => {
      setPayments(d.payments || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchPayments(); }, []);

  const handleAction = async (id: string, status: "approved" | "rejected") => {
    setProcessing(id);
    await fetch(`/api/payments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setProcessing(null);
    fetchPayments();
  };

  const filtered = payments.filter((p) => filter === "all" || p.status === filter);

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-700",
      approved: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-600",
    };
    return map[s] || "bg-gray-100 text-gray-600";
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Payments</h1>
        <p className="text-gray-500 text-sm">{payments.length} total payments</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {["all", "pending", "approved", "rejected"].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${
              filter === f ? "bg-green-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}>
            {f}
            <span className="ml-1.5 bg-white/20 px-1.5 rounded-full text-xs">
              {f === "all" ? payments.length : payments.filter((p) => p.status === f).length}
            </span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>{["User", "Department", "Amount", "Status", "Date", "Screenshot", "Actions"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {loading ? [...Array(5)].map((_, i) => (
                <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="h-6 bg-gray-200 rounded animate-pulse" /></td></tr>
              )) : filtered.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800 text-sm">{p.users?.full_name || "—"}</div>
                    <div className="text-xs text-gray-400">{p.users?.email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-sm">{p.departments?.name || "—"}</td>
                  <td className="px-4 py-3 font-bold text-green-700 text-sm">{p.amount} ETB</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${statusBadge(p.status)}`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    {p.screenshot_url ? (
                      <a href={p.screenshot_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline">View</a>
                    ) : <span className="text-xs text-gray-400">No file</span>}
                  </td>
                  <td className="px-4 py-3">
                    {p.status === "pending" && (
                      <div className="flex gap-1.5">
                        <button onClick={() => handleAction(p.id, "approved")} disabled={processing === p.id}
                          className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 font-medium disabled:opacity-50">
                          {processing === p.id ? "..." : "✓ Approve"}
                        </button>
                        <button onClick={() => handleAction(p.id, "rejected")} disabled={processing === p.id}
                          className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium disabled:opacity-50">
                          ✗ Reject
                        </button>
                      </div>
                    )}
                    {p.status !== "pending" && <span className="text-xs text-gray-400">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
