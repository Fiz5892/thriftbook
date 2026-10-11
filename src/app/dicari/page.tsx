import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { escapeLike } from "@/lib/schemas";
import { rupiah, timeAgo } from "@/lib/format";

const PAGE = 20;
const ACCEPT_LABEL = { jual: "Beli", hibah: "Hibah", tukar: "Tukar" } as const;

export default async function DicariPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; prodi?: string; cursor?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: programs } = await supabase
    .from("study_programs").select("id, slug, short_name").eq("is_active", true).order("short_name");
  const prodi = programs?.find((p) => p.slug === sp.prodi);

  let query = supabase
    .from("book_requests")
    .select("id, title, course_name_snapshot, semester, accepts, max_budget, created_at, study_programs(short_name)")
    .eq("status", "terbuka").is("hidden_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(PAGE + 1);

  const q = (sp.q ?? "").trim().slice(0, 80);
  for (const w of q.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 6)) {
    query = query.ilike("search_text", `%${escapeLike(w)}%`);
  }
  if (prodi) query = query.eq("study_program_id", prodi.id);
  if (sp.cursor && !Number.isNaN(Date.parse(sp.cursor))) query = query.lt("created_at", sp.cursor);

  const { data, error } = await query;
  const rows = data ?? [];
  const hasMore = rows.length > PAGE;
  const items = rows.slice(0, PAGE);

  const href = (extra: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ q: sp.q, prodi: sp.prodi, ...extra })) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `/dicari?${s}` : "/dicari";
  };

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-navy-900">Dicari</h1>
        <Link href="/dicari/baru" className="min-h-11 rounded-full bg-yellow-400 px-5 py-2.5 font-semibold text-navy-900">
          Pasang Dicari
        </Link>
      </div>
      <p className="mt-1 text-muted">Punya buku yang mereka cari? Hubungi langsung lewat WhatsApp.</p>

      <form action="/dicari" className="mt-4 flex gap-2">
        {prodi && <input type="hidden" name="prodi" value={prodi.slug} />}
        <input name="q" defaultValue={q} aria-label="Cari permintaan" placeholder="Cari judul atau mata kuliah"
          className="min-h-11 flex-1 rounded-full border border-line px-4" />
        <button className="min-h-11 rounded-full bg-navy-900 px-5 font-semibold text-white">Cari</button>
      </form>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        <Link href={href({ prodi: undefined, cursor: undefined })}
          className={`inline-flex min-h-9 shrink-0 items-center rounded-full border px-3 text-sm font-semibold ${!prodi ? "border-navy-900 bg-navy-900 text-white" : "border-line text-navy-900"}`}>
          Semua
        </Link>
        {programs?.map((p) => (
          <Link key={p.id} href={href({ prodi: p.slug, cursor: undefined })}
            className={`inline-flex min-h-9 shrink-0 items-center rounded-full border px-3 text-sm font-semibold ${prodi?.id === p.id ? "border-navy-900 bg-navy-900 text-white" : "border-line text-navy-900"}`}>
            {p.short_name}
          </Link>
        ))}
      </div>

      {error && (
        <p role="alert" className="mt-6 rounded-xl border border-danger px-4 py-3 text-danger">
          Ada yang error di sisi kami, bukan salahmu. Coba lagi sebentar.
        </p>
      )}

      {!error && items.length === 0 && (
        <section className="mt-8 rounded-2xl border border-line p-6">
          <h2 className="font-semibold">Belum ada yang lagi nyari buku.</h2>
          <p className="mt-1 text-muted">Butuh buku tertentu? Pasang Dicari, biar yang punya bisa nemu kamu.</p>
        </section>
      )}

      <ul className="mt-4 flex flex-col gap-3">
        {items.map((r) => {
          const prodiName = (r.study_programs as unknown as { short_name: string } | null)?.short_name;
          const meta = [r.course_name_snapshot, prodiName, r.semester ? `Sem ${r.semester}` : null]
            .filter(Boolean).join(" · ");
          return (
            <li key={r.id}>
              <Link href={`/dicari/${r.id}`} className="block rounded-xl border border-line p-4">
                <h2 className="font-semibold text-ink">{r.title}</h2>
                <p className="text-sm text-muted">{meta}</p>
                <p className="mt-1 text-sm">
                  {(r.accepts as (keyof typeof ACCEPT_LABEL)[]).map((a) => ACCEPT_LABEL[a]).join(" · ")}
                  {r.max_budget ? ` · maks ${rupiah(r.max_budget)}` : ""}
                </p>
                <p className="mt-1 text-xs text-muted">{timeAgo(r.created_at)}</p>
              </Link>
            </li>
          );
        })}
      </ul>

      {hasMore && (
        <div className="mt-6 text-center">
          <Link href={href({ cursor: items[items.length - 1].created_at })}
            className="inline-block min-h-11 rounded-full border border-navy-900 px-6 py-3 font-semibold text-navy-900">
            Muat lagi
          </Link>
        </div>
      )}
    </main>
  );
}
