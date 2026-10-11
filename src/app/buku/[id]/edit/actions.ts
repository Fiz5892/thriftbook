"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireCompleteUser } from "@/lib/session";
import { listingSchema } from "@/lib/schemas";
import { resolveCourse } from "@/lib/courses";
import { looksLikePiracy } from "@/lib/piracy";
import { createAdminClient } from "@/lib/supabase/admin";

export type EditState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
};

const KEYS = [
  "title", "author", "course", "studyProgramId", "semester", "condition",
  "offerType", "price", "swapWish", "notes",
] as const;

// Foto tidak diubah di halaman ini. Skema posting dipakai ulang dengan foto pengganti
// supaya aturan harga/tukar/panjang teks tidak terduplikasi.
const DUMMY_PHOTO = "00000000-0000-4000-8000-000000000000";

export async function updateListing(_prev: EditState, form: FormData): Promise<EditState> {
  const id = z.string().uuid().safeParse(form.get("id"));
  if (!id.success) redirect("/akun");

  const { supabase, user } = await requireCompleteUser(`/buku/${id.data}/edit`);

  const values: Record<string, string> = {};
  for (const k of KEYS) {
    const v = form.get(k);
    if (typeof v === "string") values[k] = v;
  }

  const parsed = listingSchema.safeParse({
    ...Object.fromEntries(form),
    authenticity: "on", // sudah dinyatakan saat posting (AC-04.8); kolom DB tetap true
    photoIds: [DUMMY_PHOTO],
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) {
      if (i.path[0] === "photoIds" || i.path[0] === "authenticity") continue;
      fieldErrors[String(i.path[0])] ??= i.message;
    }
    if (Object.keys(fieldErrors).length) return { fieldErrors, values };
  }
  if (!parsed.success) return { error: "Datanya belum valid.", values };
  const v = parsed.data;

  const courseId = await resolveCourse(supabase, user.id, v.course);
  if (courseId === null) return { error: "Mata kuliah gagal disimpan. Coba lagi sebentar.", values };

  const { data, error } = await supabase.from("listings").update({
    title: v.title,
    author: v.author,
    course_id: courseId,
    study_program_id: v.studyProgramId,
    semester: v.semester,
    condition: v.condition,
    offer_type: v.offerType,
    price: v.offerType === "jual" ? v.price : null,
    swap_wish: v.offerType === "tukar" ? v.swapWish : null,
    notes: v.notes,
  }).eq("id", id.data).eq("owner_id", user.id).select("id");

  if (error || !data?.length) {
    return { error: "Perubahannya gagal disimpan. Listing mungkin sudah disembunyikan atau dihapus.", values };
  }

  if (looksLikePiracy(v.title, v.notes, v.author)) {
    await createAdminClient().from("reports").insert({
      reporter_id: null, target_listing_id: id.data, reason: "bajakan",
      note: "otomatis: kata kunci fotokopi/PDF terdeteksi (setelah edit)",
    }).then(() => {}, () => {});
  }

  revalidatePath(`/buku/${id.data}`);
  redirect(`/buku/${id.data}`);
}
