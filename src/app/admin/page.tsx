import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { REPORT_LABEL, type REPORT_REASONS } from "@/lib/schemas";
import { timeAgo } from "@/lib/format";
import { nowMs } from "@/lib/time";
import { ModerateForm } from "./moderate-form";

export const metadata = { title: "Admin — thriftbook.", robots: { index: false, follow: false } };

type Report = {
  id: number; reporter_id: string | null; reason: keyof typeof REPORT_LABEL; note: string | null;
  created_at: string; target_listing_id: string | null; target_request_id: string | null;
  target_profile_id: string | null;
};

const STORAGE_QUOTA_BYTES = 1024 ** 3; // ⚠️ cek kuota Supabase terbaru (PRD §8.4)

export default async function AdminPage() {
  await requireAdmin();
  const db = createAdminClient();
  const week = new Date(nowMs() - 7 * 86400_000).toISOString();

  const [
    { count: activeListings }, { count: newListings }, { count: reveals7d },
    { count: openReports }, { count: users }, { data: photoBytes },
    { data: reports }, { data: hiddenListings }, { data: hiddenRequests }, { data: banned },
  ] = await Promise.all([
    db.from("listings").select("id", { count: "exact", head: true }).in("status", ["aktif", "dipesan"]).is("hidden_at", null),
    db.from("listings").select("id", { count: "exact", head: true }).gte("created_at", week),
    db.from("contact_reveals").select("id", { count: "exact", head: true }).gte("created_at", week),
    db.from("reports").select("id", { count: "exact", head: true }).eq("status", "baru"),
    db.from("profiles").select("id", { count: "exact", head: true }),
    db.from("listing_photos").select("bytes_full, bytes_thumb"),
    db.from("reports").select("*").eq("status", "baru").order("created_at", { ascending: true }).limit(200),
    db.from("listings").select("id, title, hidden_reason, hidden_at").not("hidden_at", "is", null).order("hidden_at", { ascending: false }).limit(30),
    db.from("book_requests").select("id, title, hidden_reason, hidden_at").not("hidden_at", "is", null).order("hidden_at", { ascending: false }).limit(30),
    db.from("profiles").select("id, display_name, ban_reason, banned_at").not("banned_at", "is", null).limit(50),
  ]);

  const usedBytes = (photoBytes ?? []).reduce((s, p) => s + (p.bytes_full ?? 0) + (p.bytes_thumb ?? 0), 0);
  const usedPct = Math.round((usedBytes / STORAGE_QUOTA_BYTES) * 1000) / 10;

  // Kelompokkan laporan per target; urut: paling banyak dilaporkan, lalu tertua
  type Group = { kind: "listing" | "request" | "profile"; id: string; reports: Report[] };
  const groups = new Map<string, Group>();
  for (const r of (reports ?? []) as Report[]) {
    const kind = r.target_listing_id ? "listing" : r.target_request_id ? "request" : "profile";
    const id = (r.target_listing_id ?? r.target_request_id ?? r.target_profile_id)!;
    const key = `${kind}:${id}`;
    if (!groups.has(key)) groups.set(key, { kind, id, reports: [] });
    groups.get(key)!.reports.push(r);
  }
  const queue = [...groups.values()].sort(
    (a, b) => b.reports.length - a.reports.length ||
      +new Date(a.reports[0].created_at) - +new Date(b.reports[0].created_at),
  );

  const listingIds = queue.filter((g) => g.kind === "listing").map((g) => g.id);
  const requestIds = queue.filter((g) => g.kind === "request").map((g) => g.id);
  const [{ data: ls }, { data: rs }] = await Promise.all([
    listingIds.length
      ? db.from("listings").select("id, title, owner_id, hidden_at, hidden_reason, status").in("id", listingIds)
      : Promise.resolve({ data: [] as { id: string; title: string; owner_id: string; hidden_at: string | null; hidden_reason: string | null; status: string }[] }),
    requestIds.length
      ? db.from("book_requests").select("id, title, requester_id, hidden_at, hidden_reason, status").in("id", requestIds)
      : Promise.resolve({ data: [] as { id: string; title: string; requester_id: string; hidden_at: string | null; hidden_reason: string | null; status: string }[] }),
  ]);
  const ownerIds = [...new Set([...(ls ?? []).map((l) => l.owner_id), ...(rs ?? []).map((r) => r.requester_id)])];
  const { data: owners } = ownerIds.length
    ? await db.from("profiles").select("id, display_name, banned_at").in("id", ownerIds)
    : { data: [] as { id: string; display_name: string; banned_at: string | null }[] };
  const ownerOf = (id: string) => owners?.find((o) => o.id === id);

  const stat = "rounded-xl border border-line p-3";

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold text-navy-900">Panel moderasi</h1>
        <Link href="/admin/riwayat" className="text-sm font-semibold underline">Riwayat tindakan</Link>
      </div>

      <section aria-label="Ringkasan" className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className={stat}><p className="text-xs text-muted">Listing aktif</p><p className="text-xl font-bold">{activeListings ?? 0}</p></div>
        <div className={stat}><p className="text-xs text-muted">Listing baru 7 hari</p><p className="text-xl font-bold">{newListings ?? 0}</p></div>
        <div className={stat}><p className="text-xs text-muted">Kontak dibuka 7 hari</p><p className="text-xl font-bold">{reveals7d ?? 0}</p></div>
        <div className={stat}><p className="text-xs text-muted">Laporan terbuka</p><p className="text-xl font-bold">{openReports ?? 0}</p></div>
        <div className={stat}><p className="text-xs text-muted">Pengguna</p><p className="text-xl font-bold">{users ?? 0}</p></div>
        <div className={stat}>
          <p className="text-xs text-muted">Storage foto</p>
          <p className="text-xl font-bold">{usedPct}%</p>
          {usedPct >= 70 && <p className="text-xs text-danger">Di atas 70%: siapkan migrasi ke R2.</p>}
        </div>
      </section>

      <h2 className="mt-8 text-lg font-semibold">Antrean laporan ({queue.length})</h2>
      {queue.length === 0 && <p className="mt-2 text-muted">Tidak ada laporan terbuka.</p>}
      <ul className="mt-3 flex flex-col gap-4">
        {queue.map((g) => {
          const l = g.kind === "listing" ? ls?.find((x) => x.id === g.id) : undefined;
          const r = g.kind === "request" ? rs?.find((x) => x.id === g.id) : undefined;
          const title = l?.title ?? r?.title ?? "(target sudah terhapus)";
          const ownerId = l?.owner_id ?? r?.requester_id;
          const owner = ownerId ? ownerOf(ownerId) : undefined;
          const hidden = l?.hidden_at ?? r?.hidden_at;
          const href = g.kind === "listing" ? `/buku/${g.id}` : g.kind === "request" ? `/dicari/${g.id}` : null;
          return (
            <li key={`${g.kind}:${g.id}`} className="rounded-xl border border-line p-4">
              <p className="text-xs uppercase text-muted">
                {g.kind === "listing" ? "Listing" : g.kind === "request" ? "Dicari" : "Pengguna"} · {g.reports.length} laporan
                {hidden ? " · tersembunyi" : ""}
              </p>
              <p className="font-semibold">
                {href ? <Link href={href} className="underline">{title}</Link> : title}
              </p>
              {owner && <p className="text-sm text-muted">Pemilik: {owner.display_name}{owner.banned_at ? " (diblokir)" : ""}</p>}
              <ul className="mt-2 list-disc pl-5 text-sm">
                {g.reports.map((x) => (
                  <li key={x.id}>
                    {REPORT_LABEL[x.reason as (typeof REPORT_REASONS)[number]]}
                    {x.reporter_id === null ? " (otomatis)" : ""}
                    {x.note ? ` — “${x.note}”` : ""} · {timeAgo(x.created_at)}
                  </li>
                ))}
              </ul>
              <ModerateForm
                kind={g.kind}
                targetId={g.id}
                buttons={[
                  ...(g.kind !== "profile" ? [{ intent: "hide" as const, label: "Sembunyikan", danger: true }] : []),
                  { intent: "dismiss", label: "Tolak laporan" },
                ]}
              />
              {ownerId && owner && !owner.banned_at && (
                <details className="mt-3 text-sm">
                  <summary className="cursor-pointer font-semibold text-danger">Blokir pemilik</summary>
                  <ModerateForm kind="profile" targetId={ownerId} buttons={[{ intent: "ban", label: "Blokir akun", danger: true }]} />
                </details>
              )}
            </li>
          );
        })}
      </ul>

      <h2 className="mt-10 text-lg font-semibold">Disembunyikan</h2>
      {!(hiddenListings?.length || hiddenRequests?.length) && <p className="mt-2 text-muted">Tidak ada.</p>}
      <ul className="mt-3 flex flex-col gap-3">
        {hiddenListings?.map((l) => (
          <li key={l.id} className="rounded-xl border border-line p-4">
            <p className="font-semibold"><Link href={`/buku/${l.id}`} className="underline">{l.title}</Link></p>
            <p className="text-sm text-muted">Listing · {l.hidden_reason}</p>
            <ModerateForm kind="listing" targetId={l.id} buttons={[{ intent: "unhide", label: "Tampilkan lagi" }]} />
          </li>
        ))}
        {hiddenRequests?.map((r) => (
          <li key={r.id} className="rounded-xl border border-line p-4">
            <p className="font-semibold"><Link href={`/dicari/${r.id}`} className="underline">{r.title}</Link></p>
            <p className="text-sm text-muted">Dicari · {r.hidden_reason}</p>
            <ModerateForm kind="request" targetId={r.id} buttons={[{ intent: "unhide", label: "Tampilkan lagi" }]} />
          </li>
        ))}
      </ul>

      <h2 className="mt-10 text-lg font-semibold">Pengguna diblokir</h2>
      {!banned?.length && <p className="mt-2 text-muted">Tidak ada.</p>}
      <ul className="mt-3 flex flex-col gap-3">
        {banned?.map((u) => (
          <li key={u.id} className="rounded-xl border border-line p-4">
            <p className="font-semibold">{u.display_name}</p>
            <p className="text-sm text-muted">{u.ban_reason}</p>
            <ModerateForm kind="profile" targetId={u.id} buttons={[{ intent: "unban", label: "Buka blokir" }]} />
          </li>
        ))}
      </ul>
    </main>
  );
}
