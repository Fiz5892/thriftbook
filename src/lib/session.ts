import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/auth";

/** Pengguna login + profil + kontak, atau redirect ke alur yang tepat. */
export async function requireCompleteUser(nextPath: string) {
  const supabase = await createClient();
  // JWT diverifikasi lokal (bukan getSession(), SEC-06). Status blokir dicek dari database di bawah.
  const user = await getViewer(supabase);
  if (!user) redirect(`/masuk?next=${encodeURIComponent(nextPath)}`);

  const [{ data: profile }, { data: contact }] = await Promise.all([
    supabase.from("profiles").select("id, display_name, study_program_id, banned_at").eq("id", user.id).maybeSingle(),
    supabase.from("profile_contacts").select("profile_id").eq("profile_id", user.id).maybeSingle(),
  ]);

  if (profile?.banned_at) redirect("/diblokir");
  if (!profile || !contact) redirect(`/onboarding?next=${encodeURIComponent(nextPath)}`);

  return { supabase, user, profile };
}
