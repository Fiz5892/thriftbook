import { requireCompleteUser } from "@/lib/session";
import { ListingForm } from "./form";

export default async function JualPage() {
  const { supabase, profile } = await requireCompleteUser("/jual");
  const { data: programs } = await supabase
    .from("study_programs").select("id, short_name").eq("is_active", true).order("short_name");

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6">
      <h1 className="text-2xl text-ink font-extrabold">Jual bukumu</h1>
      <p className="mt-1 text-muted">Foto buku kamu sendiri, ya. Foto dari internet bisa dilaporkan.</p>
      <ListingForm programs={programs ?? []} defaultProgramId={profile.study_program_id ?? undefined} />
    </main>
  );
}
