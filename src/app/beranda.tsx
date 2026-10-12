import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import { BookCard } from "@/components/book-card";
import { getListingStats, getOpenRequests, getPrograms, getRecentListings } from "@/lib/public-data";
import { Mascot } from "@/components/mascot";
import { Squiggle } from "@/components/decor";
import { timeAgo } from "@/lib/format";

const TONES = ["bg-pink", "bg-mint", "bg-lilac", "bg-orange", "bg-yellow-400", "bg-paper"];
const initials = (s: string) =>
  s.replace(/[^A-Za-z ]/g, " ").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

/** Beranda untuk pengguna yang sudah masuk: katalog terbaru, per prodi, dan Dicari terbaru. */
export async function Beranda({ supabase, userId }: { supabase: SupabaseClient; userId: string }) {
  // Hanya nama pengguna yang diambil per permintaan; sisanya data publik ter-cache
  const [{ data: me }, programs, stats, recent, open] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", userId).maybeSingle(),
    getPrograms(),
    getListingStats(),
    getRecentListings(10),
    getOpenRequests(3),
  ]);
  const wanted = open.items;

  const topProgram = programs
    .map((p) => ({ ...p, n: stats.perProgram[p.id] ?? 0 }))
    .filter((p) => p.n > 0)
    .sort((a, b) => b.n - a.n)
    .slice(0, 6);
  const items = recent;
  const name = me?.display_name?.split(" ")[0];

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:py-10">
      <section className="card card-lg relative overflow-hidden bg-yellow-400 p-6 md:p-10">
        <div className="relative z-10 max-w-xl">
          <p className="font-semibold">{name ? `Halo, ${name}!` : "Halo!"}</p>
          <h1 className="mt-2 text-3xl font-extrabold uppercase md:text-5xl">
            Buku kuliah bekas, dari kakak tingkat.
          </h1>
          <form action="/cari" className="mt-6 flex gap-2">
            <input
              name="q"
              aria-label="Cari judul atau mata kuliah"
              placeholder="Cari judul atau mata kuliah"
              className="input input-pill flex-1"
            />
            <button className="btn btn-ink">Cari</button>
          </form>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/jual" className="btn btn-outline btn-sm">Jual bukumu</Link>
            <Link href="/dicari/baru" className="btn btn-outline btn-sm">Pasang Dicari</Link>
          </div>
        </div>
        <Mascot mood="wave" animate className="anim-bob absolute -bottom-6 right-2 hidden w-56 md:block lg:right-10 lg:w-64" />
        <Squiggle className="absolute right-64 top-6 hidden w-40 lg:block" />
      </section>

      {items.length === 0 ? (
        <section className="card card-lg mt-8 flex flex-col items-center gap-4 p-8 text-center md:flex-row md:text-left">
          <Mascot mood="search" className="w-32 shrink-0" />
          <div>
            <h2 className="text-xl font-extrabold">Raknya masih kosong.</h2>
            <p className="mt-1 text-muted">Punya buku semester lalu? Jadi yang pertama.</p>
            <Link href="/jual" className="btn btn-yellow mt-4">Jual bukumu</Link>
          </div>
        </section>
      ) : (
        <>
          {topProgram.length > 0 && (
            <section className="mt-10">
              <h2 className="text-xl font-extrabold">Cari per program studi</h2>
              <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {topProgram.map((p, i) => (
                  <li key={p.id}>
                    <Link href={`/cari?prodi=${p.slug}`} className="card flex h-full items-center gap-3 p-3">
                      <span className={`font-display grid size-10 shrink-0 place-items-center rounded-full border-2 border-ink text-xs font-extrabold ${TONES[i % TONES.length]}`}>
                        {initials(p.short_name)}
                      </span>
                      <span className="min-w-0">
                        <span className="line-clamp-2 block text-sm font-semibold leading-snug">{p.short_name}</span>
                        <span className="text-xs text-muted">{p.n} buku</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mt-10">
            <div className="flex items-end justify-between gap-4">
              <h2 className="text-xl font-extrabold">Baru diposting</h2>
              <Link href="/cari" className="btn-link text-sm">Lihat semua</Link>
            </div>
            <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {items.map((b, i) => <li key={b.id}><BookCard b={b} priority={i < 2} /></li>)}
            </ul>
          </section>
        </>
      )}

      {wanted.length > 0 && (
        <section className="mt-10">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-xl font-extrabold">Lagi dicari orang</h2>
            <Link href="/dicari" className="btn-link text-sm">Lihat semua</Link>
          </div>
          <ul className="mt-4 grid gap-3 md:grid-cols-3">
            {wanted.map((r, i) => (
              <li key={r.id}>
                <Link href={`/dicari/${r.id}`} className={`card flex h-full flex-col p-4 ${TONES[(i + 2) % TONES.length]}`}>
                  <span className="text-xs font-semibold uppercase">Dicari</span>
                  <span className="mt-1 font-semibold">{r.title}</span>
                  <span className="mt-auto pt-2 text-xs">{r.course_name_snapshot} · {timeAgo(r.created_at)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
