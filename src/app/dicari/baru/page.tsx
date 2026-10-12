import { requireCompleteUser } from "@/lib/session";
import { getPrograms } from "@/lib/public-data";
import { RequestForm } from "./form";

export default async function DicariBaru({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; course?: string }>;
}) {
  const { q, course } = await searchParams;
  const [, programs] = await Promise.all([requireCompleteUser("/dicari/baru"), getPrograms()]);

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6">
      <h1 className="text-2xl text-ink font-extrabold">Pasang Dicari</h1>
      <p className="mt-1 text-muted">
        Pemilik buku yang menemukan Dicari-mu bisa langsung menghubungimu lewat WhatsApp. Masa
        aktifnya 30 hari.
      </p>
      <RequestForm
        programs={programs}
        initial={{ title: (q ?? "").slice(0, 120), course: (course ?? "").slice(0, 80) }}
      />
    </main>
  );
}
