"use client";
import { useEffect, useState } from "react";
import { triggerInstall } from "@/contexts/AuthContext";

export default function PWAInstallPrompt() {
  const [show, setShow]         = useState(false);
  const [installed, setInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Already installed as standalone PWA
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }

    // User permanently dismissed
    if (localStorage.getItem("eee_pwa_dismissed") === "1") return;

    // Show when install prompt is ready AND user just signed in
    const onInstallReady = () => {
      // Store that prompt is available
      localStorage.setItem("eee_install_ready", "1");
    };

    const onShowInstall = () => {
      if (localStorage.getItem("eee_install_ready") === "1" && !installed) {
        setShow(true);
      }
    };

    window.addEventListener("eee-install-ready", onInstallReady);
    window.addEventListener("eee-show-install",  onShowInstall);
    window.addEventListener("appinstalled", () => { setInstalled(true); setShow(false); });

    return () => {
      window.removeEventListener("eee-install-ready", onInstallReady);
      window.removeEventListener("eee-show-install",  onShowInstall);
    };
  }, [installed]);

  if (!show || installed) return null;

  const handleInstall = async () => {
    setInstalling(true);
    const accepted = await triggerInstall();
    setInstalling(false);
    setShow(false);
    if (accepted) setInstalled(true);
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem("eee_pwa_dismissed", "1");
  };

  return (
    <div className="fixed bottom-24 left-3 right-3 z-50 animate-slide-up">
      <div className="bg-white rounded-2xl shadow-2xl border border-green-100 p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-base flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#16a34a,#15803d)" }}>
            EEE
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-gray-800 text-sm">Install Exit Exam Ethiopia</div>
            <div className="text-xs text-gray-500 mt-0.5">
              Add to home screen — works offline, loads instantly
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={handleInstall} disabled={installing}
                className="flex-1 py-2 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-60"
                style={{ background: "linear-gradient(135deg,#16a34a,#15803d)" }}>
                {installing ? "Installing…" : "📲 Install"}
              </button>
              <button onClick={handleDismiss}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-500 text-sm font-medium hover:bg-gray-50">
                Later
              </button>
            </div>
          </div>
          <button onClick={handleDismiss} className="text-gray-400 hover:text-gray-600 flex-shrink-0 text-lg leading-none">
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
