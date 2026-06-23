"use client";
import { useEffect, useState } from "react";

interface Question {
  id: string;
  question_number: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation: string | null;
  exam_id: string;
}
interface Exam {
  id: string;
  title: string;
  year: number;
  departments?: { name: string };
}

const emptyQ = {
  question_number: 1,
  question_text: "",
  option_a: "",
  option_b: "",
  option_c: "",
  option_d: "",
  correct_answer: "A",
  explanation: "",
};

export default function AdminQuestionsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyQ);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/exams")
      .then((r) => r.json())
      .then((d) => setExams(d.exams || []));
  }, []);

  useEffect(() => {
    if (!selectedExam) return;
    setLoading(true);
    fetch(`/api/questions?exam_id=${selectedExam}`)
      .then((r) => r.json())
      .then((d) => {
        setQuestions(d.questions || []);
        setLoading(false);
      });
  }, [selectedExam]);

  const handleAdd = async () => {
    if (!selectedExam || !form.question_text) return;
    setSaving(true);
    await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, exam_id: selectedExam }),
    });
    setSaving(false);
    setShowForm(false);
    setForm(emptyQ);
    // Refresh
    fetch(`/api/questions?exam_id=${selectedExam}`)
      .then((r) => r.json())
      .then((d) => setQuestions(d.questions || []));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this question?")) return;
    await fetch(`/api/questions/${id}`, { method: "DELETE" });
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Questions</h1>
          <p className="text-gray-500 text-sm">Add and manage MCQ questions per exam</p>
        </div>
        {selectedExam && (
          <button
            onClick={() => { setShowForm(true); setForm({ ...emptyQ, question_number: questions.length + 1 }); }}
            className="btn-primary px-5 py-2.5 text-sm"
          >
            + Add Question
          </button>
        )}
      </div>

      {/* Exam selector */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <label className="text-sm font-semibold text-gray-700 mb-2 block">Select Exam</label>
        <select
          className="input-field max-w-sm"
          value={selectedExam}
          onChange={(e) => setSelectedExam(e.target.value)}
        >
          <option value="">Choose an exam…</option>
          {exams.map((e) => (
            <option key={e.id} value={e.id}>
              {e.departments?.name} – {e.title} ({e.year})
            </option>
          ))}
        </select>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
          <h3 className="font-bold text-gray-800">New Question #{form.question_number}</h3>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Question Text *</label>
            <textarea
              className="input-field resize-none"
              rows={3}
              value={form.question_text}
              onChange={(e) => setForm({ ...form, question_text: e.target.value })}
              placeholder="Type the question here…"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(["a", "b", "c", "d"] as const).map((opt) => (
              <div key={opt}>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">
                  Option {opt.toUpperCase()} *
                </label>
                <input
                  className="input-field"
                  value={form[`option_${opt}`]}
                  onChange={(e) => setForm({ ...form, [`option_${opt}`]: e.target.value })}
                  placeholder={`Option ${opt.toUpperCase()}`}
                />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Correct Answer *</label>
              <select
                className="input-field"
                value={form.correct_answer}
                onChange={(e) => setForm({ ...form, correct_answer: e.target.value })}
              >
                {["A", "B", "C", "D"].map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Explanation</label>
              <input
                className="input-field"
                value={form.explanation}
                onChange={(e) => setForm({ ...form, explanation: e.target.value })}
                placeholder="Optional explanation"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={() => setShowForm(false)} className="py-2.5 px-5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={handleAdd} disabled={saving} className="btn-primary py-2.5 px-6">
              {saving ? "Saving…" : "Save Question"}
            </button>
          </div>
        </div>
      )}

      {/* Questions list */}
      {selectedExam && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-14 bg-gray-200 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : questions.length === 0 ? (
            <div className="p-10 text-center text-gray-400">
              <div className="text-4xl mb-2">❓</div>
              <p>No questions yet. Add one above or upload a file.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {questions.map((q) => (
                <div key={q.id} className="px-5 py-4 hover:bg-gray-50 flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {q.question_number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 text-sm mb-1 truncate">{q.question_text}</p>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                      {["A", "B", "C", "D"].map((o) => {
                        const txt = o === "A" ? q.option_a : o === "B" ? q.option_b : o === "C" ? q.option_c : q.option_d;
                        return (
                          <span
                            key={o}
                            className={`px-2 py-0.5 rounded-full ${o === q.correct_answer ? "bg-green-100 text-green-700 font-semibold" : "bg-gray-100"}`}
                          >
                            {o}: {txt}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(q.id)}
                    className="text-xs px-2 py-1 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 flex-shrink-0"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
