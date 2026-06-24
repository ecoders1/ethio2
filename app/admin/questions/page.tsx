"use client";
import { useEffect, useState } from "react";

interface Question {
  id: string; question_number: number; question_text: string;
  option_a: string; option_b: string; option_c: string; option_d: string;
  correct_answer: string; explanation: string | null; exam_id: string;
}
interface Exam { id: string; title: string; year: number; departments?: { name: string }; }

const SAMPLE_QUESTIONS = [
  { q: "Which data structure follows LIFO?", a: "Queue", b: "Stack", c: "Linked List", d: "Binary Tree", ans: "B", exp: "Stack = Last In First Out." },
  { q: "Time complexity of Binary Search?", a: "O(n)", b: "O(n²)", c: "O(log n)", d: "O(n log n)", ans: "C", exp: "Halves search space each step." },
  { q: "NOT a feature of OOP?", a: "Encapsulation", b: "Inheritance", c: "Compilation", d: "Polymorphism", ans: "C", exp: "OOP: Encapsulation, Inheritance, Polymorphism, Abstraction." },
  { q: "SQL command to retrieve data?", a: "INSERT", b: "UPDATE", c: "SELECT", d: "DELETE", ans: "C", exp: "SELECT retrieves data from tables." },
  { q: "OSI layer responsible for routing?", a: "Data Link", b: "Transport", c: "Network Layer", d: "Session", ans: "C", exp: "Network Layer (Layer 3) handles IP routing." },
  { q: "What does CPU stand for?", a: "Central Processing Unit", b: "Central Program Unit", c: "Computer Processing Unit", d: "Core Processing Unit", ans: "A", exp: "CPU = Central Processing Unit." },
  { q: "Which paradigm uses pure mathematical functions?", a: "OOP", b: "Procedural", c: "Functional", d: "Imperative", ans: "C", exp: "Functional programming uses pure functions." },
  { q: "Primary purpose of an OS?", a: "Run browsers", b: "Manage hardware/software", c: "Compile code", d: "Store data", ans: "B", exp: "OS manages CPU, memory, storage." },
  { q: "IP stands for?", a: "Internet Protocol", b: "Internal Process", c: "Input Protocol", d: "Integrated Port", ans: "A", exp: "IP provides addressing and routing." },
  { q: "Which is non-volatile storage?", a: "RAM", b: "Cache", c: "Hard Disk Drive", d: "CPU Register", ans: "C", exp: "HDD keeps data without power. RAM is volatile." },
];

const emptyQ = { question_number: 1, question_text: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_answer: "A", explanation: "" };

