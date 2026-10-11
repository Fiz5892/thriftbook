import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import { BookCard, CARD_SELECT, type CardListing } from "@/components/book-card";
import { Mascot } from "@/components/mascot";
import { Asterisk, BookStack, Sparkle, Squiggle, Starburst } from "@/components/decor";
import { Parallax, Reveal, ScrollMarquee, ScrollTrail, type TrailStep } from "@/components/motion";

const icon = (d: string) => (
  <svg viewBox="0 0 24 24" className="size-8" aria-hidden="true">
    <path d={d} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const STEPS: TrailStep[] = [
  {
    title: "Masuk pakai akun UM",
    body: "Cukup akun Google kampus. Nggak perlu bikin password baru, dan semua yang di sini warga UM.",
    tone: "bg-pink",
    icon: icon("M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM5 20c1-4 4-6 7-6s6 2 7 6M17 3l2 2 3-3"),
  },
  {
    title: "Cari atau pajang buku",
    body: "Saring per prodi, mata kuliah, dan semester. Posting cukup foto bukunya dan isi singkat.",
    tone: "bg-mint",
    icon: icon("M4 5h7v14H4zM13 5h7v14h-7zM7 9h1M16 9h1"),
  },
  {
    title: "Chat lewat WhatsApp",
    body: "Ketuk tombol chat, pesannya sudah terisi judul buku. Nomor nggak dipajang di halaman.",
    tone: "bg-lilac",
    icon: icon("M4 18l1.5-4A7 7 0 1 1 9 19.5L4 18ZM9 11h6M9 14h4"),
  },
  {
    title: "Ketemuan COD di kampus",
    body: "Cek bukunya dulu, baru bayar. Kalau sudah laku, tandai selesai biar nggak ditanya lagi.",
    tone: "bg-orange",
    icon: icon("M3 12h4l3-3 4 4 3-3h4M7 12l3 3M14 13l2 2"),
  },
];

const WAYS = [
  { title: "Jual", body: "Pasang harga sendiri, mulai Rp1.000. Pembeli datang dari prodi yang butuh bukumu.", tone: "bg-orange" },
  { title: "Hibah", body: "Buku nganggur di rak? Kasih ke adik tingkat yang sedang butuh, gratis.", tone: "bg-mint" },
  { title: "Tukar", body: "Tulis buku apa yang kamu mau, tukar dengan buku yang sudah selesai kamu pakai.", tone: "bg-lilac" },
];

/** Landing page untuk tamu: memperkenalkan thriftbook, lalu mengarahkan ke katalog atau masuk. */
export async function Landing({ supabase }: { supabase: SupabaseClient }) {
  const [{ count: activeCount }, { count: wantedCount }, { data: recent }] = await Promise.all([
    supabase.from("listings").select("id", { count: "exact", head: true }).eq("status", "aktif").is("hidden_at", null),
    supabase.from("book_requests").select("id", { count: "exact", head: true }).eq("status", "terbuka").is("hidden_at", null),
    supabase
      .from("listings").select(CARD_SELECT)
      .eq("status", "aktif").is("hidden_at", null)
      .order("created_at", { ascending: false }).limit(4),
  ]);
  const items = (recent ?? []) as unknown as CardListing[];

  return (
    <main className="flex-1">
      {/* ---------------- Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-10 md:grid-cols-[1.15fr_0.85fr] md:pt-16">
        <div>
          <span className="badge bg-paper">Khusus sivitas Universitas Negeri Malang</span>
          <h1 className="mt-5 text-4xl font-extrabold uppercase sm:text-5xl lg:text-6xl">
            Buku kuliah bekas,{" "}
            <span className="relative inline-block">
              <span className="relative z-10">dari kakak</span>
              <span aria-hidden="true" className="absolute inset-x-0 bottom-1 z-0 h-4 -rotate-1 rounded-sm bg-yellow-400 md:h-5" />
            </span>{" "}
            tingkat.
          </h1>
          <p className="mt-5 max-w-lg text-lg">
            Jual, hibah, atau tukar buku yang sudah nggak kamu pakai. Yang butuh tinggal cari per
            prodi dan mata kuliah, lalu chat dan ketemuan COD di kampus.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link href="/cari" className="btn btn-yellow">Lihat buku yang ada</Link>
            <Link href="/masuk" className="btn btn-ink">Masuk pakai akun UM</Link>
          </div>
          <Squiggle className="mt-6 hidden w-48 md:block" />
        </div>

        <div className="relative mx-auto w-full max-w-sm">
          <Parallax speed={0.08} rotate={0.01}>
            <div className="card card-lg relative aspect-square rotate-2 overflow-hidden bg-lilac">
              <BookStack className="absolute bottom-5 left-1/2 w-4/5 -translate-x-1/2" />
              <Mascot
                mood="wave"
                title="Tibo, maskot thriftbook, melambai"
                className="anim-bob absolute bottom-[27%] left-1/2 w-3/5 -translate-x-1/2"
              />
            </div>
          </Parallax>
          <Starburst className="absolute -bottom-8 -left-1 size-24 -rotate-12 md:-left-8 md:size-32">Gratis buat sivitas UM</Starburst>
          <Sparkle className="absolute -bottom-4 right-6 size-8" />
        </div>
      </section>

      {/* ---------------- Pita berjalan */}
      {/* Dua pita sejajar (miring sama) supaya tidak saling menutup teks */}
      {/* Pembungkus memotong ujung pita yang miring agar halaman tidak bisa digeser ke samping */}
      <div className="overflow-hidden py-4">
        <div className="-mx-4 -rotate-1">
          <ScrollMarquee items={["jual", "hibah", "tukar", "COD di kampus", "cari per prodi", "pasang Dicari"]} className="bg-yellow-400" />
          <ScrollMarquee reverse items={["buku kuliah bekas", "dari kakak tingkat", "lintas angkatan", "lintas jurusan"]} className="-mt-0.5 bg-paper" />
        </div>
      </div>

      {/* ---------------- Kenapa */}
      <section className="mx-auto max-w-6xl px-4 pt-20">
        <Reveal>
          <h2 className="max-w-2xl text-3xl font-extrabold uppercase md:text-4xl">Kenapa nggak lewat menfess aja?</h2>
          <p className="mt-3 max-w-2xl">
            Banyak yang cari dan jual buku bekas lewat menfess, tapi postingannya cepat tenggelam dan
            susah dicari lagi. Thriftbook menyimpan semuanya di satu tempat yang rapi.
          </p>
        </Reveal>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <Reveal>
            <div className="card card-lg h-full p-6">
              <p className="font-display text-lg font-extrabold">Lewat menfess</p>
              <ul className="mt-3 space-y-2">
                <li className="flex gap-3"><span aria-hidden="true" className="font-bold">✕</span>Tenggelam dalam hitungan jam</li>
                <li className="flex gap-3"><span aria-hidden="true" className="font-bold">✕</span>Susah dicari per mata kuliah</li>
                <li className="flex gap-3"><span aria-hidden="true" className="font-bold">✕</span>DM tetap datang walau buku sudah laku</li>
              </ul>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="card card-lg relative h-full bg-mint p-6">
              <p className="font-display text-lg font-extrabold">Lewat thriftbook</p>
              <ul className="mt-3 space-y-2">
                <li className="flex gap-3"><span aria-hidden="true" className="font-bold">✓</span>Tersusun per prodi, mata kuliah, dan semester</li>
                <li className="flex gap-3"><span aria-hidden="true" className="font-bold">✓</span>Status dipesan dan selesai, jadi nggak ada chat sia-sia</li>
                <li className="flex gap-3"><span aria-hidden="true" className="font-bold">✓</span>Belum ada bukunya? Pasang Dicari selama 30 hari</li>
              </ul>
              <Asterisk className="absolute -right-3 -top-4 size-10 rotate-12" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------- Cara kerja: jejak scroll */}
      <section className="mx-auto max-w-6xl px-4 pt-24">
        <Reveal>
          <h2 className="text-3xl font-extrabold uppercase md:text-4xl">Cara kerjanya</h2>
          <p className="mt-2">Empat langkah, dari rak kakak tingkat ke tasmu.</p>
        </Reveal>
        <ScrollTrail steps={STEPS} />
      </section>

      {/* ---------------- Tiga cara */}
      <section className="mx-auto max-w-6xl px-4 pt-24">
        <Reveal>
          <h2 className="text-3xl font-extrabold uppercase md:text-4xl">Mau diapakan bukumu?</h2>
        </Reveal>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {WAYS.map((w, i) => (
            <Reveal key={w.title} delay={i * 100}>
              <div className={`card card-lg relative h-full p-6 ${w.tone}`}>
                <p className="font-display text-2xl font-extrabold uppercase">{w.title}</p>
                <p className="mt-2">{w.body}</p>
                <Asterisk className="absolute bottom-4 right-4 size-9 opacity-80" />
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------- Katalog nyata */}
      {items.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-24">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl font-extrabold uppercase md:text-4xl">Baru diposting</h2>
                <p className="mt-2">
                  {activeCount ?? 0} buku tersedia
                  {wantedCount ? ` · ${wantedCount} permintaan Dicari terbuka` : ""}
                </p>
              </div>
              <Link href="/cari" className="btn btn-outline">Lihat semua buku</Link>
            </div>
          </Reveal>
          <ul className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            {items.map((b) => <li key={b.id}><BookCard b={b} /></li>)}
          </ul>
        </section>
      )}

      {/* ---------------- Aman */}
      <section className="mx-auto max-w-6xl px-4 pt-24">
        <Reveal>
          <h2 className="text-3xl font-extrabold uppercase md:text-4xl">Biar tetap aman</h2>
        </Reveal>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <Reveal>
            <div className="card card-lg h-full p-6">
              <p className="font-display font-extrabold">Nomor nggak dipajang</p>
              <p className="mt-2 text-sm">Nomor WhatsApp hanya terkirim ke mahasiswa UM yang login dan mengetuk tombol chat, maksimal 30 orang per hari.</p>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div className="card card-lg h-full p-6">
              <p className="font-display font-extrabold">Cek dulu, baru bayar</p>
              <p className="mt-2 text-sm">Ketemu di area ramai kampus. Jangan transfer DP ke siapa pun sebelum buku di tangan.</p>
            </div>
          </Reveal>
          <Reveal delay={200}>
            <div className="card card-lg h-full p-6">
              <p className="font-display font-extrabold">Ada yang aneh? Laporkan</p>
              <p className="mt-2 text-sm">Listing fotokopi, penipuan, atau spam bisa dilaporkan. Tim kami meninjau dan bisa memblokir akunnya.</p>
            </div>
          </Reveal>
        </div>
        <Link href="/panduan-cod" className="btn-link mt-4">Baca panduan COD lengkap</Link>
      </section>

      {/* ---------------- Ajakan akhir */}
      <section className="mx-auto max-w-6xl px-4 pt-24">
        <Reveal>
          <div className="card card-lg relative overflow-hidden bg-navy-900 p-8 text-white md:p-12">
            <div className="relative z-10 max-w-xl">
              <h2 className="text-3xl font-extrabold uppercase md:text-4xl">Rak bukumu bisa jadi rak orang lain.</h2>
              <p className="mt-3 text-white/90">Masuk pakai akun Google kampus, lalu pajang buku pertamamu. Gratis, tanpa komisi.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/masuk" className="btn btn-yellow">Masuk pakai akun UM</Link>
                <Link href="/cari" className="btn btn-outline">Lihat buku dulu</Link>
              </div>
            </div>
            <Mascot mood="cheer" className="absolute -bottom-6 right-4 hidden w-48 md:block lg:w-56" />
          </div>
        </Reveal>
      </section>
    </main>
  );
}
