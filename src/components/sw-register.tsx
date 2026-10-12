"use client";

import { useEffect } from "react";

/** Daftarkan service worker hanya di produksi agar tidak mengganggu HMR saat dev. */
export function SwRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    // Daftarkan saat browser senggang supaya tidak bersaing dengan hidrasi halaman
    const run = () => navigator.serviceWorker.register("/sw.js").catch(() => {});
    if ("requestIdleCallback" in window) window.requestIdleCallback(run, { timeout: 5000 });
    else setTimeout(run, 3000);
  }, []);
  return null;
}
