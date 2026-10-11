"use client";

import { useEffect } from "react";

/** Daftarkan service worker hanya di produksi agar tidak mengganggu HMR saat dev. */
export function SwRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}
