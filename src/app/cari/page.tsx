import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BookCard, CARD_SELECT, type CardListing } from "@/components/book-card";
import {
  CONDITIONS, CONDITION_LABEL, OFFER_TYPES, OFFER_LABEL, escapeLike,
} from "@/lib/schemas";
import { fuzzyScore, rankFuzzy } from "@/lib/fuzzy";
import { Mascot } from "@/components/mascot";

const PAGE = 20;
const HARGA_PILIHAN = [20000, 30000, 50000, 100000];

type SP = {
  q?: string; prodi?: string; semester?: string; kondisi?: string;
  tipe?: string; harga_maks?: string; urut?: string; cursor?: string; dipesan?: string;
};

type Row = CardListing & { search_text?: string };

export default async function CariPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: programs } = await supabase
    .from("study_programs").select("id, slug, short_name").eq("is_active", true).order("short_name");
  const prodi = programs?.find((p) => p.slug === sp.prodi);

  const q = (sp.q ?? "").trim().slice(0, 80);
  const qWords = q.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 6);
  const sem = Number(sp.semester);
  const semOk = Number.isInteger(sem) && sem >= 1 && sem <= 8;
  const kondisi = (CONDITIONS as readonly string[]).includes(sp.kondisi ?? "") ? sp.kondisi : undefined;
  const tipe = (OFFER_TYPES as readonly string[]).includes(sp.tipe ?? "") ? sp.tipe : undefined;
  const maks = Number(sp.harga_maks);
  const maksOk = Number.isInteger(maks) && maks > 0;
  const statuses = sp.dipesan === "1" ? ["aktif", "dipesan"] : ["aktif"];
  const relevan = sp.urut === "relevan" && qWords.length > 0;
  const termurah = sp.urut === "termurah";

  // Filter selain teks; dipakai oleh kueri utama dan cadangan fuzzy
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const applyFilters = (qb: any) => {
    qb = qb.in("status", statuses).is("hidden_at", null);
    if (prodi) qb = qb.eq("study_program_id", prodi.id);
    if (semOk) qb = qb.eq("semester", sem);
    if (kondisi) qb = qb.eq("condition", kondisi);
    if (tipe) qb = qb.eq("offer_type", tipe);
    if (maksOk && !tipe) qb = qb.or(`price.lte.${maks},offer_type.eq.hibah`); // AC-09.4
    else if (maksOk && tipe === "jual") qb = qb.lte("price", maks);
    return qb;
  };

  let main = applyFilters(supabase.from("listings").select(CARD_SELECT));
  for (const w of qWords) main = main.ilike("search_text", `%${escapeLike(w)}%`); // SEC-91

  if (termurah) {
    main = main.eq("offer_type", "jual").order("price", { ascending: true }).order("created_at", { ascending: false });
  } else {
    if (!relevan && sp.cursor && !Number.isNaN(Date.parse(sp.cursor))) main = main.lt("created_at", sp.cursor);
    main = main.order("created_at", { ascending: false });
  }
  main = main.limit(relevan ? 100 : PAGE + 1);

  const { data, error } = await main;
  let rows = (data ?? []) as unknown as Row[];
  let fuzzy = false;

  // Tidak ada yang persis cocok: cari yang mirip (toleran salah ketik, AC-09.1)
  if (!error && rows.length === 0 && qWords.length > 0 && !sp.cursor) {
    const { data: cand } = await applyFilters(
      supabase.from("listings").select(`${CARD_SELECT}, search_text`),
    ).order("created_at", { ascending: false }).limit(1000);
    const ranked = rankFuzzy(q, (cand ?? []) as unknown as Row[], (r) => r.search_text ?? r.title);
    rows = ranked.slice(0, PAGE).map((r) => r.item);
    fuzzy = rows.length > 0;
  } else if (relevan) {
    rows = rows
      .map((r) => ({
        r,
        s: fuzzyScore(q, r.title) * 0.7 + fuzzyScore(q, r.search_text ?? r.title) * 0.3,
      }))
      .sort((a, b) => b.s - a.s || +new Date(b.r.created_at) - +new Date(a.r.created_at))
      .slice(0, PAGE)
      .map((x) => x.r);
  }

  const paged = !relevan && !fuzzy && !termurah;
  const hasMore = paged && rows.length > PAGE;
  const items = rows.slice(0, PAGE);

  // FR-23 / M-07: catat pencarian TANPA identitas pengguna (AC-23.2)
  if (!error && qWords.length > 0 && !sp.cursor) {
    try {
      await createAdminClient().from("events").insert({
        name: "search_performed",
        user_id: null,
        props: { q: q.toLowerCase(), n: items.length, fuzzy, prodi: prodi?.slug ?? null },
      });
    } catch {
      // metrik tidak boleh menggagalkan pencarian
    }
  }

  // FR-24: mata kuliah terbanyak di prodi terpilih. Label "terbanyak", bukan "sering dicari",
  // karena data pencarian belum cukup (AC-24.1).
  let topCourses: { name: string; n: number }[] = [];
  if (prodi && !q) {
    const { data: cs } = await supabase
      .from("listings").select("course_name_snapshot")
      .eq("study_program_id", prodi.id).eq("status", "aktif").is("hidden_at", null).limit(500);
    const tally = new Map<string, number>();
    for (const c of cs ?? []) tally.set(c.course_name_snapshot, (tally.get(c.course_name_snapshot) ?? 0) + 1);
    topCourses = [...tally].map(([name, n]) => ({ name, n })).sort((a, b) => b.n - a.n).slice(0, 6);
  }

  const keep = (extra: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...sp, ...extra })) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `/cari?${s}` : "/cari";
  };

  const select = "input min-h-10 py-1 text-sm";

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
      <h1 className="sr-only">{q ? `Hasil pencarian ${q}` : "Cari buku kuliah bekas"}</h1>
      <form action="/cari" className="flex gap-2">
        {prodi && <input type="hidden" name="prodi" value={prodi.slug} />}
        <input
          name="q" defaultValue={q} aria-label="Cari judul atau mata kuliah"
          placeholder="Cari judul atau mata kuliah"
          className="input input-pill flex-1"
        />
        <button className="btn btn-ink">Cari</button>
      </form>

      <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0" aria-label="Filter prodi">
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

      <div className="-mx-4 mt-2 flex gap-2 overflow-x-auto px-4 pb-1 text-sm md:mx-0 md:flex-wrap md:overflow-visible md:px-0" aria-label="Filter tipe, kondisi, dan urutan">
        {OFFER_TYPES.map((t) => (
          <Chip key={t} href={keep({ tipe: tipe === t ? undefined : t, cursor: undefined })} active={tipe === t}>
            {OFFER_LABEL[t]}
          </Chip>
        ))}
        {CONDITIONS.map((c) => (
          <Chip key={c} href={keep({ kondisi: kondisi === c ? undefined : c, cursor: undefined })} active={kondisi === c}>
            {CONDITION_LABEL[c]}
          </Chip>
        ))}
        <Chip href={keep({ urut: termurah ? undefined : "termurah", cursor: undefined })} active={termurah}>
          Termurah
        </Chip>
        {qWords.length > 0 && (
          <Chip href={keep({ urut: relevan ? undefined : "relevan", cursor: undefined })} active={relevan}>
            Paling relevan
          </Chip>
        )}
        <Chip href={keep({ dipesan: sp.dipesan === "1" ? undefined : "1" })} active={sp.dipesan === "1"}>
          Tampilkan yang dipesan
        </Chip>
      </div>

      {/* Semester dan harga maksimal (AC-09, FR-09) */}
      <form action="/cari" className="mt-3 flex flex-wrap items-end gap-2" aria-label="Filter semester dan harga">
        {q && <input type="hidden" name="q" value={q} />}
        {prodi && <input type="hidden" name="prodi" value={prodi.slug} />}
        {tipe && <input type="hidden" name="tipe" value={tipe} />}
        {kondisi && <input type="hidden" name="kondisi" value={kondisi} />}
        {sp.urut && <input type="hidden" name="urut" value={sp.urut} />}
        {sp.dipesan === "1" && <input type="hidden" name="dipesan" value="1" />}
        <label className="flex flex-col text-xs text-muted">
          Semester
          <select name="semester" defaultValue={semOk ? String(sem) : ""} className={select}>
            <option value="">Semua</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="flex flex-col text-xs text-muted">
          Harga maks
          <select name="harga_maks" defaultValue={maksOk ? String(maks) : ""} className={select}>
            <option value="">Berapa saja</option>
            {HARGA_PILIHAN.map((h) => (
              <option key={h} value={h}>Rp{new Intl.NumberFormat("id-ID").format(h)}</option>
            ))}
          </select>
        </label>
        <button className="btn btn-outline btn-sm">
          Terapkan
        </button>
      </form>

      {error && (
        <p role="alert" className="alert-danger mt-6">
          Ada yang error di sisi kami, bukan salahmu. Coba lagi sebentar.
        </p>
      )}

      {fuzzy && (
        <p role="status" className="notice mt-4 text-sm">
          Tidak ada yang persis &lsquo;{q}&rsquo;. Ini yang paling mirip.
        </p>
      )}

      {!error && items.length === 0 && (
        <section className="card card-lg mt-8 flex flex-col gap-5 p-6 md:flex-row md:items-center">
          <Mascot mood="search" className="w-28 shrink-0 self-center" />
          <div>
          <h2 className="text-xl font-extrabold">
            {q ? <>Belum ada &lsquo;{q}&rsquo; di sini.</> : "Belum ada buku yang cocok."}
          </h2>
          <p className="mt-1 text-muted">
            {q ? "Pasang Dicari, biar yang punya bisa nemu kamu." : "Coba kata kunci lain atau hapus beberapa filter."}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {q && (
              <Link
                href={`/dicari/baru?q=${encodeURIComponent(q)}`}
                className="btn btn-yellow"
              >
                Pasang Dicari untuk &lsquo;{q}&rsquo;
              </Link>
            )}
            <Link href="/cari" className="btn btn-outline">
              Hapus filter
            </Link>
          </div>
          </div>
        </section>
      )}

      {items.length > 0 && (
        <>
          <h2 className="sr-only">Daftar buku</h2>
          <p className="mt-4 text-sm text-muted">{items.length}{hasMore ? "+" : ""} buku</p>
          <ul className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {items.map((b, i) => <li key={b.id}><BookCard b={b} priority={i < 2} /></li>)}
          </ul>
        </>
      )}

      {hasMore && (
        <div className="mt-6 text-center">
          <Link
            href={keep({ cursor: items[items.length - 1].created_at })}
            className="btn btn-outline"
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
      className="chip"
    >
      {children}
    </Link>
  );
}
