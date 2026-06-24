"use client";
import React, {
  createContext, useContext, useState, useEffect, useCallback,
} from "react";
import { generateDeviceId } from "@/lib/auth";

interface User {
  id: string; full_name: string; email: string;
  is_admin: boolean; device_id: string | null;
}
interface AuthContextType {
  user: User | null;
  loading: boolean;
  deviceId: string;
  login:    (email: string, password: string, remember: boolean) => Promise<{ success: boolean; error?: string }>;
  register: (fullName: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout:   () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Tell SW to cache exam data for offline use
function cacheExamData(userId: string) {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  const alreadyCached = localStorage.getItem(`eee_cached_${userId}`);
  if (alreadyCached) return;
  navigator.serviceWorker.ready.then(reg => {
    reg.active?.postMessage({ type: "CACHE_USER_DATA", userId });
    localStorage.setItem(`eee_cached_${userId}`, "1");
  }).catch(() => {});
}

// Trigger PWA install prompt
let deferredInstallPrompt: Event & { prompt?: () => Promise<void>; userChoice?: Promise<{ outcome: string }> } | null = null;

function setupInstallPrompt() {
  if (typeof window === "undefined") return;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredInstallPrompt = e as typeof deferredInstallPrompt;
    // Dispatch custom event so components can listen
    window.dispatchEvent(new CustomEvent("eee-install-ready"));
  });
}

export async function triggerInstall(): Promise<boolean> {
  if (!deferredInstallPrompt?.prompt) return false;
  await deferredInstallPrompt.prompt();
  const result = await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  return result?.outcome === "accepted";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [deviceId, setDeviceId] = useState("");

  useEffect(() => {
    setDeviceId(generateDeviceId());
    setupInstallPrompt();
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        if (data.user) cacheExamData(data.user.id);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refreshUser(); }, [refreshUser]);

  const login = async (email: string, password: string, remember: boolean) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, remember, deviceId }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        if (data.user) cacheExamData(data.user.id);
        // Trigger install prompt after login
        setTimeout(() => window.dispatchEvent(new CustomEvent("eee-show-install")), 1500);
        return { success: true };
      }
      return { success: false, error: data.error || "Login failed" };
    } catch {
      return { success: false, error: "Network error. Please try again." };
    }
  };

  const register = async (fullName: string, email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password, deviceId }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        if (data.user) cacheExamData(data.user.id);
        // Trigger install prompt after registration
        setTimeout(() => window.dispatchEvent(new CustomEvent("eee-show-install")), 1500);
        return { success: true };
      }
      return { success: false, error: data.error || "Registration failed" };
    } catch {
      return { success: false, error: "Network error. Please try again." };
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, deviceId, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
