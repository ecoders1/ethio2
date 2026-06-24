"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";

interface Question {
  id: string; question_number: number; question_text: string;
  option_a: string; option_b: string; option_c: string; option_d: string;
  correct_answer: string; explanation: string | null;
}
interface Exam { id: string; year: number; title: string; is_free: boolean; departments?: { name: string } }

type Phase = "loading" | "exam" | "result";

export default function ExamPage() {
  const params = useParams();
  const examId = params.id as string;
  const router = useRouter();
  const { t } = useLanguage();

  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<Phase>("loading");
  const [warning, setWarning] = useState("");
  const [score, setScore] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  // Exam protection
  useEffect(() => {
    if (phase !== "exam") return;

    const prevent = (e: Event) => {
      e.preventDefault();
      setWarning("⚠️ Copy/paste is disabled during exam!");
      setTimeout(() => setWarning(""), 3000);
    };

    const preventKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ["c", "v", "x", "a", "p", "s"].includes(e.key.toLowerCase())) {
        e.preventDefault();
        setWarning("⚠️ Keyboard shortcut disabled during exam!");
        setTimeout(() => setWarning(""), 3000);
      }
    };

    const preventContext = (e: MouseEvent) => {
      e.preventDefault();
      setWarning("⚠️ Right-click is disabled during exam!");
      setTimeout(() => setWarning(""), 3000);
    };

    document.addEventListener("copy", prevent);
    document.addEventListener("cut", prevent);
    document.addEventListener("paste", prevent);
    document.addEventListener("keydown", preventKey);
    document.addEventListener("contextmenu", preventContext);

    return () => {
      document.removeEventListener("copy", prevent);
      document.removeEventListener("cut", prevent);
      document.removeEventListener("paste", prevent);
      document.removeEventListener("keydown", preventKey);
      document.removeEventListener("contextmenu", preventContext);
    };
  }, [phase]);

  useEffect(() => {
    Promise.all([
      fetch(`/api/exams/${examId}`).then((r) => r.json()),
      fetch(`/api/questions?exam_id=${examId}`).then((r) => r.json()),
    ]).then(([eData, qData]) => {
      setExam(eData.exam || null);
      setQuestions(qData.questions || []);
      setPhase("exam"); // always go to exam phase — empty questions handled separately
    }).catch(() => setPhase("exam"));
  }, [examId]);

  const handleAnswer = (questionId: string, option: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleSubmit = useCallback(async () => {
    if (submitted) return;
    setSubmitted(true);
    let correct = 0;
    questions.forEach((q) => { if (answers[q.id] === q.correct_answer) correct++; });
    setScore(correct);
    setPhase("result");

    // Save result
    try {
      await fetch("/api/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exam_id: examId, score: correct,
          total_questions: questions.length, answers,
        }),
      });
    } catch { /* silent */ }
  }, [answers, questions, examId, submitted]);

  const q = questions[current];
  const options: [string, string][] = q ? [["A", q.option_a], ["B", q.option_b], ["C", q.option_c], ["D", q.option_d]] : [];

  if (phase === "loading") {
    return (
      <div className="px-4 py-6 space-y-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-gray-200 rounded-2xl animate-pulse" />)}
      </div>
    );
  }

  if (phase === "result") {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="px-4 py-6 animate-fade-in">
        <div className="text-center mb-6">
          <div className="text-6xl mb-3">{pct >= 50 ? "🎉" : "📚"}</div>
          <h1 className="text-2xl font-bold text-gray-800">{t("score")}: {pct}%</h1>
          <p className="text-gray-500">{score} / {questions.length} correct</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="card text-center" style={{ borderLeft: "4px solid #16a34a" }}>
            <div className="text-2xl font-black text-green-600">{score}</div>
            <div className="text-sm text-gray-500">{t("correct")}</div>
          </div>
          <div className="card text-center" style={{ borderLeft: "4px solid #dc2626" }}>
            <div className="text-2xl font-black text-red-500">{questions.length - score}</div>
            <div className="text-sm text-gray-500">{t("wrong")}</div>
          </div>
        </div>

        {/* Question review */}
        <h2 className="font-bold text-gray-800 mb-3">Review</h2>
        <div className="space-y-4 mb-6">
          {questions.map((q, i) => {
            const userAns = answers[q.id];
            const isCorrect = userAns === q.correct_answer;
            return (
              <div key={q.id} className={`card border-l-4 ${isCorrect ? "border-green-500" : "border-red-500"}`}>
                <div className="font-medium text-gray-800 text-sm mb-2">
                  <span className="text-gray-400 mr-1">Q{i + 1}.</span> {q.question_text}
                </div>
                <div className="space-y-1">
                  {(["A", "B", "C", "D"] as const).map((opt) => {
                    const optText = opt === "A" ? q.option_a : opt === "B" ? q.option_b : opt === "C" ? q.option_c : q.option_d;
                    const isCorrectOpt = opt === q.correct_answer;
                    const isUserOpt = opt === userAns;
                    return (
                      <div key={opt} className={`text-sm px-3 py-1.5 rounded-lg ${
                        isCorrectOpt ? "bg-green-100 text-green-800 font-medium" :
                        isUserOpt && !isCorrectOpt ? "bg-red-100 text-red-700" : "text-gray-600"
                      }`}>
                        {opt}. {optText}
                        {isCorrectOpt && " ✓"}
                        {isUserOpt && !isCorrectOpt && " ✗"}
                      </div>
                    );
                  })}
                </div>
                {q.explanation && (
                  <div className="mt-2 p-2 bg-blue-50 rounded-lg text-xs text-blue-700">
                    💡 {q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button onClick={() => router.back()} className="btn-primary w-full">Back to Department</button>
      </div>
    );
  }

  if (phase === "exam" && questions.length === 0) {
    return (
      <div className="px-4 py-6 text-center animate-fade-in">
        <div className="text-6xl mb-4">📭</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Questions Not Uploaded Yet</h2>
        <p className="text-gray-500 text-sm mb-2">
          The admin hasn&apos;t added questions for this exam yet.
        </p>
        <p className="text-gray-400 text-xs mb-1">Your access is active ✓</p>
        <p className="text-gray-400 text-xs mb-6">
          Questions will appear here once the admin uploads them.
        </p>
        <a href="https://t.me/exitexamethiopia1" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-green-600 font-semibold text-sm mb-6 hover:underline">
          ✈️ Contact us on Telegram
        </a>
        <div className="mt-4">
          <button onClick={() => router.back()} className="btn-primary px-8 py-3">
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  const isFreePreview = !exam?.is_free && questions.length <= 20;
  const progress = ((current + 1) / questions.length) * 100;

  return (
    <div className="px-4 py-6 exam-protected animate-fade-in select-none">
      {/* Warning banner */}
      {warning && (
        <div className="fixed top-16 left-0 right-0 mx-4 z-50 bg-red-600 text-white text-center py-2 px-4 rounded-xl text-sm font-medium shadow-lg">
          {warning}
        </div>
      )}

      {/* Free preview notice */}
      {isFreePreview && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2.5 flex items-center gap-2 text-sm text-yellow-800">
          <span>🔒</span>
          <span><strong>Free Preview</strong> – Showing Q1–20. Pay 200 ETB to unlock all questions.</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => router.back()} className="text-green-600 font-medium text-sm">← Exit</button>
        <span className="text-sm text-gray-500 font-medium">{exam?.title}</span>
        <span className="text-sm font-bold text-green-600">{current + 1}/{questions.length}</span>
      </div>

      {/* Progress */}
      <div className="progress-bar mb-6">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Question */}
      <div className="card mb-5">
        <div className="text-xs text-gray-400 font-medium mb-2">{t("question")} {current + 1}</div>
        <p className="text-gray-800 font-medium leading-relaxed">{q.question_text}</p>
      </div>

      {/* Options */}
      <div className="space-y-3 mb-6">
        {options.map(([opt, text]) => (
          <button key={opt} onClick={() => handleAnswer(q.id, opt)}
            className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all font-medium text-sm ${
              answers[q.id] === opt
                ? "border-green-500 bg-green-50 text-green-800"
                : "border-gray-200 bg-white text-gray-700 hover:border-green-300 hover:bg-green-50/50"
            }`}>
            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold mr-3 ${
              answers[q.id] === opt ? "bg-green-500 text-white" : "bg-gray-100 text-gray-500"
            }`}>{opt}</span>
            {text}
          </button>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <button onClick={() => setCurrent((c) => Math.max(0, c - 1))} disabled={current === 0}
          className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold disabled:opacity-40 hover:border-gray-300 transition-all">
          ← {t("previous")}
        </button>

        {current < questions.length - 1 ? (
          <button onClick={() => setCurrent((c) => c + 1)}
            className="flex-1 btn-primary">
            {t("next")} →
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={submitted}
            className="flex-1 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition-all disabled:opacity-60">
            {t("submit")} ✓
          </button>
        )}
      </div>

      {/* Question dots */}
      <div className="flex flex-wrap gap-1.5 mt-4 justify-center">
        {questions.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)}
            className={`w-7 h-7 rounded-full text-xs font-medium transition-all ${
              i === current ? "bg-green-600 text-white scale-110" :
              answers[questions[i].id] ? "bg-green-200 text-green-700" : "bg-gray-200 text-gray-500"
            }`}>
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
