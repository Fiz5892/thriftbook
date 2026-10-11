import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { rupiah, timeAgo } from "@/lib/format";
import { signOut, signOutEverywhere } from "./actions";
import { setListingStatus } from "../buku/[id]/actions";

const STATUS_LABEL: Record<string, string> = {
  aktif: "Aktif", dipesan: "Dipesan", selesai: "Selesai", kedaluwarsa: "Kedaluwarsa",
  terbuka: "Terbuka", terpenuhi: "Terpenuhi", ditutup: "Ditutup",
};

export default async function AkunPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/masuk?next=/akun");

  const [{ data: profile }, { data: listings }, { data: requests }] = await Promise.all([
    supabase.from("profiles").select("display_name, cohort_year, is_staff, role").eq("id", auth.user.id).maybeSingle(),
    supabase
      .from("listings")
      .select("id, title, price, offer_type, status, hidden_at, hidden_reason, course_id, created_at")
      .eq("owner_id", auth.user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("book_requests")
      .select("id, title, course_id, status, expires_at, created_at")
      .eq("requester_id", auth.user.id)
      .order("created_at", { ascending: false }),
  ]);

  if (!profile) redirect("/onboarding?next=/akun");

  // FR-13: berapa listing aktif yang cocok dengan tiap Dicari terbuka (tanpa notifikasi)
  const openRequests = (requests ?? []).filter((r) => r.status === "terbuka");
  const matchCount = new Map<string, number>();
  if (openRequests.length) {
    const { data } = await supabase
      .from("listings").select("course_id")
      .in("course_id", [...new Set(openRequests.map((r) => r.course_id))])
      .eq("status", "aktif").is("hidden_at", null);
    for (const r of openRequests) {
      matchCount.set(r.id, (data ?? []).filter((x) => x.course_id === r.course_id).length);
    }
  }

  const link = "underline";
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
      <h1 className="text-2xl font-bold text-navy-900">{profile.display_name}</h1>
      <p className="text-muted">
        {auth.user.email}
        {profile.is_staff ? " · Dosen/Staf" : profile.cohort_year ? ` · Angkatan ${profile.cohort_year}` : ""}
      </p>
      <p className="mt-2 flex flex-wrap gap-4 text-sm font-semibold">
        <Link href="/akun/profil" className={link}>Edit profil</Link>
        {profile.role === "admin" && <Link href="/admin" className={link}>Panel moderasi</Link>}
      </p>

      <h2 className="mt-8 text-lg font-semibold">Listing saya</h2>
      {!listings?.length ? (
        <section className="mt-3 rounded-2xl border border-line p-6">
          <p className="font-semibold">Kamu belum jual apa-apa.</p>
          <Link href="/jual" className="mt-3 inline-block min-h-11 rounded-full bg-yellow-400 px-5 py-3 font-semibold text-navy-900">
            Jual bukumu
          </Link>
        </section>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {listings.map((l) => (
            <li key={l.id} className="rounded-xl border border-line p-4">
              <Link href={`/buku/${l.id}`} className="font-semibold text-navy-900 underline">{l.title}</Link>
              <p className="text-sm text-muted">
                {l.offer_type === "jual" && l.price !== null ? rupiah(l.price) : l.offer_type === "hibah" ? "Gratis" : "Tukar"}
                {" · "}{STATUS_LABEL[l.status] ?? l.status}
                {" · "}{timeAgo(l.created_at)}
              </p>
              {l.hidden_at && (
                <p role="status" className="mt-1 text-sm text-danger">
                  Disembunyikan moderator{l.hidden_reason === "auto_3_reports" ? " (menunggu tinjauan)" : ""}.
                </p>
              )}
              {l.status === "kedaluwarsa" && (
                <form action={setListingStatus} className="mt-3">
                  <input type="hidden" name="id" value={l.id} />
                  <button name="status" value="aktif" className="min-h-10 rounded-full bg-yellow-400 px-4 text-sm font-semibold text-navy-900">
                    Masih ada? Aktifkan lagi
                  </button>
                </form>
              )}
              {!l.hidden_at && (l.status === "aktif" || l.status === "dipesan") && (
                <form action={setListingStatus} className="mt-3 flex gap-2">
                  <input type="hidden" name="id" value={l.id} />
                  {l.status === "aktif" && (
                    <button name="status" value="dipesan" className="min-h-10 rounded-full border border-navy-900 px-4 text-sm font-semibold text-navy-900">
                      Dipesan
                    </button>
                  )}
                  <button name="status" value="selesai" className="min-h-10 rounded-full bg-yellow-400 px-4 text-sm font-semibold text-navy-900">
                    Selesai
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-8 text-lg font-semibold">Dicari saya</h2>
      {!requests?.length ? (
        <section className="mt-3 rounded-2xl border border-line p-6">
          <p className="font-semibold">Belum ada Dicari.</p>
          <Link href="/dicari/baru" className="mt-3 inline-block min-h-11 rounded-full border border-navy-900 px-5 py-3 font-semibold text-navy-900">
            Pasang Dicari
          </Link>
        </section>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {requests.map((r) => (
            <li key={r.id} className="rounded-xl border border-line p-4">
              <Link href={`/dicari/${r.id}`} className="font-semibold text-navy-900 underline">{r.title}</Link>
              <p className="text-sm text-muted">
                {STATUS_LABEL[r.status] ?? r.status} · {timeAgo(r.created_at)}
              </p>
              {r.status === "terbuka" && (
                <p className="mt-1 text-sm">
                  {(matchCount.get(r.id) ?? 0) > 0
                    ? `${matchCount.get(r.id)} buku aktif untuk mata kuliah ini sudah ada.`
                    : "Belum ada buku yang cocok."}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-10 text-lg font-semibold">Data & privasi</h2>
      <ul className="mt-3 flex flex-wrap gap-4 text-sm">
        <li><a href="/api/me/export" className={link}>Unduh dataku</a></li>
        <li><Link href="/kebijakan-privasi" className={link}>Kebijakan Privasi</Link></li>
        <li><Link href="/syarat" className={link}>Syarat Penggunaan</Link></li>
        <li><Link href="/panduan-cod" className={link}>Panduan COD</Link></li>
        <li><Link href="/akun/hapus" className="text-danger underline">Hapus akun</Link></li>
      </ul>

      <div className="mt-6 flex flex-wrap gap-3">
        <form action={signOut}>
          <button className="min-h-11 rounded-full border border-navy-900 px-6 font-semibold text-navy-900">Keluar</button>
        </form>
        <form action={signOutEverywhere}>
          <button className="min-h-11 rounded-full border border-line px-6 text-sm font-semibold">
            Keluar dari semua perangkat
          </button>
        </form>
      </div>
    </main>
  );
}
