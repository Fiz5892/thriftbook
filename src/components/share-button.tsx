"use client";

import { useState } from "react";

/** Web Share API dengan cadangan salin tautan (AC-21.3). */
export function ShareButton({ title, path }: { title: string; path: string }) {
  const [msg, setMsg] = useState<string | null>(null);

  async function share() {
    const url = `${window.location.origin}${path}`;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setMsg("Tautan disalin.");
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return; // pengguna membatalkan
      setMsg("Gagal membagikan. Salin tautan dari bilah alamat, ya.");
    }
  }

  return (
    <div>
      <button
        onClick={share}
        className="btn btn-outline"
      >
        Bagikan
      </button>
      {msg && <p role="status" className="mt-2 text-sm text-muted">{msg}</p>}
    </div>
  );
}
