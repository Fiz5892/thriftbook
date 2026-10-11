import { requireCompleteUser } from "@/lib/session";
import { ProfileForm } from "./form";

export default async function ProfilPage() {
  const { supabase, user } = await requireCompleteUser("/akun/profil");
  const [{ data: programs }, { data: p }, { data: c }] = await Promise.all([
    supabase.from("study_programs").select("id, short_name").eq("is_active", true).order("short_name"),
    supabase.from("profiles").select("display_name, study_program_id, cohort_year, is_staff").eq("id", user.id).single(),
    supabase.from("profile_contacts").select("whatsapp_e164, hidden").eq("profile_id", user.id).single(),
  ]);

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-6">
      <h1 className="text-2xl font-bold text-navy-900">Edit profil</h1>
      <ProfileForm
        programs={programs ?? []}
        initial={{
          displayName: p?.display_name ?? "",
          studyProgramId: String(p?.study_program_id ?? ""),
          cohortYear: p?.cohort_year ? String(p.cohort_year) : "",
          isStaff: Boolean(p?.is_staff),
          whatsapp: c?.whatsapp_e164 ?? "",
          hidden: Boolean(c?.hidden),
        }}
      />
    </main>
  );
}
