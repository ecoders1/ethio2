"use client";
import { useEffect, useState } from "react";

interface Department { id: string; name: string; }
interface Exam {
  id: string; year: number; title: string; is_free: boolean;
  is_active: boolean; department_id: string; departments?: { name: string };
}

const emptyForm = { department_id: "", year: new Date().getFullYear(), title: "", is_free: false };

export default function AdminExamsPage() {
  const [exams, setExams]             = useState<Exam[]>([]);
  const [depts, setDepts]             = useState<Department[]>([]);
  const [loading, setLoading]         = useState(true);
  const [modal, setModal]             = useState<"add" | "edit" | null>(null);
  const [editId, setEditId]           = useState<string | null>(null);
  const [form, setForm]               = useState(emptyForm);
  const [saving, setSaving]           = useState(false);
  const [deleting, setDeleting]       = useState<string | null>(null);
  const [search, setSearch]           = useState("");
  const [filterDept, setFilterDept]   = useState("");
  const [filterStatus, setFilterStatus] = useState<"" | "active" | "inactive">("");
  const [toast, setToast]             = useState("");
  const [seeding, setSeeding]         = useState(false);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const [seeding2, setSeeding2]       = useState(false);

  const handleSeedCS2018 = async () => {
    if (!confirm("Insert all 100 CS 2018 questions into the database?")) return;
    setSeeding(true);
    try {
      const res = await fetch("/api/admin/seed-cs-2018", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        showToast(`✅ CS 2018 seeded — ${data.questions_inserted} questions inserted`);
        fetchAll();
      } else {
        showToast(`❌ Failed: ${data.error || data.errors?.join(", ")}`);
      }
    } catch {
      showToast("❌ Network error");
    }
    setSeeding(false);
  };

  const handleSeedCivil2015 = async () => {
    if (!confirm("Insert Civil Engineering 2015 questions into the database?")) return;
    setSeeding2(true);
    try {
      const res = await fetch("/api/admin/seed-civil-2015", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        showToast(`✅ Civil 2015 seeded — ${data.questions_inserted} questions inserted`);
        fetchAll();
      } else {
        showToast(`❌ Failed: ${data.error || data.errors?.join(", ")}`);
      }
    } catch {
      showToast("❌ Network error");
    }
    setSeeding2(false);
  };

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/exams").then(r => r.json()),
      fetch("/api/departments").then(r => r.json()),
    ]).then(([eData, dData]) => {
      setExams(eData.exams || []);
      setDepts(dData.departments || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };
  useEffect(() => { fetchAll(); }, []);

  const openAdd = () => { setForm(emptyForm); setEditId(null); setModal("add"); };
  const openEdit = (e: Exam) => {
    setForm({ department_id: e.department_id, year: e.year, title: e.title, is_free: e.is_free });
    setEditId(e.id); setModal("edit");
  };
  const closeModal = () => { setModal(null); setEditId(null); };

  const handleSave = async () => {
    if (!form.department_id || !form.title) return;
    setSaving(true);
    const url = modal === "edit" ? `/api/exams/${editId}` : "/api/exams";
    const method = modal === "edit" ? "PUT" : "POST";
    const res = await fetch(url, {
      method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    showToast(res.ok ? `✅ Exam ${modal === "add" ? "created" : "updated"}` : "❌ Failed");
    setSaving(false); closeModal(); fetchAll();
  };

  const handleDelete = async (e: Exam) => {
    if (!confirm(`Delete "${e.title}"? This will also delete all questions.`)) return;
    setDeleting(e.id);
    const res = await fetch(`/api/exams/${e.id}`, { method: "DELETE" });
    showToast(res.ok ? "✅ Exam deleted" : "❌ Failed to delete");
    setDeleting(null); fetchAll();
  };

  const handleToggleActive = async (e: Exam) => {
    await fetch(`/api/exams/${e.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !e.is_active }),
    });
    showToast(`✅ Exam ${e.is_active ? "deactivated" : "activated"}`);
    fetchAll();
  };

  const handleToggleFree = async (e: Exam) => {
    await fetch(`/api/exams/${e.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_free: !e.is_free }),
    });
    showToast(`✅ Exam marked as ${e.is_free ? "paid" : "free"}`);
    fetchAll();
  };

  const filtered = exams
    .filter(e => !filterDept || e.department_id === filterDept)
    .filter(e => !filterStatus || (filterStatus === "active" ? e.is_active : !e.is_active))
    .filter(e => !search ||
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.departments?.name.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => a.year - b.year);

  return (
    <div className="space-y-5 animate-fade-in">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-xl text-sm font-medium">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Exams</h1>
          <p className="text-gray-500 text-sm">{exams.length} total exams</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={handleSeedCivil2015} disabled={seeding2}
            className="px-4 py-2.5 text-sm font-medium bg-orange-600 text-white rounded-xl hover:bg-orange-700 disabled:opacity-60 transition-all">
            {seeding2 ? "Seeding…" : "🌱 Seed Civil 2015"}
          </button>
          <button onClick={handleSeedCS2018} disabled={seeding}
            className="px-4 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-all">
            {seeding ? "Seeding…" : "🌱 Seed CS 2018"}
          </button>
          <button onClick={openAdd} className="btn-primary px-5 py-2.5 text-sm">+ Add Exam</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Exams", value: exams.length, color: "text-blue-600" },
          { label: "Free", value: exams.filter(e=>e.is_free).length, color: "text-green-600" },
          { label: "Active", value: exams.filter(e=>e.is_active).length, color: "text-purple-600" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input type="text" placeholder="Search exams…" value={search}
            onChange={e => setSearch(e.target.value)} className="input-field pl-9" />
        </div>
        <select className="input-field max-w-[200px]" value={filterDept}
          onChange={e => setFilterDept(e.target.value)}>
          <option value="">All Departments</option>
          {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      {/* Active/Inactive filter tabs */}
      <div className="flex gap-2">
        {[
          { val: "", label: "All", count: exams.length },
          { val: "active", label: "✅ Active", count: exams.filter(e => e.is_active).length },
          { val: "inactive", label: "⏸ Inactive", count: exams.filter(e => !e.is_active).length },
        ].map(tab => (
          <button key={tab.val}
            onClick={() => setFilterStatus(tab.val as "" | "active" | "inactive")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filterStatus === tab.val
                ? "bg-green-600 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}>
            {tab.label} <span className="ml-1 opacity-70 text-xs">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                {["Exam", "Department", "Year", "Status", "Actions"].map(h => (
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
                <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">No exams found.</td></tr>
              ) : filtered.map(e => (
                <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800 text-sm">{e.title}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{e.year} Exam</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-sm">{e.departments?.name || "—"}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center justify-center w-12 h-7 bg-green-50 text-green-700 font-bold text-xs rounded-lg">
                      {e.year}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5 flex-wrap">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${e.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {e.is_active ? "Active" : "Inactive"}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${e.is_free ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-600"}`}>
                        {e.is_free ? "Free" : "Paid"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5 flex-wrap">
                      <button onClick={() => openEdit(e)}
                        className="text-xs px-2 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium">
                        ✏️ Edit
                      </button>
                      <button onClick={() => handleToggleFree(e)}
                        className="text-xs px-2 py-1.5 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 font-medium whitespace-nowrap">
                        {e.is_free ? "🔒 Set Paid" : "🆓 Set Free"}
                      </button>
                      <button onClick={() => handleToggleActive(e)}
                        className={`text-xs px-2 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                          e.is_active
                            ? "bg-orange-50 text-orange-600 hover:bg-orange-100"
                            : "bg-green-50 text-green-700 hover:bg-green-100"
                        }`}>
                        {e.is_active ? "⏸ Deactivate" : "▶ Activate"}
                      </button>
                      <button onClick={() => handleDelete(e)} disabled={deleting === e.id}
                        className="text-xs px-2 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium disabled:opacity-50">
                        {deleting === e.id ? "…" : "🗑 Delete"}
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
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <h3 className="font-bold text-gray-800 text-lg mb-4">
              {modal === "add" ? "➕ Add New Exam" : "✏️ Edit Exam"}
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Department *</label>
                  <select className="input-field" value={form.department_id}
                    onChange={e => setForm({ ...form, department_id: e.target.value })}>
                    <option value="">Select…</option>
                    {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Year *</label>
                  <input type="number" className="input-field" value={form.year}
                    onChange={e => setForm({ ...form, year: parseInt(e.target.value) })}
                    min={2010} max={2030} />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Title *</label>
                <input className="input-field" value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Computer Science 2015 Exit Exam" />
              </div>
              <label className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl cursor-pointer">
                <input type="checkbox" checked={form.is_free}
                  onChange={e => setForm({ ...form, is_free: e.target.checked })}
                  className="w-4 h-4 accent-blue-600" />
                <div>
                  <div className="text-sm font-semibold text-gray-700">Free exam</div>
                  <div className="text-xs text-gray-500">All questions visible without payment</div>
                </div>
              </label>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={closeModal}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="flex-1 btn-primary py-2.5">
                {saving ? "Saving…" : modal === "add" ? "Create Exam" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
