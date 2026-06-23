"use client";
import { useEffect, useState } from "react";

interface Department { id: string; name: string; }
interface Exam { id: string; year: number; title: string; is_free: boolean; department_id: string; departments?: { name: string }; }

const emptyForm = { department_id: "", year: new Date().getFullYear(), title: "", is_free: false };

export default function AdminExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/exams").then((r) => r.json()),
      fetch("/api/departments").then((r) => r.json()),
    ]).then(([eData, dData]) => {
      setExams(eData.exams || []);
      setDepartments(dData.departments || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSave = async () => {
    if (!form.department_id || !form.title) return;
    setSaving(true);
    if (editId) {
      await fetch(`/api/exams/${editId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    } else {
      await fetch("/api/exams", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    }
    setSaving(false);
    setShowForm(false);
    setEditId(null);
    setForm(emptyForm);
    fetchAll();
  };

  const handleEdit = (e: Exam) => {
    setForm({ department_id: e.department_id, year: e.year, title: e.title, is_free: e.is_free });
    setEditId(e.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this exam?")) return;
    setDeleting(id);
    await fetch(`/api/exams/${id}`, { method: "DELETE" });
    setDeleting(null);
    fetchAll();
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Exams</h1>
          <p className="text-gray-500 text-sm">{exams.length} exams</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm); }} className="btn-primary px-5 py-2.5 text-sm">
          + Add Exam
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4">{editId ? "Edit" : "Add"} Exam</h3>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Department *</label>
              <select className="input-field" value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })}>
                <option value="">Select department</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Year *</label>
              <input type="number" className="input-field" value={form.year} onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) })} min={2010} max={2030} />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Title *</label>
              <input className="input-field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Computer Science 2015 Exam" />
            </div>
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_free} onChange={(e) => setForm({ ...form, is_free: e.target.checked })} className="w-4 h-4 accent-green-600" />
                <span className="text-sm font-medium text-gray-700">Free exam (all questions unlocked)</span>
              </label>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => { setShowForm(false); setEditId(null); }} className="py-2.5 px-5 rounded-xl border border-gray-200 text-gray-600 font-medium">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary py-2.5 px-6">{saving ? "Saving..." : "Save"}</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>{["Title", "Department", "Year", "Free", "Actions"].map((h) => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {loading ? [...Array(5)].map((_, i) => (
              <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="h-6 bg-gray-200 rounded animate-pulse" /></td></tr>
            )) : exams.map((e) => (
              <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800 text-sm">{e.title}</td>
                <td className="px-4 py-3 text-gray-500 text-sm">{e.departments?.name || "—"}</td>
                <td className="px-4 py-3 text-gray-500 text-sm">{e.year}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${e.is_free ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {e.is_free ? "Free" : "Paid"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(e)} className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium">Edit</button>
                    <button onClick={() => handleDelete(e.id)} disabled={deleting === e.id}
                      className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium disabled:opacity-50">
                      {deleting === e.id ? "..." : "Delete"}
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
