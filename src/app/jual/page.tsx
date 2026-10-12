import { requireCompleteUser } from "@/lib/session";
import { getPrograms } from "@/lib/public-data";
import { ListingForm } from "./form";

export default async function JualPage() {
  // Cek pengguna dan daftar prodi (ter-cache) berjalan paralel
  const [{ profile }, programs] = await Promise.all([requireCompleteUser("/jual"), getPrograms()]);

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6">
      <h1 className="text-2xl text-ink font-extrabold">Jual bukumu</h1>
      <p className="mt-1 text-muted">Foto buku kamu sendiri, ya. Foto dari internet bisa dilaporkan.</p>
      <ListingForm programs={programs} defaultProgramId={profile.study_program_id ?? undefined} />
    </main>
  );
}
