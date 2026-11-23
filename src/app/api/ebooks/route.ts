import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { MAX_EBOOK_BYTES } from "@/lib/schemas";
import { EBOOK_BUCKET } from "@/lib/ebook";

const fail = (status: number, message: string) =>
  NextResponse.json({ message }, { status, headers: { "Cache-Control": "no-store" } });

/**
 * Langkah 1 unggah PDF: server memeriksa pengguna dan batas, lalu memberi URL unggah
 * bertanda tangan sekali pakai. Browser mengunggah langsung ke Storage (menghindari batas
 * body fungsi serverless). Isi file diperiksa ulang saat listing dibuat (createListing).
 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin || new URL(origin).host !== request.nextUrl.host) return fail(403, "Permintaan ditolak.");

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return fail(401, "Masuk dulu untuk mengunggah e-book.");

  const { data: prof } = await supabase
    .from("profiles").select("banned_at").eq("id", auth.user.id).maybeSingle();
  if (!prof || prof.banned_at) return fail(403, "Akunmu tidak bisa mengunggah e-book.");

  let size = 0;
  try {
    const body = (await request.json()) as { size?: unknown };
    size = Number(body.size);
  } catch {
    return fail(400, "Permintaan tidak valid.");
  }
  if (!Number.isFinite(size) || size <= 0) return fail(400, "File tidak terbaca.");
  if (size > MAX_EBOOK_BYTES) return fail(413, "PDF-nya kebesaran. Maksimal 20 MB.");

  const admin = createAdminClient();

  // Batas 5 unggahan PDF per jam per pengguna
  const since = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await admin
    .from("ebook_uploads").select("path", { count: "exact", head: true })
    .eq("owner_id", auth.user.id).gte("created_at", since);
  if ((count ?? 0) >= 5) return fail(429, "Terlalu banyak unggahan dalam 1 jam. Coba lagi nanti, ya.");

  const path = `${auth.user.id}/${randomUUID()}.pdf`; // nama acak (seperti foto, SEC-53)
  const signed = await admin.storage.from(EBOOK_BUCKET).createSignedUploadUrl(path);
  if (signed.error || !signed.data) return fail(500, "Gagal menyiapkan unggahan. Coba lagi.");

  const { error } = await admin.from("ebook_uploads").insert({ path, owner_id: auth.user.id });
  if (error) return fail(500, "Gagal menyiapkan unggahan. Coba lagi.");

  return NextResponse.json(
    { path, token: signed.data.token },
    { headers: { "Cache-Control": "no-store" } },
  );
}
