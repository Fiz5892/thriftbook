"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailHash } from "@/lib/hash";

const Input = z.object({
  intent: z.enum(["hide", "dismiss", "unhide", "ban", "unban"]),
  kind: z.enum(["listing", "request", "profile"]),
  targetId: z.string().uuid(),
  reason: z.string().trim().min(5, "Alasan minimal 5 karakter").max(300),
});

const TABLE = { listing: "listings", request: "book_requests" } as const;
const REPORT_COL = {
  listing: "target_listing_id", request: "target_request_id", profile: "target_profile_id",
} as const;

export type ModerateState = { ok?: string; error?: string };

/**
 * Satu pintu untuk semua aksi moderasi. Tulis lewat klien admin-RLS (lapisan kedua),
 * kecuali pencabutan sesi/ban auth yang butuh service role. Setiap aksi tercatat
 * di moderation_actions (append-only, AC-15.3).
 */
export async function moderate(_prev: ModerateState, form: FormData): Promise<ModerateState> {
  const { supabase, user } = await requireAdmin();

  const parsed = Input.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Input tidak valid." };
  const { intent, kind, targetId, reason } = parsed.data;
  const now = new Date().toISOString();
  const resolve = (status: "ditindak" | "ditolak") =>
    supabase.from("reports")
      .update({ status, resolved_at: now })
      .eq(REPORT_COL[kind], targetId).eq("status", "baru");

  if (intent === "hide" && kind !== "profile") {
    const { error } = await supabase.from(TABLE[kind])
      .update({ hidden_at: now, hidden_reason: reason }).eq("id", targetId);
    if (error) return { error: "Gagal menyembunyikan. Coba lagi." };
    await resolve("ditindak");
  } else if (intent === "unhide" && kind !== "profile") {
    const { error } = await supabase.from(TABLE[kind])
      .update({ hidden_at: null, hidden_reason: null }).eq("id", targetId);
    if (error) return { error: "Gagal menampilkan lagi. Coba lagi." };
  } else if (intent === "dismiss") {
    if (kind === "listing") {
      // Pulihkan listing yang tersembunyi otomatis karena 3 laporan (AC-15.4)
      await supabase.from("listings")
        .update({ hidden_at: null, hidden_reason: null })
        .eq("id", targetId).eq("hidden_reason", "auto_3_reports");
    }
    await resolve("ditolak");
  } else if ((intent === "ban" || intent === "unban") && kind === "profile") {
    if (targetId === user.id) return { error: "Kamu tidak bisa memblokir dirimu sendiri." };
    const admin = createAdminClient();

    const { data: target } = await admin
      .from("profiles").select("role").eq("id", targetId).maybeSingle();
    if (!target) return { error: "Pengguna tidak ditemukan." };
    if (target.role === "admin") return { error: "Admin tidak bisa diblokir dari panel ini." };

    if (intent === "ban") {
      const { error } = await supabase.from("profiles")
        .update({ banned_at: now, ban_reason: reason }).eq("id", targetId);
      if (error) return { error: "Gagal memblokir. Coba lagi." };

      // Blokir di level Auth: sesi dan refresh token tidak bisa dipakai lagi (AC-16.1)
      await admin.auth.admin.updateUserById(targetId, { ban_duration: "876000h" });

      // Hash email agar tidak bisa mendaftar ulang setelah hapus akun (SEC-34)
      const { data: u } = await admin.auth.admin.getUserById(targetId);
      if (u.user?.email) {
        await admin.from("banned_emails")
          .upsert({ email_sha256: emailHash(u.user.email) }, { onConflict: "email_sha256" });
      }
      await resolve("ditindak");
    } else {
      const { error } = await supabase.from("profiles")
        .update({ banned_at: null, ban_reason: null }).eq("id", targetId);
      if (error) return { error: "Gagal membuka blokir. Coba lagi." };
      await admin.auth.admin.updateUserById(targetId, { ban_duration: "none" });
      const { data: u } = await admin.auth.admin.getUserById(targetId);
      if (u.user?.email) {
        await admin.from("banned_emails").delete().eq("email_sha256", emailHash(u.user.email));
      }
    }
  } else {
    return { error: "Aksi tidak valid untuk target ini." };
  }

  const { error: logErr } = await supabase.from("moderation_actions").insert({
    admin_id: user.id,
    action: `${intent}_${kind}`,
    target_id: targetId,
    reason,
  });
  if (logErr) return { error: "Aksi berhasil, tapi gagal dicatat di riwayat. Segera cek manual." };

  revalidatePath("/admin");
  revalidatePath("/admin/riwayat");
  return { ok: "Tersimpan." };
}
