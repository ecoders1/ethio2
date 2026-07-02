"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";

interface Department { id: string; name: string; name_am: string; name_om: string; }
interface Settings {
  department_price?: string;
  cbe_account?: string;
  telebirr_account?: string;
  cbe_birr_account?: string;
  telegram_username?: string;
}

export default function PaymentPage() {
  const params = useParams();
  const departmentId = params.departmentId as string;
  const router = useRouter();
  const { language } = useLanguage();

  const [dept, setDept] = useState<Department | null>(null);
  const [settings, setSettings] = useState<Settings>({});
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [step, setStep] = useState<1 | 2>(1); // step 1 = pay, step 2 = upload

  useEffect(() => {
    Promise.all([
      fetch("/api/departments").then(r => r.json()),
      fetch("/api/settings").then(r => r.json()),
    ]).then(([dData, sData]) => {
      setDept(dData.departments?.find((d: Department) => d.id === departmentId) || null);
      setSettings(sData.settings || {});
    });
  }, [departmentId]);

  const getDeptName = (d: Department) =>
    language === "am" ? d.name_am || d.name : language === "om" ? d.name_om || d.name : d.name;

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(""), 2500);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshotFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!screenshotFile) { setError("Please upload your payment screenshot."); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ department_id: departmentId, screenshot_url: null }),
      });
      const data = await res.json();
      if (res.ok) setSuccess(true);
      else setError(data.error || "Submission failed.");
    } catch { setError("Network error. Try again."); }
    setLoading(false);
  };

  const price = settings.department_price || "100";
  const telegram = settings.telegram_username || "@milkibn";
  const accounts = [
    { label: "CBE (Commercial Bank)", number: settings.cbe_account || "1000458067857", icon: "🏦", color: "#1e40af" },
    { label: "Telebirr", number: settings.telebirr_account || "0943133184", icon: "📱", color: "#16a34a" },
    { label: "CBE Birr", number: settings.cbe_birr_account || "0991575614", icon: "💳", color: "#7c3aed" },
  ];

  // ── Success screen ──────────────────────────────────────────
  if (success) return (
    <div className="px-4 py-6 animate-fade-in">
      <div className="card text-center py-8">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Payment Submitted!</h2>
        <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
          Your request is under review. Send your screenshot on Telegram for faster approval.
        </p>
        <a href={`https://t.me/${telegram.replace("@", "")}`}
          target="_blank" rel="noopener noreferrer"
          className="btn-primary w-full flex items-center justify-center gap-2 mb-3">
          <span>✈️</span> Send Screenshot on Telegram
        </a>
        <p className="text-sm text-gray-400 mb-6">Telegram: <strong>{telegram}</strong></p>
        <button onClick={() => router.push("/departments")}
          className="text-green-600 font-medium text-sm hover:underline">
          ← Back to Departments
        </button>
      </div>
    </div>
  );

  return (
    <div className="px-4 py-6 animate-fade-in space-y-4">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-green-600 font-medium text-sm">
        ← Back
      </button>

      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Unlock Department</h1>
        {dept && <p className="text-green-600 font-semibold mt-0.5">{getDeptName(dept)}</p>}
      </div>

      {/* Price banner */}
      <div className="rounded-2xl p-4 text-white text-center"
        style={{ background: "linear-gradient(135deg,#16a34a,#15803d)" }}>
        <div className="text-sm text-green-100 mb-1">One-time payment</div>
        <div className="text-5xl font-black">{price} ETB</div>
        <div className="text-green-200 text-xs mt-1">Unlocks ALL exam years · ALL questions</div>
      </div>

      {/* Step tabs */}
      <div className="flex rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
        <button onClick={() => setStep(1)}
          className={`flex-1 py-2.5 text-sm font-semibold transition-all ${step === 1 ? "bg-green-600 text-white" : "text-gray-500 hover:bg-gray-100"}`}>
          1. Pay
        </button>
        <button onClick={() => setStep(2)}
          className={`flex-1 py-2.5 text-sm font-semibold transition-all ${step === 2 ? "bg-green-600 text-white" : "text-gray-500 hover:bg-gray-100"}`}>
          2. Upload Screenshot
        </button>
      </div>

      {/* ── STEP 1: Payment accounts ── */}
      {step === 1 && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 font-medium">Transfer <strong>{price} ETB</strong> to any account below, then tap <em>Next</em>.</p>

          {accounts.map(acc => (
            <div key={acc.label} className="card flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 bg-gray-50">
                  {acc.icon}
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-gray-500 font-medium">{acc.label}</div>
                  <div className="font-mono font-bold text-gray-800 text-base tracking-wide">{acc.number}</div>
                </div>
              </div>
              <button onClick={() => copy(acc.number, acc.label)}
                className={`flex-shrink-0 text-xs px-3 py-2 rounded-xl font-semibold transition-all ${
                  copied === acc.label
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}>
                {copied === acc.label ? "✓ Copied" : "Copy"}
              </button>
            </div>
          ))}

          <div className="card bg-blue-50 border border-blue-100 text-sm text-blue-800 space-y-1">
            <p className="font-bold">📋 How to pay:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Open your bank / Telebirr app</li>
              <li>Transfer exactly <strong>{price} ETB</strong> to one account above</li>
              <li>Take a screenshot of the confirmation</li>
              <li>Tap <strong>Next → Upload Screenshot</strong></li>
            </ol>
          </div>

          <button onClick={() => setStep(2)} className="btn-primary w-full py-3.5 text-base">
            I paid → Next: Upload Screenshot →
          </button>
        </div>
      )}

      {/* ── STEP 2: Screenshot upload ── */}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Upload your payment screenshot so admin can verify and unlock your access.</p>

          <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-6 cursor-pointer transition-all ${
            previewUrl ? "border-green-400 bg-green-50" : "border-gray-300 hover:border-green-400 bg-gray-50"
          }`}>
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="Payment screenshot" className="max-h-52 rounded-xl object-contain" />
            ) : (
              <>
                <div className="text-4xl mb-2">📸</div>
                <div className="text-gray-600 font-medium text-sm">Tap to upload screenshot</div>
                <div className="text-gray-400 text-xs mt-1">JPG, PNG — max 5 MB</div>
              </>
            )}
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </label>

          {screenshotFile && (
            <div className="text-sm text-green-700 font-medium bg-green-50 px-3 py-2 rounded-xl">
              ✓ {screenshotFile.name}
            </div>
          )}

          {/* Also send on Telegram */}
          <div className="card bg-yellow-50 border border-yellow-200 text-sm text-yellow-800">
            <p className="font-bold mb-1">⚡ Faster approval:</p>
            <p className="text-xs">Also send your screenshot directly on Telegram for same-day approval.</p>
            <a href={`https://t.me/${telegram.replace("@", "")}`}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-yellow-700 hover:underline">
              ✈️ Open Telegram: {telegram}
            </a>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep(1)}
              className="py-3 px-5 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold hover:bg-gray-50">
              ← Back
            </button>
            <button onClick={handleSubmit} disabled={loading || !screenshotFile}
              className="flex-1 btn-primary py-3.5 disabled:opacity-50">
              {loading ? "Submitting…" : "Submit Payment Request ✓"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
