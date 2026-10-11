import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BookCard, CARD_SELECT, type CardListing } from "@/components/book-card";

export default async function Beranda() {
  const supabase = await createClient();

  const [{ data: programs }, { data: counts }, { data: recent }] = await Promise.all([
    supabase.from("study_programs").select("id, slug, short_name").eq("is_active", true),
    supabase.from("listings").select("study_program_id").eq("status", "aktif").is("hidden_at", null),
    supabase
      .from("listings").select(CARD_SELECT)
      .eq("status", "aktif").is("hidden_at", null)
      .order("created_at", { ascending: false }).limit(10),
  ]);

  const perProdi = new Map<number, number>();
  for (const c of counts ?? []) {
    perProdi.set(c.study_program_id, (perProdi.get(c.study_program_id) ?? 0) + 1);
  }
  const topProgram = (programs ?? [])
    .map((p) => ({ ...p, n: perProdi.get(p.id) ?? 0 }))
    .filter((p) => p.n > 0)
    .sort((a, b) => b.n - a.n)
    .slice(0, 6);
  const items = (recent ?? []) as unknown as CardListing[];

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
      <p className="text-2xl font-bold text-navy-900">thriftbook.</p>

      <section className="mt-4 rounded-2xl bg-navy-600 p-5 text-white">
        <span className="inline-block rounded-full bg-yellow-400 px-3 py-1 text-xs font-semibold text-navy-900">
          jual · hibah · tukar
        </span>
        <h1 className="mt-3 text-2xl font-bold">Buku kuliah bekas, dari kakak tingkat.</h1>
      </section>

      <form action="/cari" className="mt-4">
        <input
          name="q"
          aria-label="Cari judul atau mata kuliah"
          placeholder="Cari judul atau mata kuliah"
          className="min-h-11 w-full rounded-full border border-line px-4"
        />
      </form>

      {items.length === 0 ? (
        <section className="mt-8 rounded-2xl border border-line p-6">
          <h2 className="font-semibold">Raknya masih kosong.</h2>
          <p className="mt-1 text-muted">Punya buku semester lalu? Jadi yang pertama.</p>
          <Link href="/jual" className="mt-4 inline-block min-h-11 rounded-full bg-yellow-400 px-5 py-3 font-semibold text-navy-900">
            Jual bukumu
          </Link>
        </section>
      ) : (
        <>
          {topProgram.length > 0 && (
            <section className="mt-8">
              <h2 className="font-semibold">Cari per program studi</h2>
              <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {topProgram.map((p) => (
                  <li key={p.id}>
                    <Link href={`/cari?prodi=${p.slug}`} className="block rounded-xl border border-line p-3">
                      <span className="block text-sm font-semibold text-ink">{p.short_name}</span>
                      <span className="text-xs text-muted">{p.n} buku</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mt-8">
            <div className="flex items-baseline justify-between">
              <h2 className="font-semibold">Baru diposting</h2>
              <Link href="/cari" className="text-sm font-semibold text-navy-600">Lihat semua</Link>
            </div>
            <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {items.map((b) => <li key={b.id}><BookCard b={b} /></li>)}
            </ul>
          </section>
        </>
      )}
    </main>
  );
}
