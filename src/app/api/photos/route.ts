import { NextResponse, type NextRequest } from "next/server";
import sharp, { type Metadata } from "sharp";
import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_BYTES = 2 * 1024 * 1024; // SEC-50
const MAX_SIDE_IN = 8000;
const MIN_SIDE_IN = 300;
const BUCKET = "listing-photos";

const fail = (status: number, message: string) =>
  NextResponse.json({ message }, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin || new URL(origin).host !== request.nextUrl.host) return fail(403, "Permintaan ditolak.");

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return fail(401, "Masuk dulu untuk mengunggah foto.");

  const { data: prof } = await supabase
    .from("profiles").select("banned_at").eq("id", auth.user.id).maybeSingle();
  if (!prof || prof.banned_at) return fail(403, "Akunmu tidak bisa mengunggah foto.");

  const admin = createAdminClient();

  // Rate limit: 30 foto/jam per pengguna (PRD §5.3)
  const since = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await admin
    .from("listing_photos").select("id", { count: "exact", head: true })
    .eq("owner_id", auth.user.id).gte("created_at", since);
  if ((count ?? 0) >= 30) return fail(429, "Terlalu banyak foto dalam 1 jam. Coba lagi nanti, ya.");

  const len = Number(request.headers.get("content-length") ?? 0);
  if (len > MAX_BYTES + 50_000) return fail(413, "Fotonya kebesaran. Coba foto ulang atau pilih yang lain.");

  let file: File | null = null;
  try {
    const form = await request.formData();
    const f = form.get("file");
    file = f instanceof File ? f : null;
  } catch {
    return fail(400, "Fotonya tidak terbaca. Coba lagi.");
  }
  if (!file) return fail(400, "Pilih foto dulu.");
  if (file.size > MAX_BYTES) return fail(413, "Fotonya kebesaran. Coba foto ulang atau pilih yang lain.");

  const input = Buffer.from(await file.arrayBuffer());

  // Validasi dari ISI file, bukan ekstensi/Content-Type (SEC-51)
  let meta: Metadata;
  try {
    meta = await sharp(input, { limitInputPixels: MAX_SIDE_IN * MAX_SIDE_IN }).metadata();
  } catch {
    return fail(415, "Pakai foto JPG, PNG, atau WebP.");
  }
  if (!meta.format || !["jpeg", "png", "webp"].includes(meta.format)) {
    return fail(415, "Pakai foto JPG, PNG, atau WebP.");
  }
  if (!meta.width || !meta.height || Math.min(meta.width, meta.height) < MIN_SIDE_IN) {
    return fail(422, "Fotonya terlalu kecil. Minimal 300 px.");
  }

  // Re-encode selalu: terapkan orientasi, buang SEMUA metadata termasuk GPS (SEC-52)
  const base = sharp(input, { limitInputPixels: MAX_SIDE_IN * MAX_SIDE_IN }).rotate();
  let full = await base.clone().resize(1280, 1280, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 75 }).toBuffer({ resolveWithObject: true });
  if (full.data.length > 300 * 1024) {
    full = await base.clone().resize(1280, 1280, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 60 }).toBuffer({ resolveWithObject: true });
  }
  if (full.data.length > 300 * 1024) return fail(422, "Fotonya terlalu detail. Coba foto yang lebih sederhana.");

  const thumb = await base.clone().resize(400, 400, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 70 }).toBuffer();

  const id = randomUUID(); // nama file acak (SEC-53)
  const pathFull = `listings/${id}.webp`;
  const pathThumb = `listings/${id}_t.webp`;

  const up = await Promise.all([
    admin.storage.from(BUCKET).upload(pathFull, full.data, {
      contentType: "image/webp", cacheControl: "31536000", upsert: false,
    }),
    admin.storage.from(BUCKET).upload(pathThumb, thumb, {
      contentType: "image/webp", cacheControl: "31536000", upsert: false,
    }),
  ]);
  if (up.some((u) => u.error)) {
    await admin.storage.from(BUCKET).remove([pathFull, pathThumb]);
    return fail(500, "Fotonya gagal keunggah. Cek sinyalmu, lalu coba lagi.");
  }

  const { error } = await admin.from("listing_photos").insert({
    id, owner_id: auth.user.id, path_full: pathFull, path_thumb: pathThumb,
    width: full.info.width, height: full.info.height,
    bytes_full: full.data.length, bytes_thumb: thumb.length,
  });
  if (error) {
    await admin.storage.from(BUCKET).remove([pathFull, pathThumb]);
    return fail(500, "Fotonya gagal disimpan. Coba lagi.");
  }

  return NextResponse.json({ id, thumb: pathThumb }, {
    headers: { "Cache-Control": "no-store" },
  });
}
