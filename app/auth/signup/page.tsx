"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import Link from "next/link";

export default function SignUpPage() {
  const { register, user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (user) router.push(user.is_admin ? "/admin" : "/home");
  }, [user, router]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (form.fullName.trim().length < 6) e.fullName = "Full name must be at least 6 characters.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email address.";
    if (form.password.length < 6) e.password = "Password must be at least 6 characters.";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    setErrors({});
    const result = await register(form.fullName, form.email, form.password);
    setLoading(false);
    if (!result.success) setErrors({ general: result.error || "Registration failed." });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%)" }}>
      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl shadow-lg mb-3" style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}>
              <span className="text-2xl font-black text-white">EEE</span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Create your account</h1>
          <p className="text-gray-500 text-sm mt-1">Join thousands of Ethiopian university students</p>
        </div>

        <div className="card shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {errors.general && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {errors.general}
              </div>
            )}

            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t("fullName")}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">👤</span>
                <input
                  type="text" className={`input-field pl-10 ${errors.fullName ? "border-red-400" : ""}`}
                  placeholder="Abebe Kebede" value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  autoComplete="name"
                />
              </div>
              {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t("email")}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">✉️</span>
                <input
                  type="email" className={`input-field pl-10 ${errors.email ? "border-red-400" : ""}`}
                  placeholder="you@example.com" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  autoComplete="email"
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t("password")}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔒</span>
                <input
                  type={showPass ? "text" : "password"} className={`input-field pl-10 pr-10 ${errors.password ? "border-red-400" : ""}`}
                  placeholder="Min. 6 characters" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? "🙈" : "👁️"}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full text-base py-3.5">
              {loading ? (
                <span className="flex items-center gap-2"><span className="animate-spin">⟳</span> Creating account...</span>
              ) : (
                <span>{t("createAccount")}</span>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-600 mt-6 text-sm">
          Already have an account?{" "}
          <Link href="/auth/signin" className="text-green-700 font-semibold hover:underline">{t("signIn")}</Link>
        </p>
      </div>
    </div>
  );
}
