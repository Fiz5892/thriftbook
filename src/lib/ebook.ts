import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { MAX_EBOOK_BYTES } from "./schemas";

export const EBOOK_BUCKET = "ebooks";
const PATH = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.pdf$/i;

export type EbookCheck = { ok: true; bytes: number } | { ok: false; message: string };

/**
 * Pastikan PDF benar-benar milik pengguna ini, belum dipakai, dan isinya PDF sungguhan
 * (tanda "%PDF-" di awal file, bukan ekstensi/Content-Type) dengan ukuran yang wajar.
 * Membaca hanya 5 byte pertama lewat Range, bukan seluruh file.
 */
export async function verifyEbookUpload(
  admin: SupabaseClient, userId: string, path: string,
): Promise<EbookCheck> {
  const bad = { ok: false, message: "File PDF-nya tidak valid. Unggah ulang, ya." } as const;
  if (!PATH.test(path) || !path.startsWith(`${userId}/`)) return bad;

  const { data: row } = await admin
    .from("ebook_uploads").select("path").eq("path", path).eq("owner_id", userId).maybeSingle();
  if (!row) return bad;

  const signed = await admin.storage.from(EBOOK_BUCKET).createSignedUrl(path, 30);
  if (signed.error || !signed.data) return { ok: false, message: "PDF belum selesai terunggah. Coba lagi." };

  let res: Response;
  try {
    res = await fetch(signed.data.signedUrl, { headers: { Range: "bytes=0-4" } });
  } catch {
    return { ok: false, message: "PDF belum bisa diperiksa. Coba lagi sebentar." };
  }
  if (!res.ok) return { ok: false, message: "PDF belum selesai terunggah. Coba lagi." };

  const head = Buffer.from(await res.arrayBuffer()).subarray(0, 5).toString("latin1");
  // 206 membawa ukuran total di Content-Range; bila Range diabaikan (200) pakai Content-Length
  const total = Number(
    /\/(\d+)$/.exec(res.headers.get("content-range") ?? "")?.[1] ?? res.headers.get("content-length") ?? NaN,
  );
  if (head !== "%PDF-") return { ok: false, message: "File itu bukan PDF. Pilih file berekstensi .pdf." };
  if (!Number.isFinite(total) || total < 1 || total > MAX_EBOOK_BYTES) {
    return { ok: false, message: "Ukuran PDF tidak valid (maksimal 20 MB)." };
  }
  return { ok: true, bytes: total };
}
