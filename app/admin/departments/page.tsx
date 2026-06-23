"use client";
import { useEffect, useState } from "react";

interface Department { id: string; name: string; name_am: string; name_om: string; description: string | null; is_active: boolean; }

const emptyForm = { name: "", name_am: "", name_om: "", description: "" };

export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchDepts = () => {
    setLoading(true);
    fetch("/api/departments").then((r) => r.json()).then((d) => {
      setDepartments(d.departments || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchDepts(); }, []);

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    if (editId) {
      await fetch(`/api/departments/${editId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
    } else {
      await fetch("/api/departments", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
    }
    setSaving(false);
    setShowForm(false);
    setForm(emptyForm);
    setEditId(null);
    fetchDepts();
  };

  const handleEdit = (d: Department) => {
    setForm({ name: d.name, name_am: d.name_am, name_om: d.name_om, description: d.description || "" });
    setEditId(d.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this department? This will also delete all exams and questions.")) return;
    setDeleting(id);
    await fetch(`/api/departments/${id}`, { method: "DELETE" });
    setDeleting(null);
    fetchDepts();
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Departments</h1>
          <p className="text-gray-500 text-sm">{departments.length} departments</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm); }} className="btn-primary px-5 py-2.5 text-sm">
          + Add Department
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4">{editId ? "Edit" : "Add"} Department</h3>
          <div className="grid md:grid-cols-2 gap-3">
            <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Name (English) *</label>
              <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Computer Science" /></div>
            <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Name (Amharic)</label>
              <input className="input-field" value={form.name_am} onChange={(e) => setForm({ ...form, name_am: e.target.value })} placeholder="ኮምፒዩተር ሳይንስ" /></div>
            <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Name (Afaan Oromo)</label>
              <input className="input-field" value={form.name_om} onChange={(e) => setForm({ ...form, name_om: e.target.value })} placeholder="Saayinsii Kompiyuutaraa" /></div>
            <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Description</label>
              <input className="input-field" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" /></div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => { setShowForm(false); setEditId(null); }} className="py-2.5 px-5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary py-2.5 px-6">{saving ? "Saving..." : "Save"}</button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>{["Department", "Amharic", "Oromo", "Status", "Actions"].map((h) => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {loading ? [...Array(5)].map((_, i) => (
              <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="h-6 bg-gray-200 rounded animate-pulse" /></td></tr>
            )) : departments.map((d) => (
              <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800 text-sm">{d.name}</td>
                <td className="px-4 py-3 text-gray-500 text-sm">{d.name_am || "—"}</td>
                <td className="px-4 py-3 text-gray-500 text-sm">{d.name_om || "—"}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${d.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {d.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(d)} className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium">Edit</button>
                    <button onClick={() => handleDelete(d.id)} disabled={deleting === d.id}
                      className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium disabled:opacity-50">
                      {deleting === d.id ? "..." : "Delete"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
