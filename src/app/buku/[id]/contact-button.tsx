"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ContactButton({
  listingId,
  endpoint,
  label = "Chat penjual via WhatsApp",
  loginNext,
}: {
  listingId: string;
  endpoint?: string;
  label?: string;
  loginNext?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function open() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(endpoint ?? `/api/listings/${listingId}/contact`, { method: "POST" });
      const json = await res.json();
      if (res.status === 401) {
        router.push(`/masuk?next=${encodeURIComponent(loginNext ?? `/buku/${listingId}`)}`);
        return;
      }
      if (!res.ok) {
        setMsg(json.message ?? "Gagal membuka kontak. Coba lagi sebentar.");
        return;
      }
      // Nomor hanya ada di URL ini, dibentuk server per permintaan (SEC-21)
      window.open(json.url, "_blank", "noopener,noreferrer");
    } catch {
      setMsg("Koneksimu putus. Cek sinyal, lalu coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        onClick={open}
        disabled={busy}
        className="min-h-12 w-full rounded-full bg-wa px-6 py-3 font-semibold text-white disabled:opacity-60"
      >
        {busy ? "Membuka WhatsApp…" : label}
      </button>
      {msg && <p role="alert" className="mt-2 text-sm text-danger">{msg}</p>}
    </div>
  );
}
