"use client";
import { useEffect, useState } from "react";

interface User { id: string; full_name: string; email: string; is_admin: boolean; device_id: string | null; created_at: string; }

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);

  const fetchUsers = () => {
    setLoading(true);
    fetch("/api/admin/users").then((r) => r.json()).then((d) => {
      setUsers(d.users || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this user?")) return;
    setDeleting(id);
    await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    setDeleting(null);
    fetchUsers();
  };

  const handleUpdate = async () => {
    if (!editUser) return;
    await fetch(`/api/admin/users/${editUser.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: editUser.full_name, email: editUser.email, is_admin: editUser.is_admin }),
    });
    setEditUser(null);
    fetchUsers();
  };

  const filtered = users.filter((u) =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Users</h1>
          <p className="text-gray-500 text-sm">{users.length} total registered users</p>
        </div>
      </div>

      {/* Search */}
      <input type="text" placeholder="Search users..." value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="input-field max-w-sm"
      />

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Name", "Email", "Role", "Device", "Joined", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="h-6 bg-gray-200 rounded animate-pulse" /></td></tr>
                ))
              ) : filtered.map((u) => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800 text-sm">{u.full_name}</td>
                  <td className="px-4 py-3 text-gray-500 text-sm">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${u.is_admin ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"}`}>
                      {u.is_admin ? "Admin" : "User"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{u.device_id ? "✓ Bound" : "—"}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => setEditUser(u)} className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium">Edit</button>
                      <button onClick={() => handleDelete(u.id)} disabled={deleting === u.id}
                        className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium disabled:opacity-50">
                        {deleting === u.id ? "..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="font-bold text-gray-800 mb-4">Edit User</h3>
            <div className="space-y-3">
              <input className="input-field" value={editUser.full_name} onChange={(e) => setEditUser({ ...editUser, full_name: e.target.value })} placeholder="Full Name" />
              <input className="input-field" value={editUser.email} onChange={(e) => setEditUser({ ...editUser, email: e.target.value })} placeholder="Email" />
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={editUser.is_admin} onChange={(e) => setEditUser({ ...editUser, is_admin: e.target.checked })} className="w-4 h-4 accent-green-600" />
                <span className="text-sm font-medium text-gray-700">Admin access</span>
              </label>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setEditUser(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={handleUpdate} className="flex-1 btn-primary py-2.5">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
