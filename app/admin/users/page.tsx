"use client";
import { useEffect, useState } from "react";

interface User {
  id: string; full_name: string; email: string;
  is_admin: boolean; device_id: string | null; created_at: string;
}
const emptyUser = { full_name: "", email: "", password: "", is_admin: false };

export default function AdminUsersPage() {
  const [users, setUsers]       = useState<User[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [modal, setModal]       = useState<"add" | "edit" | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm]         = useState(emptyUser);
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toast, setToast]       = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const fetchUsers = () => {
    setLoading(true);
    fetch("/api/admin/users").then(r => r.json()).then(d => {
      setUsers(d.users || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };
  useEffect(() => { fetchUsers(); }, []);

  const openAdd = () => { setForm(emptyUser); setModal("add"); };
  const openEdit = (u: User) => {
    setEditUser(u);
    setForm({ full_name: u.full_name, email: u.email, password: "", is_admin: u.is_admin });
    setModal("edit");
  };
  const closeModal = () => { setModal(null); setEditUser(null); };

  const handleSave = async () => {
    if (!form.full_name || !form.email) return;
    setSaving(true);
    if (modal === "add") {
      const res = await fetch("/api/admin/users", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      showToast(res.ok ? "✅ User created" : "❌ Failed to create user");
    } else if (modal === "edit" && editUser) {
      const res = await fetch(`/api/admin/users/${editUser.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: form.full_name, email: form.email, is_admin: form.is_admin }),
      });
      showToast(res.ok ? "✅ User updated" : "❌ Failed to update");
    }
    setSaving(false); closeModal(); fetchUsers();
  };

  const handleDelete = async (u: User) => {
    if (!confirm(`Delete "${u.full_name}"? This cannot be undone.`)) return;
    setDeleting(u.id);
    const res = await fetch(`/api/admin/users/${u.id}`, { method: "DELETE" });
    showToast(res.ok ? "✅ User deleted" : "❌ Failed to delete");
    setDeleting(null); fetchUsers();
  };

  const handleResetDevice = async (u: User) => {
    if (!confirm(`Reset device binding for "${u.full_name}"?`)) return;
    await fetch(`/api/admin/users/${u.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device_id: null }),
    });
    showToast("✅ Device binding reset");
    fetchUsers();
  };

  const filtered = users.filter(u =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-xl text-sm font-medium animate-slide-up">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Users</h1>
          <p className="text-gray-500 text-sm">{users.filter(u=>!u.is_admin).length} users · {users.filter(u=>u.is_admin).length} admins</p>
        </div>
        <button onClick={openAdd} className="btn-primary px-5 py-2.5 text-sm">+ Add User</button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
        <input type="text" placeholder="Search by name or email…" value={search}
          onChange={e => setSearch(e.target.value)} className="input-field pl-9" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Users", value: users.filter(u=>!u.is_admin).length, color: "text-blue-600" },
          { label: "Admins", value: users.filter(u=>u.is_admin).length, color: "text-purple-600" },
          { label: "Device Bound", value: users.filter(u=>u.device_id).length, color: "text-green-600" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                {["User", "Role", "Device", "Joined", "Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={5} className="px-4 py-3">
                    <div className="h-8 bg-gray-200 rounded-xl animate-pulse" />
                  </td></tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">No users found.</td></tr>
              ) : filtered.map(u => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ background: u.is_admin ? "linear-gradient(135deg,#7c3aed,#6d28d9)" : "linear-gradient(135deg,#16a34a,#15803d)" }}>
                        {u.full_name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-800 text-sm">{u.full_name}</div>
                        <div className="text-xs text-gray-400">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${u.is_admin ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"}`}>
                      {u.is_admin ? "Admin" : "User"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${u.device_id ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                      {u.device_id ? "✓ Bound" : "None"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5 flex-wrap">
                      <button onClick={() => openEdit(u)}
                        className="text-xs px-2 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium">
                        ✏️ Edit
                      </button>
                      {u.device_id && (
                        <button onClick={() => handleResetDevice(u)}
                          className="text-xs px-2 py-1.5 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 font-medium whitespace-nowrap">
                          📱 Reset Device
                        </button>
                      )}
                      <button onClick={() => handleDelete(u)} disabled={deleting === u.id}
                        className="text-xs px-2 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium disabled:opacity-50">
                        {deleting === u.id ? "…" : "🗑 Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-bold text-gray-800 text-lg mb-4">
              {modal === "add" ? "➕ Add New User" : "✏️ Edit User"}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Full Name *</label>
                <input className="input-field" value={form.full_name}
                  onChange={e => setForm({ ...form, full_name: e.target.value })}
                  placeholder="Abebe Kebede" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Email *</label>
                <input type="email" className="input-field" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="user@example.com" />
              </div>
              {modal === "add" && (
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Password *</label>
                  <input type="password" className="input-field" value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="Min. 6 characters" />
                </div>
              )}
              <label className="flex items-center gap-2 cursor-pointer p-3 bg-purple-50 rounded-xl">
                <input type="checkbox" checked={form.is_admin}
                  onChange={e => setForm({ ...form, is_admin: e.target.checked })}
                  className="w-4 h-4 accent-purple-600" />
                <div>
                  <div className="text-sm font-semibold text-gray-700">Admin access</div>
                  <div className="text-xs text-gray-500">Can manage exams, users, payments</div>
                </div>
              </label>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={closeModal}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 btn-primary py-2.5">
                {saving ? "Saving…" : modal === "add" ? "Create User" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
