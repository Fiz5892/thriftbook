import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BookCard, CARD_SELECT, type CardListing } from "@/components/book-card";
import {
  CONDITIONS, CONDITION_LABEL, OFFER_TYPES, OFFER_LABEL, escapeLike,
} from "@/lib/schemas";

const PAGE = 20;

type SP = {
  q?: string; prodi?: string; semester?: string; kondisi?: string;
  tipe?: string; harga_maks?: string; urut?: string; cursor?: string; dipesan?: string;
};

export default async function CariPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: programs } = await supabase
    .from("study_programs").select("id, slug, short_name").eq("is_active", true).order("short_name");
  const prodi = programs?.find((p) => p.slug === sp.prodi);

  let query = supabase.from("listings").select(CARD_SELECT).limit(PAGE + 1);

  const statuses = sp.dipesan === "1" ? ["aktif", "dipesan"] : ["aktif"];
  query = query.in("status", statuses).is("hidden_at", null);

  // Setiap kata harus cocok (AND). Escape agar % dan _ tidak jadi pola (SEC-91)
  const q = (sp.q ?? "").trim().slice(0, 80);
  for (const word of q.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 6)) {
    query = query.ilike("search_text", `%${escapeLike(word)}%`);
  }
  if (prodi) query = query.eq("study_program_id", prodi.id);

  const sem = Number(sp.semester);
  if (Number.isInteger(sem) && sem >= 1 && sem <= 8) query = query.eq("semester", sem);

  if (sp.kondisi && (CONDITIONS as readonly string[]).includes(sp.kondisi)) {
    query = query.eq("condition", sp.kondisi);
  }
  const tipe = (OFFER_TYPES as readonly string[]).includes(sp.tipe ?? "") ? sp.tipe : undefined;
  if (tipe) query = query.eq("offer_type", tipe);

  const maks = Number(sp.harga_maks);
  if (Number.isInteger(maks) && maks > 0 && !tipe) {
    // Hibah tetap muncul; tukar tidak punya harga sehingga tidak ikut (AC-09.4)
    query = query.or(`price.lte.${maks},offer_type.eq.hibah`);
  } else if (Number.isInteger(maks) && maks > 0 && tipe === "jual") {
    query = query.lte("price", maks);
  }

  if (sp.urut === "termurah") {
    query = query.eq("offer_type", "jual").order("price", { ascending: true }).order("created_at", { ascending: false });
  } else {
    if (sp.cursor && !Number.isNaN(Date.parse(sp.cursor))) query = query.lt("created_at", sp.cursor);
    query = query.order("created_at", { ascending: false });
  }

  // FR-24: mata kuliah dengan listing aktif terbanyak di prodi terpilih. Label sengaja
  // "terbanyak", bukan "sering dicari", karena belum ada data pencarian yang cukup (AC-24.1).
  let topCourses: { name: string; n: number }[] = [];
  if (prodi && !q) {
    const { data: cs } = await supabase
      .from("listings").select("course_name_snapshot")
      .eq("study_program_id", prodi.id).eq("status", "aktif").is("hidden_at", null).limit(500);
    const tally = new Map<string, number>();
    for (const c of cs ?? []) {
      tally.set(c.course_name_snapshot, (tally.get(c.course_name_snapshot) ?? 0) + 1);
    }
    topCourses = [...tally].map(([name, n]) => ({ name, n })).sort((a, b) => b.n - a.n).slice(0, 6);
  }

  const { data, error } = await query;
  const rows = (data ?? []) as unknown as CardListing[];
  const hasMore = sp.urut !== "termurah" && rows.length > PAGE;
  const items = rows.slice(0, PAGE);

  const keep = (extra: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...sp, ...extra })) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `/cari?${s}` : "/cari";
  };

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-4">
      <form action="/cari" className="flex gap-2">
        {prodi && <input type="hidden" name="prodi" value={prodi.slug} />}
        <input
          name="q" defaultValue={q} aria-label="Cari judul atau mata kuliah"
          placeholder="Cari judul atau mata kuliah"
          className="min-h-11 flex-1 rounded-full border border-line px-4"
        />
        <button className="min-h-11 rounded-full bg-navy-900 px-5 font-semibold text-white">Cari</button>
      </form>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Filter prodi">
        <Chip href={keep({ prodi: undefined, cursor: undefined })} active={!prodi}>Semua</Chip>
        {programs?.map((p) => (
          <Chip key={p.id} href={keep({ prodi: p.slug, cursor: undefined })} active={prodi?.id === p.id}>
            {p.short_name}
          </Chip>
        ))}
      </div>

      {topCourses.length > 0 && (
        <div className="mt-3">
          <p className="text-sm text-muted">Mata kuliah terbanyak di {prodi?.short_name}</p>
          <div className="mt-1 flex gap-2 overflow-x-auto pb-1">
            {topCourses.map((c) => (
              <Chip key={c.name} href={keep({ q: c.name, cursor: undefined })} active={false}>
                {c.name} ({c.n})
              </Chip>
            ))}
          </div>
        </div>
      )}

      <div className="mt-2 flex flex-wrap gap-2 text-sm">
        {OFFER_TYPES.map((t) => (
          <Chip key={t} href={keep({ tipe: tipe === t ? undefined : t, cursor: undefined })} active={tipe === t}>
            {OFFER_LABEL[t]}
          </Chip>
        ))}
        {CONDITIONS.map((c) => (
          <Chip key={c} href={keep({ kondisi: sp.kondisi === c ? undefined : c, cursor: undefined })} active={sp.kondisi === c}>
            {CONDITION_LABEL[c]}
          </Chip>
        ))}
        <Chip href={keep({ urut: sp.urut === "termurah" ? undefined : "termurah", cursor: undefined })} active={sp.urut === "termurah"}>
          Termurah
        </Chip>
        <Chip href={keep({ dipesan: sp.dipesan === "1" ? undefined : "1" })} active={sp.dipesan === "1"}>
          Tampilkan yang dipesan
        </Chip>
      </div>

      {error && (
        <p role="alert" className="mt-6 rounded-xl border border-danger px-4 py-3 text-danger">
          Ada yang error di sisi kami, bukan salahmu. Coba lagi sebentar.
        </p>
      )}

      {!error && items.length === 0 && (
        <section className="mt-8 rounded-2xl border border-line p-6">
          <h2 className="font-semibold">
            {q ? <>Belum ada &lsquo;{q}&rsquo; di sini.</> : "Belum ada buku yang cocok."}
          </h2>
          <p className="mt-1 text-muted">Coba kata kunci lain atau hapus beberapa filter.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/cari" className="min-h-11 rounded-full border border-navy-900 px-5 py-3 font-semibold text-navy-900">
              Hapus filter
            </Link>
            <Link href="/jual" className="min-h-11 rounded-full bg-yellow-400 px-5 py-3 font-semibold text-navy-900">
              Jual bukumu
            </Link>
          </div>
        </section>
      )}

      {items.length > 0 && (
        <>
          <p className="mt-4 text-sm text-muted">{items.length}{hasMore ? "+" : ""} buku</p>
          <ul className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {items.map((b) => <li key={b.id}><BookCard b={b} /></li>)}
          </ul>
        </>
      )}

      {hasMore && (
        <div className="mt-6 text-center">
          <Link
            href={keep({ cursor: items[items.length - 1].created_at })}
            className="inline-block min-h-11 rounded-full border border-navy-900 px-6 py-3 font-semibold text-navy-900"
          >
            Muat lagi
          </Link>
        </div>
      )}
    </main>
  );
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={`inline-flex min-h-9 shrink-0 items-center rounded-full border px-3 text-sm font-semibold ${
        active ? "border-navy-900 bg-navy-900 text-white" : "border-line text-navy-900"
      }`}
    >
      {children}
    </Link>
  );
}
