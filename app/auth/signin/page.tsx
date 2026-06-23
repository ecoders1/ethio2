"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import Link from "next/link";

export default function SignInPage() {
  const { login, user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const [form, setForm] = useState({ email: "", password: "", remember: true });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (user) router.push(user.is_admin ? "/admin" : "/home");
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) { setError("Please enter email and password."); return; }
    setLoading(true);
    setError("");
    const result = await login(form.email, form.password, form.remember);
    setLoading(false);
    if (!result.success) setError(result.error || "Login failed.");
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
          <h1 className="text-2xl font-bold text-gray-800">Welcome back!</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to continue your preparation</p>
        </div>

        <div className="card shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t("email")}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">✉️</span>
                <input
                  type="email" className="input-field pl-10"
                  placeholder="you@example.com" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t("password")}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔒</span>
                <input
                  type={showPass ? "text" : "password"} className="input-field pl-10 pr-10"
                  placeholder="Your password" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2">
              <input type="checkbox" id="remember" checked={form.remember}
                onChange={(e) => setForm({ ...form, remember: e.target.checked })}
                className="w-4 h-4 accent-green-600 rounded"
              />
              <label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer">{t("rememberMe")}</label>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full text-base py-3.5">
              {loading ? (
                <span className="flex items-center gap-2"><span className="animate-spin">⟳</span> Signing in...</span>
              ) : (
                <span>{t("signIn")}</span>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-600 mt-6 text-sm">
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="text-green-700 font-semibold hover:underline">{t("signUp")}</Link>
        </p>
      </div>
    </div>
  );
}
