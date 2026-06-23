"use client";
import { useEffect, useState } from "react";

interface Settings { [key: string]: string; }

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then((d) => {
      setSettings(d.settings || {});
      setLoading(false);
    });
  }, []);

  const handleSave = async (key: string, value: string) => {
    setSaving(key);
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
    setSaving(null);
    setSaved(key);
    setTimeout(() => setSaved(null), 2000);
  };

  const fields = [
    { key: "department_price", label: "Department Price (ETB)", type: "number", icon: "💰" },
    { key: "cbe_account", label: "CBE Account Number", type: "text", icon: "🏦" },
    { key: "telebirr_account", label: "Telebirr Number", type: "text", icon: "📱" },
    { key: "cbe_birr_account", label: "CBE Birr Number", type: "text", icon: "💳" },
    { key: "telegram_username", label: "Telegram Username", type: "text", icon: "✈️" },
  ];

  if (loading) return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-gray-200 rounded-2xl animate-pulse" />)}
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in max-w-xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        <p className="text-gray-500 text-sm">Manage payment accounts, pricing, and app content</p>
      </div>

      {fields.map((f) => (
        <div key={f.key} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <span>{f.icon}</span> {f.label}
          </label>
          <div className="flex gap-3">
            <input
              type={f.type} className="input-field flex-1"
              value={settings[f.key] || ""}
              onChange={(e) => setSettings({ ...settings, [f.key]: e.target.value })}
            />
            <button
              onClick={() => handleSave(f.key, settings[f.key] || "")}
              disabled={saving === f.key}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                saved === f.key ? "bg-green-100 text-green-700" : "btn-primary"
              }`}>
              {saving === f.key ? "..." : saved === f.key ? "✓ Saved" : "Save"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
