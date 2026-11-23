"use server";

import { TAG } from "@/lib/public-data";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireCompleteUser } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { listingSchema, normalizeCourseName, programOtherError, OTHER_PROGRAM_SLUG } from "@/lib/schemas";
import { verifyEbookUpload } from "@/lib/ebook";
import { looksLikePiracy } from "@/lib/piracy";

export type ListingFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  /** Isian yang dikirim, dikembalikan agar form tidak kosong setelah gagal (React 19 mereset form). */
  values?: Record<string, string>;
};

const FIELD_KEYS = [
  "format", "title", "author", "course", "studyProgramId", "studyProgramOther", "semester", "condition",
  "offerType", "price", "swapWish", "notes", "authenticity", "ebookPath",
] as const;

function echo(form: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of FIELD_KEYS) {
    const v = form.get(k);
    if (typeof v === "string") out[k] = v;
  }
  return out;
}

// Kode error trigger kuota di database → pesan ramah (AC-04.6, AC-04.7)
const DB_ERRORS: Record<string, string> = {
  "54000": "Batas posting tercapai (maks 10 listing per hari dan 40 listing aktif). Tandai buku yang sudah laku dulu, atau coba lagi besok.",
};

export async function createListing(
  _prev: ListingFormState,
  form: FormData,
): Promise<ListingFormState> {
  const { supabase, user } = await requireCompleteUser("/jual");

  const parsed = listingSchema.safeParse({
    ...Object.fromEntries(form),
    photoIds: form.getAll("photoIds").map(String),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return { fieldErrors, values: echo(form) };
  }
  const v = parsed.data;
  const isEbook = v.format === "ebook";

  // Prodi "Lainnya" wajib diisi nama prodinya (dicek terhadap data, bukan id yang di-hardcode)
  const { data: prog } = await supabase
    .from("study_programs").select("slug").eq("id", v.studyProgramId).maybeSingle();
  if (!prog) return { fieldErrors: { studyProgramId: "Prodi tidak valid" }, values: echo(form) };
  const isOther = prog.slug === OTHER_PROGRAM_SLUG;
  const otherErr = programOtherError(isOther, v.studyProgramOther);
  if (otherErr) return { fieldErrors: { studyProgramOther: otherErr }, values: echo(form) };

  // Cari atau buat mata kuliah (dedup lewat name_norm, D-06)
  const norm = normalizeCourseName(v.course);
  if (norm.length < 2) {
    return { fieldErrors: { course: "Isi mata kuliah dengan huruf atau angka" }, values: echo(form) };
  }

  let courseId: number | null = null;
  {
    const found = await supabase.from("courses").select("id, merged_into").eq("name_norm", norm).maybeSingle();
    if (found.data) courseId = found.data.merged_into ?? found.data.id;
  }
  if (courseId === null) {
    const ins = await supabase
      .from("courses").insert({ name: v.course, created_by: user.id }).select("id").single();
    if (ins.data) {
      courseId = ins.data.id;
    } else {
      // Balapan dengan pengguna lain yang baru membuat MK yang sama
      const again = await supabase.from("courses").select("id, merged_into").eq("name_norm", norm).maybeSingle();
      if (again.data) courseId = again.data.merged_into ?? again.data.id;
    }
  }
  if (courseId === null) {
    return { error: "Mata kuliah gagal disimpan. Coba lagi sebentar.", values: echo(form) };
  }

  const admin = createAdminClient();

  // E-book: periksa isi file PDF-nya di server (bukan percaya klien)
  let ebookBytes: number | null = null;
  if (isEbook) {
    const check = await verifyEbookUpload(admin, user.id, v.ebookPath!);
    if (!check.ok) return { fieldErrors: { ebookPath: check.message }, values: echo(form) };
    ebookBytes = check.bytes;
  }

  // Foto harus milik pengguna ini dan belum terikat listing lain
  const { data: photos } = v.photoIds.length
    ? await admin.from("listing_photos").select("id")
        .in("id", v.photoIds).eq("owner_id", user.id).is("listing_id", null)
    : { data: [] as { id: string }[] };
  if (!photos || photos.length !== v.photoIds.length) {
    return {
      fieldErrors: { photoIds: "Ada foto yang tidak valid. Unggah ulang fotonya." },
      values: echo(form),
    };
  }

  const { data: listing, error } = await supabase.from("listings").insert({
    owner_id: user.id,
    title: v.title,
    author: v.author,
    course_id: courseId,
    study_program_id: v.studyProgramId,
    study_program_other: isOther ? v.studyProgramOther : null,
    semester: v.semester,
    format: v.format,
    condition: isEbook ? null : v.condition,
    ebook_path: isEbook ? v.ebookPath : null,
    ebook_bytes: ebookBytes,
    offer_type: v.offerType,
    price: v.offerType === "jual" ? v.price : null,
    swap_wish: v.offerType === "tukar" ? v.swapWish : null,
    notes: v.notes,
    authenticity_confirmed: true,
  }).select("id").single();

  if (error || !listing) {
    return {
      error: DB_ERRORS[error?.code ?? ""] ?? "Bukumu gagal diposting. Coba lagi sebentar.",
      values: echo(form),
    };
  }

  // Ikat foto sesuai urutan yang dipilih (tulis foto hanya lewat server, SEC-16)
  for (const [position, id] of v.photoIds.entries()) {
    await admin.from("listing_photos").update({ listing_id: listing.id, position }).eq("id", id);
  }

  // Kata kunci mencurigakan: tetap tayang, tapi masuk antrean admin (SEC-40)
  // PDF yang sudah dipakai tidak lagi dianggap yatim oleh cron pembersih
  if (isEbook) await admin.from("ebook_uploads").delete().eq("path", v.ebookPath!);

  // E-book memang berupa PDF, jadi kata kunci PDF tidak perlu ditandai otomatis
  if (!isEbook && looksLikePiracy(v.title, v.notes, v.author)) {
    await admin.from("reports").insert({
      reporter_id: null,
      target_listing_id: listing.id,
      reason: "bajakan",
      note: "otomatis: kata kunci fotokopi/PDF terdeteksi",
    }).then(() => {}, () => {});
  }

  await supabase.rpc("log_event", {
    p_name: "listing_created",
    p_props: { listing_id: listing.id, offer_type: v.offerType, format: v.format },
  }).then(() => {}, () => {});

  revalidateTag(TAG.listings, { expire: 0 }); // listing baru langsung muncul di beranda/landing
  redirect(`/buku/${listing.id}?baru=1`);
}
