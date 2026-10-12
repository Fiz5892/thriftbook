import { notFound } from "next/navigation";
import { requireCompleteUser } from "@/lib/session";
import { getPrograms } from "@/lib/public-data";
import { EditForm } from "./form";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const { supabase, user } = await requireCompleteUser(`/buku/${id}/edit`);

  const { data: l } = await supabase
    .from("listings")
    .select("id, owner_id, title, author, course_name_snapshot, study_program_id, semester, condition, offer_type, price, swap_wish, notes, status, hidden_at")
    .eq("id", id).maybeSingle();
  if (!l || l.owner_id !== user.id) notFound();

  if (l.hidden_at || l.status === "selesai") {
    return (
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6">
        <h1 className="text-2xl text-ink font-extrabold">Edit buku</h1>
        <p className="card mt-3 px-4 py-3 text-muted">
          {l.hidden_at
            ? "Listing ini disembunyikan moderator, jadi tidak bisa diedit."
            : "Listing yang sudah selesai tidak bisa diedit. Gunakan posting ulang untuk buku yang sama."}
        </p>
      </main>
    );
  }

  const { data: programs } = await getPrograms().then((data) => ({ data }));

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6">
      <h1 className="text-2xl text-ink font-extrabold">Edit buku</h1>
      <p className="mt-1 text-muted">Untuk mengganti foto, hapus listing lalu posting ulang.</p>
      <EditForm
        id={l.id}
        programs={programs ?? []}
        initial={{
          title: l.title,
          author: l.author ?? "",
          course: l.course_name_snapshot,
          studyProgramId: String(l.study_program_id),
          semester: l.semester ? String(l.semester) : "",
          condition: l.condition,
          offerType: l.offer_type,
          price: l.price ? String(l.price) : "",
          swapWish: l.swap_wish ?? "",
          notes: l.notes ?? "",
        }}
      />
    </main>
  );
}
