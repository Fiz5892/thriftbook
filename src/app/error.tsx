"use client";

import { useEffect } from "react";
import { Mascot } from "@/components/mascot";

/** Batas error rute. Kode referensi pendek membantu pengguna melapor tanpa membocorkan detail (NFR-32). */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const code = `ERR-${(error.digest ?? "0000").slice(0, 4).toUpperCase()}`;

  useEffect(() => {
    console.error(code, error.message);
  }, [code, error]);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
      <Mascot mood="oops" className="mb-4 w-36" />
      <h1 className="text-2xl text-ink font-extrabold">Ada yang error di sisi kami.</h1>
      <p className="mt-2">Bukan salahmu. Coba lagi sebentar.</p>
      <p className="mt-1 text-sm text-muted">Kode: {code}</p>
      <button
        onClick={reset}
        className="btn btn-yellow mt-6 w-fit"
      >
        Coba lagi
      </button>
    </main>
  );
}
