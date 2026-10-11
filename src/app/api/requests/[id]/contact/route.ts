import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildWaLink } from "@/lib/whatsapp";

const Params = z.object({ id: z.string().uuid() });
const noStore = { "Cache-Control": "no-store" };
const reply = (status: number, message: string) =>
  NextResponse.json({ message }, { status, headers: noStore });

/**
 * Buka kontak pembuat Dicari. Aturan sama dengan reveal_listing_contact (SEC-21):
 * login, tidak diblokir, target terbuka, bukan milik sendiri, batas 5/menit dan 30 unik/24 jam
 * (10 untuk akun < 24 jam), dicatat di contact_reveals.
 */
export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const origin = request.headers.get("origin");
  if (!origin || new URL(origin).host !== request.nextUrl.host) return reply(403, "Permintaan ditolak.");

  const parsed = Params.safeParse(await ctx.params);
  if (!parsed.success) return reply(404, "Dicari ini tidak ditemukan.");
  const id = parsed.data.id;

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return reply(401, "Masuk dulu untuk menghubungi.");

  const admin = createAdminClient();

  const { data: me } = await admin.from("profiles").select("banned_at").eq("id", user.id).maybeSingle();
  if (!me || me.banned_at) return reply(403, "Akunmu tidak bisa menghubungi orang lain.");

  const { data: r } = await admin
    .from("book_requests")
    .select("id, requester_id, title, status, hidden_at, expires_at")
    .eq("id", id).maybeSingle();
  const gone = !r || r.status !== "terbuka" || r.hidden_at || new Date(r.expires_at) <= new Date();
  if (gone) return reply(404, "Dicari ini sudah tidak aktif.");
  if (r.requester_id === user.id) return reply(400, "Ini Dicari-mu sendiri.");

  const { data: owner } = await admin
    .from("profiles").select("banned_at").eq("id", r.requester_id).maybeSingle();
  if (!owner || owner.banned_at) return reply(404, "Dicari ini sudah tidak aktif.");

  const now = Date.now();
  const { count: lastMinute } = await admin.from("contact_reveals")
    .select("id", { count: "exact", head: true })
    .eq("viewer_id", user.id).gte("created_at", new Date(now - 60_000).toISOString());
  if ((lastMinute ?? 0) >= 5) {
    return reply(429, "Pelan-pelan, ya. Coba lagi sebentar lagi.");
  }

  const { data: recent } = await admin.from("contact_reveals")
    .select("listing_id, request_id")
    .eq("viewer_id", user.id).gte("created_at", new Date(now - 86400_000).toISOString());
  const targets = new Set((recent ?? []).map((x) => x.listing_id ?? x.request_id));
  if (!targets.has(id)) {
    const young = now - new Date(user.created_at).getTime() < 86400_000;
    if (targets.size >= 30 || (young && targets.size >= 10)) {
      return reply(429, "Kamu sudah menghubungi terlalu banyak orang hari ini. Lanjut besok, ya.");
    }
  }

  const { data: contact } = await admin
    .from("profile_contacts").select("whatsapp_e164, hidden").eq("profile_id", r.requester_id).maybeSingle();
  if (!contact || contact.hidden) return reply(404, "Pembuat Dicari sedang tidak menerima chat.");

  const { error } = await admin.from("contact_reveals").insert({ viewer_id: user.id, request_id: id });
  if (error) return reply(500, "Ada yang error di sisi kami, bukan salahmu. Coba lagi sebentar.");

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin;
  const text = `Halo, aku lihat kamu cari "${r.title}" di thriftbook (${site}/dicari/${id}). Aku punya, mau lihat?`;
  return NextResponse.json({ url: buildWaLink(contact.whatsapp_e164, text) }, { headers: noStore });
}
