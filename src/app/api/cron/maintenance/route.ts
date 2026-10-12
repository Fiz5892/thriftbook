import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidateTag } from "next/cache";
import { TAG } from "@/lib/public-data";

const DAY = 86400_000;
const BUCKET = "listing-photos";

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // tanpa secret: tolak semua, jangan terbuka
  const given = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Pemeliharaan harian (FR-19, SEC-55, SEC-62). Vercel Cron memanggil ini dengan
 * `Authorization: Bearer $CRON_SECRET`. Idempotent: aman dijalankan ulang.
 * Memakai service role sehingga tidak butuh pg_cron di database.
 */
export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ message: "Tidak diizinkan." }, { status: 401 });
  }

  const db = createAdminClient();
  const now = Date.now();
  const iso = (msAgo: number) => new Date(now - msAgo).toISOString();
  const result: Record<string, number | string> = {};

  // 1. Listing aktif yang tidak diperbarui 60 hari → kedaluwarsa (AC-19.1)
  const l = await db.from("listings").update({ status: "kedaluwarsa" })
    .eq("status", "aktif").lt("bumped_at", iso(60 * DAY)).select("id");
  result.listing_kedaluwarsa = l.data?.length ?? 0;

  // 2. Dicari yang lewat masa aktif (AC-12.5)
  const r = await db.from("book_requests").update({ status: "kedaluwarsa" })
    .eq("status", "terbuka").lt("expires_at", new Date(now).toISOString()).select("id");
  result.dicari_kedaluwarsa = r.data?.length ?? 0;

  // 3. Retensi: riwayat kontak 90 hari, event 400 hari (SEC-62)
  const c = await db.from("contact_reveals").delete().lt("created_at", iso(90 * DAY)).select("id");
  result.riwayat_kontak_dihapus = c.data?.length ?? 0;
  const e = await db.from("events").delete().lt("created_at", iso(400 * DAY)).select("id");
  result.event_dihapus = e.data?.length ?? 0;

  // 4. Foto yatim: diunggah tapi tak pernah dipakai listing > 1 jam (SEC-55)
  const orphans = await db.from("listing_photos")
    .select("id, path_full, path_thumb").is("listing_id", null).lt("created_at", iso(3600_000));
  if (orphans.data?.length) {
    await db.storage.from(BUCKET).remove(orphans.data.flatMap((p) => [p.path_full, p.path_thumb]));
    await db.from("listing_photos").delete().in("id", orphans.data.map((p) => p.id));
  }
  result.foto_yatim_dihapus = orphans.data?.length ?? 0;

  // 5. Listing selesai > 30 hari: buang foto penuh, sisakan thumbnail (D-10)
  const done = await db.from("listings").select("id").eq("status", "selesai").lt("updated_at", iso(30 * DAY)).limit(500);
  let slimmed = 0;
  if (done.data?.length) {
    const ph = await db.from("listing_photos")
      .select("id, path_full, path_thumb").in("listing_id", done.data.map((x) => x.id));
    const todo = (ph.data ?? []).filter((p) => p.path_full !== p.path_thumb);
    if (todo.length) {
      await db.storage.from(BUCKET).remove(todo.map((p) => p.path_full));
      for (const p of todo) {
        await db.from("listing_photos").update({ path_full: p.path_thumb, bytes_full: null }).eq("id", p.id);
      }
      slimmed = todo.length;
    }
  }
  result.foto_penuh_dibuang = slimmed;

  // 6. Antrean penghapusan file yang tersisa
  const q = await db.from("storage_deletion_queue").select("path").limit(500);
  if (q.data?.length) {
    await db.storage.from(BUCKET).remove(q.data.map((x) => x.path));
    await db.from("storage_deletion_queue").delete().in("path", q.data.map((x) => x.path));
  }
  result.antrean_dihapus = q.data?.length ?? 0;

  // Listing/Dicari yang baru kedaluwarsa harus hilang dari cache publik sekarang juga
  revalidateTag(TAG.listings, { expire: 0 });
  revalidateTag(TAG.requests, { expire: 0 });

  return NextResponse.json({ ok: true, ...result }, { headers: { "Cache-Control": "no-store" } });
}
