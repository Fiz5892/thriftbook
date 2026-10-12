import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/auth";
import { CONDITION_LABEL, CONDITION_HELP, type CONDITIONS } from "@/lib/schemas";
import { photoUrl, rupiah, timeAgo } from "@/lib/format";
import { ConfirmButton } from "@/components/confirm-button";
import { ReportBox } from "@/components/report-box";
import { ContactButton } from "./contact-button";
import { ShareButton } from "@/components/share-button";
import { ClearDraft } from "@/components/clear-draft";
import { DoneChoice } from "@/components/done-choice";
import { IconBookmark, IconEdit, IconRefresh, IconTrash, IconUndo } from "@/components/icons";
import { setListingStatus, deleteListing } from "./actions";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const LAPOR_MSG: Record<string, string> = {
  ok: "Makasih, laporanmu sudah masuk. Tim kami cek maksimal 1×24 jam di hari kuliah.",
  ganda: "Kamu sudah melaporkan ini sebelumnya.",
  batas: "Batas 10 laporan per hari tercapai. Coba lagi besok, ya.",
  gagal: "Laporannya gagal terkirim. Coba lagi sebentar.",
};

async function load(id: string) {
  if (!UUID.test(id)) return null;
  const supabase = await createClient();
  const { data: l } = await supabase
    .from("listings")
    .select(
      "id, owner_id, title, author, price, offer_type, swap_wish, notes, condition, semester, status, hidden_at, hidden_reason, course_id, created_at, courses:course_id(name), study_programs(short_name), listing_photos(path_full, position, width, height)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!l) return null;
  const { data: owner } = await supabase
    .from("public_profiles").select("display_name, cohort_year, is_staff")
    .eq("id", l.owner_id).maybeSingle();
  const viewer = await getViewer(supabase);
  return { supabase, l, owner, userId: viewer?.id ?? null };
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const d = await load(id);
  // Listing selesai/tersembunyi memakai pratinjau default tanpa data listing (AC-21.2)
  if (!d || d.l.status !== "aktif" || d.l.hidden_at) {
    return { title: "thriftbook.", robots: { index: false, follow: false } };
  }
  const harga =
    d.l.offer_type === "jual" && d.l.price ? rupiah(d.l.price) : d.l.offer_type === "hibah" ? "Gratis" : "Tukar";
  const cond = CONDITION_LABEL[d.l.condition as (typeof CONDITIONS)[number]];
  const prodi = (d.l.study_programs as unknown as { short_name: string } | null)?.short_name ?? "";
  const title = `${d.l.title} — ${harga} · thriftbook.`;
  const description = `${harga} · Kondisi ${cond}${prodi ? ` · ${prodi}` : ""}`;
  const cover = [...(d.l.listing_photos as { path_full: string; position: number }[])]
    .sort((a, b) => a.position - b.position)[0];
  return {
    title,
    description,
    openGraph: {
      title, description, type: "website",
      images: cover ? [{ url: photoUrl(cover.path_full) }] : undefined,
    },
  };
}

export default async function BukuPage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ baru?: string; lapor?: string }>;
}) {
  const { id } = await params;
  const { baru, lapor } = await searchParams;
  const d = await load(id);
  if (!d) notFound();
  const { supabase, l, owner, userId } = d;

  const isOwner = userId === l.owner_id;
  const cond = l.condition as (typeof CONDITIONS)[number];
  const photos = [...(l.listing_photos as { path_full: string; position: number; width: number; height: number }[])]
    .sort((a, b) => a.position - b.position);
  const course = (l.courses as unknown as { name: string } | null)?.name;
  const prodi = (l.study_programs as unknown as { short_name: string } | null)?.short_name;
  const meta = [course, prodi, l.semester ? `Semester ${l.semester}` : null].filter(Boolean).join(" · ");
  const sold = l.status === "selesai";
  const reserved = l.status === "dipesan";
  const expired = l.status === "kedaluwarsa";

  // FR-13: orang yang mencari mata kuliah yang sama, ditampilkan ke pemilik setelah posting
  let seekers: { id: string; title: string }[] = [];
  if (isOwner && baru) {
    const { data } = await supabase
      .from("book_requests").select("id, title")
      .eq("course_id", l.course_id).eq("status", "terbuka").is("hidden_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false }).limit(3);
    seekers = data ?? [];
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:py-10">
      {baru && isOwner && <ClearDraft />}
      {baru && isOwner && (
        <div role="status" className="notice mb-4">
          <p className="font-semibold">Bukumu sudah tayang. Jangan lupa tandai &lsquo;Selesai&rsquo; kalau sudah laku.</p>
          {seekers.length > 0 && (
            <div className="mt-2 text-sm">
              <p>Ada {seekers.length === 3 ? "beberapa" : seekers.length} orang yang mencari buku mirip:</p>
              <ul className="list-disc pl-5">
                {seekers.map((s) => (
                  <li key={s.id}><Link href={`/dicari/${s.id}`} className="underline">{s.title}</Link></li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      {lapor && LAPOR_MSG[lapor] && (
        <p role="status" className="card mb-4 px-4 py-3">{LAPOR_MSG[lapor]}</p>
      )}
      {isOwner && l.hidden_at && (
        <p role="status" className="alert-danger mb-4">
          Listing ini disembunyikan moderator
          {l.hidden_reason === "auto_3_reports" ? " sementara menunggu tinjauan." : "."}
        </p>
      )}

      <div className="lg:grid lg:grid-cols-[1.1fr_1fr] lg:items-start lg:gap-10">
      <div className="lg:sticky lg:top-24">
      <div className="flex snap-x gap-3 overflow-x-auto p-1 pb-3">
        {photos.map((p, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={p.path_full}
            src={photoUrl(p.path_full)}
            alt={`${l.title}, foto ke-${i + 1}`}
            width={p.width} height={p.height}
            fetchPriority={i === 0 ? "high" : "auto"}
            className="card h-80 w-auto max-w-[85%] shrink-0 snap-center bg-paper object-contain lg:h-[30rem]"
          />
        ))}
      </div>
      </div>

      <div className="mt-4 lg:mt-0">

      <h1 className="text-2xl font-extrabold text-ink md:text-3xl">{l.title}</h1>
      {l.author && <p className="text-muted">{l.author}</p>}

      <p className="font-display mt-3 text-2xl font-extrabold text-ink">
        {l.offer_type === "jual" && l.price !== null ? rupiah(l.price) : l.offer_type === "hibah" ? "Gratis" : "Tukar"}
      </p>
      {l.offer_type === "tukar" && l.swap_wish && (
        <p className="mt-1">Ingin ditukar dengan: <strong>{l.swap_wish}</strong></p>
      )}

      <p className="badge mt-3 inline-block text-sm">
        {CONDITION_LABEL[cond]}
      </p>
      <p className="mt-1 text-sm text-muted">{CONDITION_HELP[cond]}</p>
      <p className="mt-3 text-sm text-muted">{meta}</p>

      {l.notes && <p className="mt-4 whitespace-pre-wrap">{l.notes}</p>}

      <p className="mt-4 text-sm text-muted">
        Oleh <strong className="text-ink">{owner?.display_name ?? "pengguna thriftbook"}</strong>
        {owner?.is_staff ? " · Dosen/Staf" : owner?.cohort_year ? ` · Angkatan ${owner.cohort_year}` : ""}
        {" · "}diposting {timeAgo(l.created_at)}
      </p>

      <div className="mt-6">
        {sold ? (
          <p className="card px-4 py-3 text-muted">Buku ini sudah tidak tersedia.</p>
        ) : isOwner ? (
          <OwnerControls id={l.id} status={l.status} expired={expired} />
        ) : reserved ? (
          <p className="card px-4 py-3 text-muted">Sedang dipesan orang lain.</p>
        ) : userId ? (
          <ContactButton listingId={l.id} />
        ) : (
          <Link
            href={`/masuk?next=${encodeURIComponent(`/buku/${l.id}`)}`}
            className="btn btn-wa w-full"
          >
            Masuk untuk chat penjual
          </Link>
        )}
      </div>

      {!sold && !isOwner && (
        <aside className="card mt-6 p-4 text-sm">
          <h2 className="font-semibold">Tips COD aman</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Ketemu di area ramai kampus pada jam kuliah.</li>
            <li>Cek bukunya dulu, baru bayar.</li>
            <li>Jangan transfer DP ke siapa pun.</li>
          </ul>
          <Link href="/panduan-cod" className="btn-link mt-1">Baca panduan lengkap</Link>
        </aside>
      )}

      {!sold && (
        <div className="mt-4 flex items-center gap-2">
          <ShareButton title={l.title} path={`/buku/${l.id}`} iconOnly />
          <span className="text-sm text-muted">Bagikan ke teman satu prodi</span>
        </div>
      )}

      {userId && !isOwner && <ReportBox kind="listing" targetId={l.id} />}
      </div>
      </div>
    </main>
  );
}

function OwnerControls({ id, status, expired }: { id: string; status: string; expired: boolean }) {
  const STATUS: Record<string, { label: string; dot: string }> = {
    aktif: { label: "Tersedia", dot: "bg-mint" },
    dipesan: { label: "Dipesan", dot: "bg-orange" },
    kedaluwarsa: { label: "Kedaluwarsa", dot: "bg-pink" },
  };
  const st = STATUS[status] ?? STATUS.aktif;

  return (
    <section aria-label="Kelola buku" className="card p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <span aria-hidden="true" className={`size-3 rounded-full border-2 border-ink ${st.dot}`} />
          {st.label}
        </p>

        {/* Aksi sekunder berupa ikon; nama aksi ada di aria-label dan tooltip */}
        <div className="flex items-center gap-2">
          <Link href={`/buku/${id}/edit`} className="btn btn-icon btn-outline" aria-label="Edit buku" title="Edit buku">
            <IconEdit />
          </Link>
          <form action={deleteListing}>
            <input type="hidden" name="id" value={id} />
            <ConfirmButton
              message="Hapus listing ini? Tidak bisa dibatalkan."
              className="btn btn-icon btn-danger"
              label="Hapus buku"
            >
              <IconTrash />
            </ConfirmButton>
          </form>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-start gap-3">
        {expired && (
          <form action={setListingStatus}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="status" value="aktif" />
            <button className="btn btn-yellow">
              <IconRefresh />
              Aktifkan lagi
            </button>
          </form>
        )}
        {status === "aktif" && (
          <form action={setListingStatus}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="status" value="dipesan" />
            <button className="btn btn-outline">
              <IconBookmark />
              Dipesan
            </button>
          </form>
        )}
        {status === "dipesan" && (
          <form action={setListingStatus}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="status" value="aktif" />
            <button className="btn btn-outline">
              <IconUndo />
              Batalkan
            </button>
          </form>
        )}
        {!expired && <DoneChoice id={id} action={setListingStatus} />}
      </div>
    </section>
  );
}
