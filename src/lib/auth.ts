import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export type Viewer = {
  id: string;
  email: string | null;
  fullName: string | null;
};

/**
 * Identitas pengguna untuk jalur RENDER halaman.
 *
 * Memakai getClaims(): tanda tangan JWT (ES256) diverifikasi secara lokal dengan JWKS yang
 * di-cache, ±2 ms, tanpa panggilan ke server Auth. getUser() selalu ke server Auth (±150 ms
 * dari region yang berbeda) dan dulu dipanggil 2–3 kali per halaman.
 *
 * Keamanannya setara untuk membaca data: setiap query tetap divalidasi ulang oleh PostgREST + RLS.
 * Yang tidak terdeteksi hanya pencabutan sesi sebelum JWT kedaluwarsa (≤ 1 jam); untuk itu alur
 * sensitif (route handler upload/kontak/ekspor, callback OAuth) tetap memakai getUser().
 */
export async function getViewer(supabase: SupabaseClient): Promise<Viewer | null> {
  const { data, error } = await supabase.auth.getClaims();
  const c = data?.claims;
  if (error || !c?.sub) return null;
  const meta = (c.user_metadata ?? {}) as { full_name?: string; name?: string };
  return {
    id: c.sub,
    email: typeof c.email === "string" ? c.email : null,
    fullName: meta.full_name ?? meta.name ?? null,
  };
}
