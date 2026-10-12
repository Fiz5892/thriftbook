"use server";

import { TAG } from "@/lib/public-data";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailHash } from "@/lib/hash";

export type DeleteState = { error?: string };

/**
 * Hapus akun (FR-18, SEC-61/62). Urutan penting:
 * 1) kumpulkan path foto, 2) jika akun diblokir simpan hash email supaya tidak bisa daftar ulang,
 * 3) hapus auth.users (cascade: profil, kontak, listing, Dicari, riwayat kontak, event;
 *    laporan yang dibuatnya dianonimkan lewat ON DELETE SET NULL), 4) hapus file foto.
 */
export async function deleteMyAccount(_prev: DeleteState, form: FormData): Promise<DeleteState> {
  if (String(form.get("confirm") ?? "").trim() !== "HAPUS") {
    return { error: "Ketik HAPUS (huruf besar) untuk konfirmasi." };
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/masuk");
  const user = auth.user;

  const admin = createAdminClient();

  const { data: photos } = await admin
    .from("listing_photos").select("path_full, path_thumb").eq("owner_id", user.id);
  const { data: profile } = await admin
    .from("profiles").select("role, banned_at").eq("id", user.id).maybeSingle();

  if (profile?.role === "admin") {
    return { error: "Akun admin tidak bisa dihapus dari sini. Turunkan role-nya dulu lewat SQL." };
  }

  if (profile?.banned_at && user.email) {
    await admin.from("banned_emails")
      .upsert({ email_sha256: emailHash(user.email) }, { onConflict: "email_sha256" });
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { error: "Akunmu gagal dihapus. Coba lagi sebentar." };

  if (photos?.length) {
    await admin.storage.from("listing-photos")
      .remove(photos.flatMap((p) => [p.path_full, p.path_thumb]));
  }

  await supabase.auth.signOut().catch(() => {});
  revalidateTag(TAG.listings, { expire: 0 });
  revalidateTag(TAG.requests, { expire: 0 });
  redirect("/?akun=dihapus");
}
