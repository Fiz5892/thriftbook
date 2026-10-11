import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "./form";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/masuk?next=/onboarding");

  const [{ data: programs }, { data: profile }] = await Promise.all([
    supabase.from("study_programs").select("id, short_name").eq("is_active", true).order("short_name"),
    supabase.from("profiles").select("display_name, study_program_id, cohort_year").eq("id", auth.user.id).maybeSingle(),
  ]);

  const guess = (auth.user.user_metadata?.full_name as string | undefined)?.split(" ")[0] ?? "";

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-8">
      <h1 className="text-2xl text-ink font-extrabold">Satu langkah lagi</h1>
      <p className="mt-2 text-muted">
        Cukup sekali. Nama dan prodi tampil di listing; nomor WA hanya dikirim ke mahasiswa UM yang
        login dan mengetuk tombol chat, maksimal 30 orang per hari per akun. Pakai nomor yang memang
        kamu pakai buat jual-beli.
      </p>
      <OnboardingForm
        programs={programs ?? []}
        next={next ?? "/"}
        defaults={{
          displayName: profile?.display_name ?? guess,
          studyProgramId: profile?.study_program_id ?? undefined,
          cohortYear: profile?.cohort_year ?? undefined,
        }}
      />
    </main>
  );
}
