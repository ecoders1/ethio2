"use client";
import { useEffect } from "react";

// URLs to pre-cache for offline use after login
const OFFLINE_URLS = [
  "/api/departments",
  "/api/exams",
  "/api/settings",
];

export default function PWARegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js")
      .then(reg => {
        console.log("SW registered:", reg.scope);

        // Tell SW to cache exam data for offline
        const sw = reg.active || reg.installing || reg.waiting;
        if (sw) {
          sw.postMessage({ type: "CACHE_EXAM_DATA", urls: OFFLINE_URLS });
        }

        // Also send after SW becomes active
        navigator.serviceWorker.ready.then(readyReg => {
          readyReg.active?.postMessage({ type: "CACHE_EXAM_DATA", urls: OFFLINE_URLS });
        });
      })
      .catch(err => console.warn("SW registration failed:", err));
  }, []);

  return null;
}
