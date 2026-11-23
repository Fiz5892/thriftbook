import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Unduh data pribadi (FR-18, SEC-61). Hanya data milik pengguna; identitas pengguna lain
 * tidak ikut. RLS menjamin setiap kueri hanya mengembalikan baris miliknya.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ message: "Masuk dulu." }, { status: 401 });
  }
  const uid = auth.user.id;

  const [profile, contact, listings, requests, reveals, reviews, orders] = await Promise.all([
    supabase.from("profiles").select("display_name, study_program_id, cohort_year, is_staff, consented_at, consent_version, created_at").eq("id", uid).maybeSingle(),
    supabase.from("profile_contacts").select("whatsapp_e164, hidden, updated_at").eq("profile_id", uid).maybeSingle(),
    supabase.from("listings").select("id, title, author, semester, format, study_program_other, ebook_bytes, condition, offer_type, price, swap_wish, notes, status, created_at, courses:course_id(name), listing_photos(path_full)").eq("owner_id", uid),
    supabase.from("book_requests").select("id, title, semester, accepts, max_budget, notes, status, expires_at, created_at").eq("requester_id", uid),
    // Hanya jenis dan waktu; identitas pemilik yang dihubungi sengaja tidak disertakan
    supabase.from("contact_reveals").select("listing_id, request_id, created_at").eq("viewer_id", uid),
    supabase.from("reviews").select("listing_id, rating, comment, created_at").eq("reviewer_id", uid),
    supabase.from("ebook_orders").select("listing_id, status, created_at").eq("buyer_id", uid),
  ]);

  const body = {
    diekspor_pada: new Date().toISOString(),
    email: auth.user.email,
    profil: profile.data,
    kontak: contact.data,
    listing: listings.data ?? [],
    dicari: requests.data ?? [],
    riwayat_membuka_kontak: reveals.data ?? [],
    ulasan: reviews.data ?? [],
    checkout_ebook: orders.data ?? [],
  };

  return new NextResponse(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="data-thriftbook.json"',
      "Cache-Control": "no-store",
    },
  });
}
