import { requireCompleteUser } from "@/lib/session";
import { RequestForm } from "./form";

export default async function DicariBaru({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; course?: string }>;
}) {
  const { q, course } = await searchParams;
  const { supabase } = await requireCompleteUser("/dicari/baru");
  const { data: programs } = await supabase
    .from("study_programs").select("id, short_name").eq("is_active", true).order("short_name");

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6">
      <h1 className="text-2xl text-ink font-extrabold">Pasang Dicari</h1>
      <p className="mt-1 text-muted">
        Pemilik buku yang menemukan Dicari-mu bisa langsung menghubungimu lewat WhatsApp. Masa
        aktifnya 30 hari.
      </p>
      <RequestForm
        programs={programs ?? []}
        initial={{ title: (q ?? "").slice(0, 120), course: (course ?? "").slice(0, 80) }}
      />
    </main>
  );
}
