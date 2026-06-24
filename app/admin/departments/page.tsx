"use client";
import { useEffect, useState } from "react";

interface Department { id: string; name: string; name_am: string; name_om: string; description: string | null; is_active: boolean; }
interface Exam { id: string; year: number; title: string; department_id: string; }

const emptyForm = { name: "", name_am: "", name_om: "", description: "" };

export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Upload state
  const [uploadDeptId, setUploadDeptId] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadYear, setUploadYear] = useState(new Date().getFullYear());
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ success?: boolean; message?: string; extracted?: number; examId?: string } | null>(null);

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/departments").then(r => r.json()),
      fetch("/api/exams").then(r => r.json()),
    ]).then(([dData, eData]) => {
      setDepartments(dData.departments || []);
      setExams(eData.exams || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    if (editId) {
      await fetch(`/api/departments/${editId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    } else {
      await fetch("/api/departments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    }
    setSaving(false); setShowForm(false); setForm(emptyForm); setEditId(null);
    fetchAll();
  };

  const handleEdit = (d: Department) => {
    setForm({ name: d.name, name_am: d.name_am, name_om: d.name_om, description: d.description || "" });
    setEditId(d.id); setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this department and all its exams?")) return;
    setDeleting(id);
    await fetch(`/api/departments/${id}`, { method: "DELETE" });
    setDeleting(null); fetchAll();
  };

  const handleUpload = async () => {
    if (!uploadFile || !uploadDeptId) return;
    setUploading(true); setUploadResult(null);
    const fd = new FormData();
    fd.append("file", uploadFile);
    fd.append("department_id", uploadDeptId);
    fd.append("year", String(uploadYear));
    const res = await fetch("/api/admin/upload-dept", { method: "POST", body: fd });
    const data = await res.json();
    setUploadResult(data);
    setUploading(false);
    setUploadFile(null);
    if (data.success) fetchAll();
  };

  const getDeptExams = (deptId: string) => exams.filter(e => e.department_id === deptId);

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

      {/* Add/Edit form */}
      {showForm && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4">{editId ? "Edit" : "Add"} Department</h3>
          <div className="grid md:grid-cols-2 gap-3">
            <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Name (English) *</label>
              <input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Computer Science" /></div>
            <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Name (Amharic)</label>
              <input className="input-field" value={form.name_am} onChange={e => setForm({ ...form, name_am: e.target.value })} placeholder="ኮምፒዩተር ሳይንስ" /></div>
            <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Name (Afaan Oromo)</label>
              <input className="input-field" value={form.name_om} onChange={e => setForm({ ...form, name_om: e.target.value })} placeholder="Saayinsii Kompiyuutaraa" /></div>
            <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Description</label>
              <input className="input-field" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional" /></div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => { setShowForm(false); setEditId(null); }} className="py-2.5 px-5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary py-2.5 px-6">{saving ? "Saving..." : "Save"}</button>
          </div>
        </div>
      )}

      {/* Department cards with upload */}
      <div className="space-y-4">
        {loading ? [...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-gray-200 rounded-2xl animate-pulse" />
        )) : departments.map(d => {
          const deptExams = getDeptExams(d.id);
          const isUploading = uploadDeptId === d.id;
          return (
            <div key={d.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Dept header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold"
                    style={{ background: "linear-gradient(135deg,#16a34a,#15803d)" }}>
                    {d.name[0]}
                  </div>
                  <div>
                    <div className="font-bold text-gray-800">{d.name}</div>
                    <div className="text-xs text-gray-400">{deptExams.length} exam{deptExams.length !== 1 ? "s" : ""} uploaded</div>
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <span className={`text-xs px-2 py-1 rounded-full ${d.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {d.is_active ? "Active" : "Inactive"}
                  </span>
                  <button onClick={() => setUploadDeptId(isUploading ? null : d.id)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${isUploading ? "bg-green-600 text-white" : "bg-green-50 text-green-700 hover:bg-green-100"}`}>
                    📤 Upload Exam
                  </button>
                  <button onClick={() => handleEdit(d)} className="text-xs px-2 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium">Edit</button>
                  <button onClick={() => handleDelete(d.id)} disabled={deleting === d.id}
                    className="text-xs px-2 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium disabled:opacity-50">
                    {deleting === d.id ? "..." : "Delete"}
                  </button>
                </div>
              </div>

              {/* Existing exams for this dept */}
              {deptExams.length > 0 && (
                <div className="px-5 py-2 flex flex-wrap gap-2">
                  {deptExams.map(ex => (
                    <span key={ex.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">{ex.year} Exam</span>
                  ))}
                </div>
              )}

              {/* Upload panel */}
              {isUploading && (
                <div className="px-5 py-4 bg-green-50 border-t border-green-100 space-y-3">
                  <div className="text-sm font-bold text-green-800">📤 Upload Exam File for {d.name}</div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1 block">Exam Year</label>
                      <input type="number" className="input-field" value={uploadYear}
                        onChange={e => setUploadYear(parseInt(e.target.value))} min={2010} max={2030} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1 block">File (PDF/DOCX/TXT/XLSX)</label>
                      <label className="flex items-center gap-2 border-2 border-dashed border-green-300 rounded-xl px-3 py-2 cursor-pointer hover:border-green-500 bg-white">
                        <span className="text-lg">📄</span>
                        <span className="text-xs text-gray-500 truncate">{uploadFile ? uploadFile.name : "Choose file…"}</span>
                        <input type="file" className="hidden" accept=".pdf,.docx,.pptx,.xlsx,.xls,.txt,.csv"
                          onChange={e => setUploadFile(e.target.files?.[0] || null)} />
                      </label>
                    </div>
                  </div>

                  {/* Format hint */}
                  <div className="bg-white rounded-xl p-3 text-xs text-gray-500 border border-green-200">
                    <strong className="text-gray-700">TXT auto-extract format:</strong>
                    <pre className="mt-1 text-xs font-mono overflow-x-auto">{`Q: Question text here?
A) Option A
B) Option B
C) Option C
D) Option D
Answer: B
Explanation: Optional`}</pre>
                    <span className="text-gray-400">Separate questions with a blank line. PDF/DOCX are stored for reference.</span>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={handleUpload} disabled={uploading || !uploadFile}
                      className="btn-primary py-2 px-5 text-sm disabled:opacity-50">
                      {uploading ? "⏳ Uploading & Extracting…" : "🚀 Upload & Convert to MCQ"}
                    </button>
                    <button onClick={() => { setUploadDeptId(null); setUploadFile(null); setUploadResult(null); }}
                      className="py-2 px-4 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium">
                      Cancel
                    </button>
                  </div>

                  {uploadResult && (
                    <div className={`rounded-xl p-3 text-sm font-medium ${uploadResult.success ? "bg-green-100 text-green-800" : "bg-red-50 text-red-700"}`}>
                      {uploadResult.success ? "✅ " : "❌ "}{uploadResult.message}
                      {(uploadResult.extracted ?? 0) > 0 && (
                        <span className="block text-xs mt-1">{uploadResult.extracted} questions extracted and saved. Exam is now visible to users after payment.</span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
