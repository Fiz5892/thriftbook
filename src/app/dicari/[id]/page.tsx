import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/auth";
import { BookCard, CARD_SELECT, type CardListing } from "@/components/book-card";
import { ReportBox } from "@/components/report-box";
import { ConfirmButton } from "@/components/confirm-button";
import { IconCheck, IconClose, IconRefresh } from "@/components/icons";
import { ContactButton } from "@/app/buku/[id]/contact-button";
import { rupiah, timeAgo } from "@/lib/format";
import { nowMs } from "@/lib/time";
import { closeRequest, extendRequest } from "../actions";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ACCEPT_LABEL = { jual: "Beli", hibah: "Hibah (gratis)", tukar: "Tukar" } as const;
const STATUS_LABEL: Record<string, string> = {
  terpenuhi: "Sudah terpenuhi", ditutup: "Ditutup", kedaluwarsa: "Kedaluwarsa",
};

export default async function DicariDetail({
  params, searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ baru?: string }>;
}) {
  const { id } = await params;
  const { baru } = await searchParams;
  if (!UUID.test(id)) notFound();

  const supabase = await createClient();
  const { data: r } = await supabase
    .from("book_requests")
    .select("id, requester_id, title, course_id, course_name_snapshot, semester, accepts, max_budget, notes, status, expires_at, created_at, study_programs(short_name)")
    .eq("id", id).maybeSingle();
  if (!r) notFound();

  const [viewer, { data: owner }] = await Promise.all([
    getViewer(supabase),
    supabase.from("public_profiles").select("display_name, cohort_year, is_staff").eq("id", r.requester_id).maybeSingle(),
  ]);
  const userId = viewer?.id ?? null;
  const isOwner = userId === r.requester_id;
  const open = r.status === "terbuka" && new Date(r.expires_at).getTime() > nowMs();

  // FR-13: listing aktif untuk mata kuliah yang sama
  let matches: CardListing[] = [];
  if (open) {
    const { data } = await supabase
      .from("listings").select(CARD_SELECT)
      .eq("course_id", r.course_id).eq("status", "aktif").is("hidden_at", null)
      .order("created_at", { ascending: false }).limit(5);
    matches = (data ?? []) as unknown as CardListing[];
  }

  const prodi = (r.study_programs as unknown as { short_name: string } | null)?.short_name;
  const meta = [r.course_name_snapshot, prodi, r.semester ? `Semester ${r.semester}` : null]
    .filter(Boolean).join(" · ");
  const daysLeft = Math.ceil((new Date(r.expires_at).getTime() - nowMs()) / 86400_000);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-4">
      {baru && isOwner && (
        <p role="status" className="notice mb-4">
          Dicari-mu sudah terpasang. Berlaku 30 hari.
        </p>
      )}

      <p className="text-sm font-semibold text-muted">Dicari</p>
      <h1 className="text-2xl text-ink font-extrabold">{r.title}</h1>
      <p className="mt-1 text-muted">{meta}</p>
      <p className="mt-3">
        Diterima: {(r.accepts as (keyof typeof ACCEPT_LABEL)[]).map((a) => ACCEPT_LABEL[a]).join(" · ")}
        {r.max_budget ? ` · anggaran maks ${rupiah(r.max_budget)}` : ""}
      </p>
      {r.notes && <p className="mt-3 whitespace-pre-wrap">{r.notes}</p>}
      <p className="mt-3 text-sm text-muted">
        Oleh <strong className="text-ink">{owner?.display_name ?? "pengguna thriftbook"}</strong>
        {owner?.is_staff ? " · Dosen/Staf" : owner?.cohort_year ? ` · Angkatan ${owner.cohort_year}` : ""}
        {" · "}dipasang {timeAgo(r.created_at)}
        {open ? ` · ${daysLeft} hari lagi` : ""}
      </p>

      <div className="mt-6">
        {!open ? (
          <p className="card px-4 py-3 text-muted">
            {STATUS_LABEL[r.status] ?? "Sudah tidak aktif"}.
          </p>
        ) : isOwner ? (
          <section aria-label="Kelola Dicari" className="card p-4">
            <div className="flex flex-wrap items-start gap-3">
              <details className="group open:w-full">
                <summary className="btn btn-yellow list-none [&::-webkit-details-marker]:hidden">
                  <IconCheck />
                  Sudah dapat
                </summary>
                <form action={closeRequest} className="card mt-3 flex flex-col gap-2 p-3">
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="outcome" value="terpenuhi" />
                  <p className="text-sm font-semibold">Dapatnya dari mana?</p>
                  <button name="via" value="thriftbook" className="btn btn-outline btn-sm w-full">Lewat thriftbook</button>
                  <button name="via" value="lainnya" className="btn btn-outline btn-sm w-full">Jalur lain</button>
                </form>
              </details>
              {daysLeft <= 7 && (
                <form action={extendRequest}>
                  <input type="hidden" name="id" value={r.id} />
                  <button className="btn btn-outline">
                    <IconRefresh />
                    Perpanjang
                  </button>
                </form>
              )}
              <form action={closeRequest} className="ml-auto">
                <input type="hidden" name="id" value={r.id} />
                <input type="hidden" name="outcome" value="ditutup" />
                <ConfirmButton message="Tutup Dicari ini?" className="btn btn-icon btn-danger" label="Tutup Dicari">
                  <IconClose />
                </ConfirmButton>
              </form>
            </div>
          </section>
        ) : userId ? (
          <ContactButton
            listingId={r.id}
            endpoint={`/api/requests/${r.id}/contact`}
            label="Aku punya bukunya, chat via WhatsApp"
            loginNext={`/dicari/${r.id}`}
          />
        ) : (
          <Link href={`/masuk?next=${encodeURIComponent(`/dicari/${r.id}`)}`}
            className="btn btn-wa w-full">
            Masuk untuk menghubungi
          </Link>
        )}
      </div>

      {matches.length > 0 && (
        <section className="mt-8">
          <h2 className="font-semibold">Mungkin ini yang kamu cari</h2>
          <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {matches.map((b) => <li key={b.id}><BookCard b={b} /></li>)}
          </ul>
        </section>
      )}

      {userId && !isOwner && open && <ReportBox kind="request" targetId={r.id} />}
    </main>
  );
}
