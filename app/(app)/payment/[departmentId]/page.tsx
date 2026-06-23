"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";

interface Department { id: string; name: string; name_am: string; name_om: string; }
interface Settings { department_price?: string; cbe_account?: string; telebirr_account?: string; cbe_birr_account?: string; telegram_username?: string; }

export default function PaymentPage() {
  const params = useParams();
  const departmentId = params.departmentId as string;
  const router = useRouter();
  const { t, language } = useLanguage();

  const [dept, setDept] = useState<Department | null>(null);
  const [settings, setSettings] = useState<Settings>({});
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/departments").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ]).then(([dData, sData]) => {
      const found = dData.departments?.find((d: Department) => d.id === departmentId);
      setDept(found || null);
      setSettings(sData.settings || {});
    });
  }, [departmentId]);

  const getDeptName = (d: Department) =>
    language === "am" ? d.name_am || d.name : language === "om" ? d.name_om || d.name : d.name;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(""), 2000);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshotFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!screenshotFile) { setError("Please upload a payment screenshot."); return; }
    setLoading(true);
    setError("");

    try {
      // In a real app, upload to Supabase Storage first
      // For now, submit payment record without screenshot URL
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ department_id: departmentId, screenshot_url: null }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || "Failed to submit payment.");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="px-4 py-6 animate-fade-in">
        <div className="card text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Payment Submitted!</h2>
          <p className="text-gray-500 text-sm mb-4">
            Your payment is under review. Send your screenshot on Telegram for faster processing.
          </p>
          <a href={`https://t.me/${(settings.telegram_username || "@milkibn").replace("@", "")}`}
            target="_blank" rel="noopener noreferrer"
            className="btn-primary w-full block mb-3">
            📱 Send on Telegram {settings.telegram_username || "@milkibn"}
          </a>
          <button onClick={() => router.push("/departments")} className="text-green-600 font-medium text-sm">
            Back to Departments
          </button>
        </div>
      </div>
    );
  }

  const price = settings.department_price || "200";

  return (
    <div className="px-4 py-6 animate-fade-in">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-green-600 font-medium mb-4">← Back</button>

      <h1 className="text-xl font-bold text-gray-800 mb-1">{t("paymentInfo")}</h1>
      {dept && <p className="text-gray-500 text-sm mb-6">{getDeptName(dept)}</p>}

      {/* Price */}
      <div className="card mb-4 text-center" style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}>
        <div className="text-white/80 text-sm">{t("price")}</div>
        <div className="text-4xl font-black text-white">{price} ETB</div>
        <div className="text-green-200 text-sm">One-time payment for full department access</div>
      </div>

      {/* Payment accounts */}
      <div className="card mb-4">
        <h3 className="font-bold text-gray-800 mb-3">💳 Payment Accounts</h3>
        <div className="space-y-3">
          {[
            { label: "CBE (Commercial Bank)", value: settings.cbe_account || "1000458067857", icon: "🏦" },
            { label: "Telebirr", value: settings.telebirr_account || "0943133184", icon: "📱" },
            { label: "CBE Birr", value: settings.cbe_birr_account || "0991575614", icon: "💰" },
          ].map((acc) => (
            <div key={acc.label} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
              <div>
                <div className="text-xs text-gray-500">{acc.icon} {acc.label}</div>
                <div className="font-mono font-bold text-gray-800 text-sm">{acc.value}</div>
              </div>
              <button onClick={() => copyToClipboard(acc.value, acc.label)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                  copied === acc.label ? "bg-green-100 text-green-700" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"
                }`}>
                {copied === acc.label ? "✓ Copied" : "Copy"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="card mb-4 bg-blue-50 border border-blue-200">
        <h3 className="font-bold text-blue-800 mb-2">📋 Instructions</h3>
        <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
          <li>Transfer {price} ETB to one of the accounts above</li>
          <li>Take a screenshot of your payment confirmation</li>
          <li>Upload the screenshot below</li>
          <li>Send screenshot to Telegram: <strong>{settings.telegram_username || "@milkibn"}</strong></li>
          <li>Wait for admin approval (usually within 24 hours)</li>
        </ol>
      </div>

      {/* Screenshot upload */}
      <div className="card mb-4">
        <h3 className="font-bold text-gray-800 mb-3">{t("uploadScreenshot")}</h3>
        <label className={`block border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          previewUrl ? "border-green-400" : "border-gray-300 hover:border-green-400"
        }`}>
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="Screenshot" className="max-h-48 mx-auto rounded-lg" />
          ) : (
            <div>
              <div className="text-3xl mb-2">📸</div>
              <div className="text-gray-500 text-sm">Tap to upload payment screenshot</div>
              <div className="text-gray-400 text-xs mt-1">JPG, PNG (max 5MB)</div>
            </div>
          )}
          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        </label>
        {screenshotFile && (
          <div className="mt-2 text-xs text-green-600 font-medium">✓ {screenshotFile.name}</div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">{error}</div>
      )}

      <button onClick={handleSubmit} disabled={loading || !screenshotFile} className="btn-primary w-full text-base py-4">
        {loading ? "Submitting..." : "Submit Payment Request"}
      </button>

      <div className="mt-4 text-center text-sm text-gray-500">
        Questions? Contact us on Telegram:{" "}
        <a href={`https://t.me/${(settings.telegram_username || "@milkibn").replace("@", "")}`}
          target="_blank" rel="noopener noreferrer" className="text-green-600 font-semibold">
          {settings.telegram_username || "@milkibn"}
        </a>
      </div>
    </div>
  );
}
