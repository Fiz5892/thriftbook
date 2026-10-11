import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { timeAgo } from "@/lib/format";

export const metadata = { title: "Riwayat moderasi — thriftbook.", robots: { index: false, follow: false } };

export default async function RiwayatPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("moderation_actions")
    .select("id, admin_id, action, target_id, reason, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
      <Link href="/admin" className="text-sm font-semibold underline">← Panel moderasi</Link>
      <h1 className="mt-2 text-2xl text-ink font-extrabold">Riwayat tindakan</h1>
      <p className="text-muted">100 tindakan terakhir. Hanya-baca: tidak ada yang bisa diubah atau dihapus.</p>
      {!data?.length && <p className="mt-4 text-muted">Belum ada tindakan.</p>}
      <ul className="mt-4 flex flex-col gap-2">
        {data?.map((a) => (
          <li key={a.id} className="card p-3 text-sm">
            <p><strong>{a.action}</strong> · <span className="text-muted">{timeAgo(a.created_at)}</span></p>
            <p className="break-all text-muted">target {a.target_id}</p>
            <p>{a.reason}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