export default function AdminQuestionsPage() {
  const [exams, setExams]           = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState("");
  const [questions, setQuestions]   = useState<Question[]>([]);
  const [loading, setLoading]       = useState(false);
  const [showForm, setShowForm]     = useState(false);
  const [form, setForm]             = useState(emptyQ);
  const [saving, setSaving]         = useState(false);
  const [filling, setFilling]       = useState(false);
  const [toast, setToast]           = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const fetchExams = () =>
    fetch("/api/exams").then(r => r.json()).then(d => setExams(d.exams || []));

  const fetchQuestions = (examId: string) => {
    if (!examId) return;
    setLoading(true);
    fetch(`/api/questions?exam_id=${examId}`)
      .then(r => r.json())
      .then(d => { setQuestions(d.questions || []); setLoading(false); });
  };

  useEffect(() => { fetchExams(); }, []);
  useEffect(() => { fetchQuestions(selectedExam); }, [selectedExam]);

  const handleAdd = async () => {
    if (!selectedExam || !form.question_text.trim()) return;
    setSaving(true);
    const res = await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, exam_id: selectedExam }),
    });
    setSaving(false);
    if (res.ok) { showToast("✅ Question added"); setShowForm(false); setForm(emptyQ); fetchQuestions(selectedExam); }
    else showToast("❌ Failed to add question");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this question?")) return;
    await fetch(`/api/questions/${id}`, { method: "DELETE" });
    setQuestions(prev => prev.filter(q => q.id !== id));
    showToast("✅ Question deleted");
  };

  // Quick-fill: add 10 sample questions at once
  const handleQuickFill = async () => {
    if (!selectedExam) return;
    if (!confirm("Add 10 sample questions to this exam?")) return;
    setFilling(true);
    const batch = SAMPLE_QUESTIONS.map((sq, i) => ({
      exam_id: selectedExam,
      question_number: questions.length + i + 1,
      question_text: sq.q,
      option_a: sq.a, option_b: sq.b, option_c: sq.c, option_d: sq.d,
      correct_answer: sq.ans,
      explanation: sq.exp,
    }));
    const res = await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(batch),
    });
    setFilling(false);
    if (res.ok) { showToast("✅ 10 sample questions added!"); fetchQuestions(selectedExam); }
    else showToast("❌ Failed to add questions");
  };

  const selectedExamInfo = exams.find(e => e.id === selectedExam);

  return (
    <div className="space-y-5 animate-fade-in">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-xl text-sm font-medium">
          {toast}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-gray-800">Questions</h1>
        <p className="text-gray-500 text-sm">Manage MCQ questions for each exam</p>
      </div>

      {/* Exam selector */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <label className="text-sm font-semibold text-gray-700 mb-2 block">Select Exam</label>
        <select className="input-field max-w-md" value={selectedExam}
          onChange={e => { setSelectedExam(e.target.value); setShowForm(false); }}>
          <option value="">— Choose an exam —</option>
          {exams.map(e => (
            <option key={e.id} value={e.id}>
              {e.departments?.name} · {e.title} ({e.year})
            </option>
          ))}
        </select>
        {selectedExamInfo && (
          <div className="mt-2 text-xs text-gray-400">
            {selectedExamInfo.departments?.name} · {selectedExamInfo.year} · {questions.length} question{questions.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Action bar */}
      {selectedExam && (
        <div className="flex gap-3 flex-wrap">
          <button onClick={() => { setShowForm(!showForm); setForm({ ...emptyQ, question_number: questions.length + 1 }); }}
            className="btn-primary px-5 py-2.5 text-sm">
            ➕ Add Question
          </button>
          {questions.length === 0 && (
            <button onClick={handleQuickFill} disabled={filling}
              className="px-5 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition-all disabled:opacity-50">
              {filling ? "⏳ Adding…" : "⚡ Quick Fill (10 Sample Questions)"}
            </button>
          )}
        </div>
      )}

      {/* Warning if exam has no questions */}
      {selectedExam && !loading && questions.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <div className="font-bold text-yellow-800 text-sm">This exam has no questions</div>
            <div className="text-yellow-700 text-xs mt-1">
              Users who unlock this department will see &quot;No questions uploaded yet&quot;.
              Click <strong>Add Question</strong> or <strong>Quick Fill</strong> to fix this.
            </div>
          </div>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
          <h3 className="font-bold text-gray-800">New Question #{form.question_number}</h3>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Question Text *</label>
            <textarea className="input-field resize-none" rows={3}
              value={form.question_text}
              onChange={e => setForm({ ...form, question_text: e.target.value })}
              placeholder="Type the full question here…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(["a","b","c","d"] as const).map(opt => (
              <div key={opt}>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Option {opt.toUpperCase()} *</label>
                <input className="input-field"
                  value={form[`option_${opt}`]}
                  onChange={e => setForm({ ...form, [`option_${opt}`]: e.target.value })}
                  placeholder={`Option ${opt.toUpperCase()}`} />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Correct Answer *</label>
              <select className="input-field" value={form.correct_answer}
                onChange={e => setForm({ ...form, correct_answer: e.target.value })}>
                {["A","B","C","D"].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Explanation (optional)</label>
              <input className="input-field" value={form.explanation}
                onChange={e => setForm({ ...form, explanation: e.target.value })}
                placeholder="Why is this the correct answer?" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowForm(false)}
              className="py-2.5 px-5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50">
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
              {[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-gray-200 rounded-xl animate-pulse" />)}
            </div>
          ) : questions.length === 0 ? (
            <div className="p-10 text-center text-gray-400">
              <div className="text-4xl mb-2">❓</div>
              <p className="text-sm">No questions yet. Use the buttons above to add some.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {questions
                .sort((a, b) => a.question_number - b.question_number)
                .map(q => (
                  <div key={q.id} className="px-5 py-4 hover:bg-gray-50 flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {q.question_number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 text-sm mb-2">{q.question_text}</p>
                      <div className="flex flex-wrap gap-1.5 text-xs">
                        {(["A","B","C","D"] as const).map(o => {
                          const txt = o === "A" ? q.option_a : o === "B" ? q.option_b : o === "C" ? q.option_c : q.option_d;
                          return (
                            <span key={o} className={`px-2 py-0.5 rounded-full ${
                              o === q.correct_answer
                                ? "bg-green-100 text-green-700 font-semibold"
                                : "bg-gray-100 text-gray-500"
                            }`}>
                              {o}: {txt}
                            </span>
                          );
                        })}
                      </div>
                      {q.explanation && (
                        <p className="text-xs text-blue-600 mt-1.5">💡 {q.explanation}</p>
                      )}
                    </div>
                    <button onClick={() => handleDelete(q.id)}
                      className="text-xs px-2 py-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 flex-shrink-0 font-medium">
                      🗑 Delete
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
