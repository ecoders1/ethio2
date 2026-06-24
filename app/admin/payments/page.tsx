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
  const [editPayment, setEditPayment] = useState<Payment | null>(null);
  const [editAmount, setEditAmount] = useState("");

  const fetchPayments = () => {
    setLoading(true);
    fetch("/api/payments").then(r => r.json()).then(d => {
      setPayments(d.payments || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchPayments(); }, []);

  const handleStatus = async (id: string, status: "approved" | "rejected" | "pending") => {
    setProcessing(id);
    await fetch(`/api/payments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setProcessing(null);
    fetchPayments();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this payment record? This will also revoke the user's department access if approved.")) return;
    setProcessing(id);
    await fetch(`/api/payments/${id}`, { method: "DELETE" });
    setProcessing(null);
    fetchPayments();
  };

  const handleEditSave = async () => {
    if (!editPayment) return;
    setProcessing(editPayment.id);
    await fetch(`/api/payments/${editPayment.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: parseFloat(editAmount) }),
    });
    setEditPayment(null);
    setProcessing(null);
    fetchPayments();
  };

  const filtered = payments.filter(p => filter === "all" || p.status === filter);

  const statusBadge = (s: string) => ({
    pending:  "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-600",
  }[s] || "bg-gray-100 text-gray-600");

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Payments</h1>
        <p className="text-gray-500 text-sm">{payments.length} total · {payments.filter(p => p.status === "pending").length} pending</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {["all", "pending", "approved", "rejected"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${
              filter === f ? "bg-green-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}>
            {f} <span className="ml-1 opacity-70 text-xs">
              {f === "all" ? payments.length : payments.filter(p => p.status === f).length}
            </span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                {["User", "Department", "Amount", "Status", "Date", "Screenshot", "Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="h-6 bg-gray-200 rounded animate-pulse" /></td></tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">No payments found.</td></tr>
              ) : filtered.map(p => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800 text-sm">{p.users?.full_name || "—"}</div>
                    <div className="text-xs text-gray-400">{p.users?.email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-sm whitespace-nowrap">{p.departments?.name || "—"}</td>
                  <td className="px-4 py-3 font-bold text-green-700 text-sm whitespace-nowrap">{p.amount} ETB</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${statusBadge(p.status)}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    {p.screenshot_url
                      ? <a href={p.screenshot_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline">View</a>
                      : <span className="text-xs text-gray-400">None</span>
                    }
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5 flex-wrap">
                      {/* Approve */}
                      {p.status !== "approved" && (
                        <button onClick={() => handleStatus(p.id, "approved")} disabled={processing === p.id}
                          className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 font-medium disabled:opacity-50 whitespace-nowrap">
                          ✓ Approve
                        </button>
                      )}
                      {/* Reject */}
                      {p.status !== "rejected" && (
                        <button onClick={() => handleStatus(p.id, "rejected")} disabled={processing === p.id}
                          className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium disabled:opacity-50 whitespace-nowrap">
                          ✗ Reject
                        </button>
                      )}
                      {/* Reset to pending */}
                      {p.status !== "pending" && (
                        <button onClick={() => handleStatus(p.id, "pending")} disabled={processing === p.id}
                          className="text-xs px-2 py-1 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 font-medium disabled:opacity-50 whitespace-nowrap">
                          ↺ Reset
                        </button>
                      )}
                      {/* Edit amount */}
                      <button onClick={() => { setEditPayment(p); setEditAmount(String(p.amount)); }}
                        className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium whitespace-nowrap">
                        ✏️ Edit
                      </button>
                      {/* Delete */}
                      <button onClick={() => handleDelete(p.id)} disabled={processing === p.id}
                        className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 font-medium disabled:opacity-50">
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit amount modal */}
      {editPayment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-bold text-gray-800 mb-1">Edit Payment</h3>
            <p className="text-sm text-gray-500 mb-4">{editPayment.users?.full_name} · {editPayment.departments?.name}</p>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Amount (ETB)</label>
            <input type="number" className="input-field mb-4" value={editAmount}
              onChange={e => setEditAmount(e.target.value)} min={0} />
            <div className="flex gap-3">
              <button onClick={() => setEditPayment(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleEditSave} disabled={processing === editPayment.id}
                className="flex-1 btn-primary py-2.5">
                {processing === editPayment.id ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
