"use client";

/** Cadangan terakhir jika layout root sendiri gagal dirender. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const code = `ERR-${(error.digest ?? "0000").slice(0, 4).toUpperCase()}`;
  return (
    <html lang="id">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: 24, maxWidth: 420, margin: "0 auto" }}>
        <h1 style={{ color: "#1a0b7a" }}>Ada yang error di sisi kami.</h1>
        <p>Bukan salahmu. Coba lagi sebentar.</p>
        <p style={{ color: "#5d5d75", fontSize: 14 }}>Kode: {code}</p>
        <button
          onClick={reset}
          style={{ minHeight: 44, borderRadius: 999, border: 0, background: "#fdd94e", color: "#1a0b7a", fontWeight: 600, padding: "0 24px" }}
        >
          Coba lagi
        </button>
      </body>
    </html>
  );
}
