import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Service role: MELEWATI RLS. Hanya untuk aksi bertanda ★ di PRD §5.3
 * (kontak WA, upload foto, blokir, hapus akun). Jangan impor dari komponen klien.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
