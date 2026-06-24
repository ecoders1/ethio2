"use client";
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Already installed as PWA
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }

    // Was already dismissed
    if (localStorage.getItem("eee_pwa_dismissed")) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => {
      setInstalled(true);
      setShow(false);
    });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setShow(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem("eee_pwa_dismissed", "1");
  };

  if (!show || installed) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-slide-up">
      <div className="bg-white rounded-2xl shadow-2xl border border-green-100 p-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-lg flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#16a34a,#15803d)" }}>
          EEE
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-gray-800 text-sm">Install Exit Exam Ethiopia</div>
          <div className="text-xs text-gray-500">Add to home screen for offline access</div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={handleDismiss}
            className="text-xs px-3 py-1.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 font-medium">
            Later
          </button>
          <button onClick={handleInstall}
            className="text-xs px-3 py-1.5 rounded-xl text-white font-semibold"
            style={{ background: "linear-gradient(135deg,#16a34a,#15803d)" }}>
            Install
          </button>
        </div>
      </div>
    </div>
  );
}
