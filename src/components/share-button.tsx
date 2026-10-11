"use client";

import { useState } from "react";
import { IconShare } from "./icons";

/** Web Share API dengan cadangan salin tautan (AC-21.3). */
export function ShareButton({
  title,
  path,
  iconOnly = false,
}: {
  title: string;
  path: string;
  iconOnly?: boolean;
}) {
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
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={share}
        className={iconOnly ? "btn btn-icon btn-outline" : "btn btn-outline"}
        aria-label={iconOnly ? "Bagikan" : undefined}
        title={iconOnly ? "Bagikan" : undefined}
      >
        <IconShare />
        {!iconOnly && "Bagikan"}
      </button>
      {msg && <span role="status" className="text-sm text-muted">{msg}</span>}
    </span>
  );
}
