"use client";
import { useEffect, useState } from "react";

interface Department {
  id: string; name: string; name_am: string; name_om: string;
  description: string | null; is_active: boolean;
}
interface Exam { id: string; year: number; title: string; department_id: string; }

const emptyForm = { name: "", name_am: "", name_om: "", description: "" };

export default function AdminDepartmentsPage() {
  const [depts, setDepts]           = useState<Department[]>([]);
  const [exams, setExams]           = useState<Exam[]>([]);
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState<"add" | "edit" | null>(null);
  const [editId, setEditId]         = useState<string | null>(null);
  const [form, setForm]             = useState(emptyForm);
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState<string | null>(null);
  const [toast, setToast]           = useState("");
  const [uploadDeptId, setUploadDeptId] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadYear, setUploadYear] = useState(new Date().getFullYear());
  const [uploading, setUploading]   = useState(false);
  const [uploadResult, setUploadResult] = useState<{ success?: boolean; message?: string; extracted?: number } | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/departments").then(r => r.json()),
      fetch("/api/exams").then(r => r.json()),
    ]).then(([dData, eData]) => {
      setDepts(dData.departments || []);
      setExams(eData.exams || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };
  useEffect(() => { fetchAll(); }, []);

  const openAdd = () => { setForm(emptyForm); setEditId(null); setModal("add"); };
  const openEdit = (d: Department) => {
    setForm({ name: d.name, name_am: d.name_am, name_om: d.name_om, description: d.description || "" });
    setEditId(d.id); setModal("edit");
  };
  const closeModal = () => { setModal(null); setEditId(null); };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const url = modal === "edit" ? `/api/departments/${editId}` : "/api/departments";
    const method = modal === "edit" ? "PUT" : "POST";
    const res = await fetch(url, {
      method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    showToast(res.ok ? `✅ Department ${modal === "add" ? "created" : "updated"}` : "❌ Failed");
    setSaving(false); closeModal(); fetchAll();
  };

  const handleDelete = async (d: Department) => {
    if (!confirm(`Delete "${d.name}"? This will also delete all exams and questions.`)) return;
    setDeleting(d.id);
    const res = await fetch(`/api/departments/${d.id}`, { method: "DELETE" });
    showToast(res.ok ? "✅ Department deleted" : "❌ Failed");
    setDeleting(null); fetchAll();
  };

  const handleToggleActive = async (d: Department) => {
    await fetch(`/api/departments/${d.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !d.is_active }),
    });
    showToast(`✅ Department ${d.is_active ? "deactivated" : "activated"}`);
    fetchAll();
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
    if (data.success) { showToast("✅ Exam uploaded and saved"); fetchAll(); }
  };

  const getDeptExams = (id: string) => exams.filter(e => e.department_id === id);

  return (
    <div className="space-y-5 animate-fade-in">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-xl text-sm font-medium">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Departments</h1>
          <p className="text-gray-500 text-sm">{depts.length} departments · {exams.length} total exams</p>
        </div>
        <button onClick={openAdd} className="btn-primary px-5 py-2.5 text-sm">+ Add Department</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Departments", value: depts.length, color: "text-green-600" },
          { label: "Active", value: depts.filter(d=>d.is_active).length, color: "text-blue-600" },
          { label: "Total Exams", value: exams.length, color: "text-purple-600" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Department cards */}
      <div className="space-y-3">
        {loading ? [...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
        )) : depts.map(d => {
          const deptExams = getDeptExams(d.id);
          const isUploadOpen = uploadDeptId === d.id;
          return (
            <div key={d.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Row */}
              <div className="flex items-center gap-3 px-5 py-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{ background: d.is_active ? "linear-gradient(135deg,#16a34a,#15803d)" : "#9ca3af" }}>
                  {d.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-800">{d.name}</div>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${d.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {d.is_active ? "Active" : "Inactive"}
                    </span>
                    {deptExams.length > 0 && deptExams.map(ex => (
                      <span key={ex.id} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                        {ex.year}
                      </span>
                    ))}
                    {deptExams.length === 0 && (
                      <span className="text-xs text-gray-400">No exams yet</span>
                    )}
                  </div>
                </div>
                {/* Actions */}
                <div className="flex gap-1.5 flex-shrink-0 flex-wrap justify-end">
                  <button onClick={() => { setUploadDeptId(isUploadOpen ? null : d.id); setUploadResult(null); setUploadFile(null); }}
                    className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                      isUploadOpen ? "bg-green-600 text-white" : "bg-green-50 text-green-700 hover:bg-green-100"
                    }`}>
                    📤 Upload
                  </button>
                  <button onClick={() => openEdit(d)}
                    className="text-xs px-2 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium">
                    ✏️ Edit
                  </button>
                  <button onClick={() => handleToggleActive(d)}
                    className="text-xs px-2 py-1.5 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 font-medium whitespace-nowrap">
                    {d.is_active ? "⏸" : "▶"}
                  </button>
                  <button onClick={() => handleDelete(d)} disabled={deleting === d.id}
                    className="text-xs px-2 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium disabled:opacity-50">
                    {deleting === d.id ? "…" : "🗑"}
                  </button>
                </div>
              </div>

              {/* Upload panel */}
              {isUploadOpen && (
                <div className="border-t border-green-100 bg-green-50 px-5 py-4 space-y-3">
                  <p className="text-sm font-bold text-green-800">📤 Upload Exam for {d.name}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1 block">Exam Year</label>
                      <input type="number" className="input-field" value={uploadYear}
                        onChange={e => setUploadYear(parseInt(e.target.value))} min={2010} max={2030} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1 block">File</label>
                      <label className="flex items-center gap-2 border-2 border-dashed border-green-300 rounded-xl px-3 py-2 cursor-pointer hover:border-green-500 bg-white text-xs">
                        <span>📄</span>
                        <span className="truncate text-gray-500">{uploadFile ? uploadFile.name : "PDF, DOCX, TXT…"}</span>
                        <input type="file" className="hidden" accept=".pdf,.docx,.pptx,.xlsx,.xls,.txt,.csv"
                          onChange={e => setUploadFile(e.target.files?.[0] || null)} />
                      </label>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border border-green-200 p-3 text-xs text-gray-500">
                    <strong className="text-gray-700 block mb-1">TXT MCQ format (auto-extract):</strong>
                    <pre className="font-mono">{`Q: Question?\nA) Option A\nB) Option B\nC) Option C\nD) Option D\nAnswer: B\nExplanation: Optional`}</pre>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleUpload} disabled={uploading || !uploadFile}
                      className="btn-primary py-2 px-5 text-sm disabled:opacity-50">
                      {uploading ? "⏳ Uploading…" : "🚀 Upload & Convert"}
                    </button>
                    <button onClick={() => { setUploadDeptId(null); setUploadFile(null); setUploadResult(null); }}
                      className="py-2 px-4 rounded-xl border border-gray-200 text-gray-600 text-sm">
                      Cancel
                    </button>
                  </div>
                  {uploadResult && (
                    <div className={`rounded-xl p-3 text-sm ${uploadResult.success ? "bg-green-100 text-green-800" : "bg-red-50 text-red-700"}`}>
                      {uploadResult.success ? "✅ " : "❌ "}{uploadResult.message}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <h3 className="font-bold text-gray-800 text-lg mb-4">
              {modal === "add" ? "➕ Add Department" : "✏️ Edit Department"}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Name (English) *</label>
                <input className="input-field" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Computer Science" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Amharic Name</label>
                <input className="input-field" value={form.name_am}
                  onChange={e => setForm({ ...form, name_am: e.target.value })} placeholder="ኮምፒዩተር ሳይንስ" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Afaan Oromo Name</label>
                <input className="input-field" value={form.name_om}
                  onChange={e => setForm({ ...form, name_om: e.target.value })} placeholder="Saayinsii Kompiyuutaraa" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Description</label>
                <input className="input-field" value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={closeModal}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="flex-1 btn-primary py-2.5">
                {saving ? "Saving…" : modal === "add" ? "Create Department" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
