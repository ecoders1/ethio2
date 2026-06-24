"use client";
import { useEffect, useState } from "react";
import { triggerInstall } from "@/contexts/AuthContext";

type Platform = "android" | "ios" | "desktop" | "unknown";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true)
  );
}

export default function PWAInstallPrompt() {
  const [show, setShow]           = useState(false);
  const [platform, setPlatform]   = useState<Platform>("unknown");
  const [installing, setInstalling] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    const p = detectPlatform();
    setPlatform(p);

    if (isStandalone()) { setInstalled(true); return; }
    if (localStorage.getItem("eee_pwa_dismissed") === "2") return;

    const onInstallReady = () => localStorage.setItem("eee_install_ready", "1");

    const onShowInstall = () => {
      if (isStandalone()) return;
      if (localStorage.getItem("eee_pwa_dismissed") === "2") return;
      // iOS shows guide, others show native prompt
      if (p === "ios") { setShow(true); return; }
      if (localStorage.getItem("eee_install_ready") === "1") setShow(true);
    };

    window.addEventListener("eee-install-ready", onInstallReady);
    window.addEventListener("eee-show-install",  onShowInstall);
    window.addEventListener("appinstalled", () => { setInstalled(true); setShow(false); });

    return () => {
      window.removeEventListener("eee-install-ready", onInstallReady);
      window.removeEventListener("eee-show-install",  onShowInstall);
    };
  }, []);

  if (!show || installed) return null;

  const handleInstall = async () => {
    if (platform === "ios") { setShowIOSGuide(true); return; }
    setInstalling(true);
    const accepted = await triggerInstall();
    setInstalling(false);
    setShow(false);
    if (accepted) setInstalled(true);
  };

  const handleDismiss = () => {
    setShow(false);
    setShowIOSGuide(false);
    localStorage.setItem("eee_pwa_dismissed", "2");
  };

  // Platform labels
  const platformLabel = {
    android: "Android",
    ios: "iPhone / iPad",
    desktop: "Windows / Mac / Linux",
    unknown: "your device",
  }[platform];

  const installIcon = platform === "ios" ? "📲" : platform === "android" ? "📲" : "💻";

  return (
    <>
      {/* Main install banner */}
      <div className="fixed bottom-20 left-3 right-3 z-50 animate-slide-up max-w-lg mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl border border-green-100 overflow-hidden">
          {/* Green header */}
          <div className="px-4 py-3 flex items-center justify-between"
            style={{ background: "linear-gradient(135deg,#16a34a,#15803d)" }}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center font-black text-white text-xs">
                EE
              </div>
              <span className="text-white font-bold text-sm">Install Exit Exam Ethiopia</span>
            </div>
            <button onClick={handleDismiss} className="text-white/70 hover:text-white text-xl leading-none">×</button>
          </div>

          <div className="p-4">
            <p className="text-gray-600 text-sm mb-1">
              {installIcon} Install on <strong>{platformLabel}</strong> for the best experience.
            </p>
            <ul className="text-xs text-gray-500 space-y-0.5 mb-4 list-none">
              <li>✅ Works offline after first login</li>
              <li>✅ Loads instantly like a native app</li>
              <li>✅ No app store needed</li>
              <li>✅ Saves exam data on your device</li>
            </ul>

            {/* iOS specific */}
            {platform === "ios" && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-3 text-xs text-blue-800">
                <p className="font-bold mb-1">How to install on iPhone/iPad:</p>
                <ol className="list-decimal list-inside space-y-0.5">
                  <li>Tap the <strong>Share</strong> button (□↑) at the bottom of Safari</li>
                  <li>Scroll down and tap <strong>&quot;Add to Home Screen&quot;</strong></li>
                  <li>Tap <strong>Add</strong> — done!</li>
                </ol>
              </div>
            )}

            {/* Desktop specific */}
            {platform === "desktop" && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-3 text-xs text-gray-600">
                <p className="font-bold text-gray-700 mb-1">Also installable via browser:</p>
                <p>Look for the <strong>⊕ Install</strong> icon in your browser address bar (Chrome / Edge)</p>
              </div>
            )}

            <div className="flex gap-2">
              {platform !== "ios" ? (
                <button onClick={handleInstall} disabled={installing}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60 transition-all"
                  style={{ background: "linear-gradient(135deg,#16a34a,#15803d)" }}>
                  {installing ? "Installing…" : `${installIcon} Install Now`}
                </button>
              ) : (
                <button onClick={() => setShowIOSGuide(!showIOSGuide)}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold"
                  style={{ background: "linear-gradient(135deg,#16a34a,#15803d)" }}>
                  📖 Show Steps
                </button>
              )}
              <button onClick={handleDismiss}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm font-medium hover:bg-gray-50">
                Later
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* iOS step-by-step guide overlay */}
      {showIOSGuide && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-end justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 animate-slide-up">
            <h3 className="font-bold text-gray-800 text-lg mb-4 text-center">
              📲 Install on iPhone / iPad
            </h3>
            <div className="space-y-4">
              {[
                { step: "1", icon: "□↑", desc: "Tap the Share button at the bottom of Safari" },
                { step: "2", icon: "⊞", desc: 'Scroll down and tap "Add to Home Screen"' },
                { step: "3", icon: "✓", desc: 'Tap "Add" in the top right corner' },
                { step: "4", icon: "🏠", desc: "EEE app icon appears on your home screen!" },
              ].map(s => (
                <div key={s.step} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 font-bold text-sm flex items-center justify-center flex-shrink-0">
                    {s.step}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{s.icon}</span>
                    <span className="text-sm text-gray-700">{s.desc}</span>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => { setShowIOSGuide(false); setShow(false); localStorage.setItem("eee_pwa_dismissed","2"); }}
              className="btn-primary w-full mt-5 py-3">
              Got it — I&apos;ll install it ✓
            </button>
          </div>
        </div>
      )}
    </>
  );
}
