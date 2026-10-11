import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Pengguna login + profil + kontak, atau redirect ke alur yang tepat. */
export async function requireCompleteUser(nextPath: string) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser(); // bukan getSession() (SEC-06)
  if (!data.user) redirect(`/masuk?next=${encodeURIComponent(nextPath)}`);

  const [{ data: profile }, { data: contact }] = await Promise.all([
    supabase.from("profiles").select("id, display_name, study_program_id, banned_at").eq("id", data.user.id).maybeSingle(),
    supabase.from("profile_contacts").select("profile_id").eq("profile_id", data.user.id).maybeSingle(),
  ]);

  if (profile?.banned_at) redirect("/diblokir");
  if (!profile || !contact) redirect(`/onboarding?next=${encodeURIComponent(nextPath)}`);

  return { supabase, user: data.user, profile };
}
