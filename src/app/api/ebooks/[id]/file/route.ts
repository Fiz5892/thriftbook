import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { EBOOK_BUCKET } from "@/lib/ebook";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const deny = (status: number, message: string) =>
  NextResponse.json({ message }, { status, headers: { "Cache-Control": "no-store" } });

/**
 * Tautan baca/unduh e-book. Bucket privat, jadi tidak ada URL tetap: setiap permintaan
 * dicek haknya (pemilik, admin, atau pembeli yang sudah checkout) lalu dialihkan ke URL
 * bertanda tangan berumur 60 detik. `?unduh=1` memaksa unduhan, tanpa itu dibuka di browser.
 */
export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!UUID.test(id)) return deny(404, "E-book tidak ditemukan.");

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    const next = encodeURIComponent(`/buku/${id}`);
    return NextResponse.redirect(new URL(`/masuk?next=${next}`, request.url));
  }

  const admin = createAdminClient();
  const [{ data: l }, { data: prof }] = await Promise.all([
    admin.from("listings").select("owner_id, title, format, ebook_path, hidden_at").eq("id", id).maybeSingle(),
    admin.from("profiles").select("role, banned_at").eq("id", auth.user.id).maybeSingle(),
  ]);
  if (!l || l.format !== "ebook" || !l.ebook_path) return deny(404, "E-book tidak ditemukan.");
  if (!prof || prof.banned_at) return deny(403, "Akunmu tidak bisa mengakses e-book.");

  const isOwner = l.owner_id === auth.user.id;
  const isAdmin = prof.role === "admin";
  if (!isOwner && !isAdmin) {
    if (l.hidden_at) return deny(404, "E-book tidak ditemukan.");
    const { data: order } = await admin
      .from("ebook_orders").select("id").eq("listing_id", id).eq("buyer_id", auth.user.id)
      .eq("status", "lunas").maybeSingle();
    if (!order) return deny(403, "Checkout e-book ini dulu untuk membukanya.");
  }

  const download = request.nextUrl.searchParams.get("unduh") === "1";
  const filename = `${l.title.replace(/[^\w\s.-]+/g, "").trim().slice(0, 80) || "ebook"}.pdf`;
  const signed = await admin.storage.from(EBOOK_BUCKET).createSignedUrl(
    l.ebook_path, 60, download ? { download: filename } : undefined,
  );
  if (signed.error || !signed.data) return deny(500, "Filenya gagal dibuka. Coba lagi sebentar.");

  return NextResponse.redirect(signed.data.signedUrl, {
    status: 302,
    headers: { "Cache-Control": "no-store" },
  });
}
