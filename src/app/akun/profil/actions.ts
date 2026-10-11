"use server";

import { revalidatePath } from "next/cache";
import { requireCompleteUser } from "@/lib/session";
import { normalizeWhatsapp } from "@/lib/whatsapp";

export type ProfileState = { ok?: string; error?: string; fieldErrors?: Record<string, string> };

export async function updateProfile(_prev: ProfileState, form: FormData): Promise<ProfileState> {
  const { supabase, user } = await requireCompleteUser("/akun/profil");

  const displayName = String(form.get("displayName") ?? "").trim();
  const studyProgramId = Number(form.get("studyProgramId"));
  const isStaff = form.get("isStaff") === "on";
  const cohortRaw = String(form.get("cohortYear") ?? "").trim();
  const hidden = form.get("hidden") === "on";
  const wa = normalizeWhatsapp(String(form.get("whatsapp") ?? ""));

  const fieldErrors: Record<string, string> = {};
  if (displayName.length < 2 || displayName.length > 40) fieldErrors.displayName = "Nama 2–40 karakter";
  if (!Number.isInteger(studyProgramId) || studyProgramId <= 0) fieldErrors.studyProgramId = "Pilih prodi";
  if (!wa) fieldErrors.whatsapp = "Nomor WA harus diawali 08 atau 62, 10–13 digit.";
  let cohort: number | null = null;
  if (!isStaff && cohortRaw) {
    cohort = Number(cohortRaw);
    if (!Number.isInteger(cohort) || cohort < 2015 || cohort > new Date().getFullYear()) {
      fieldErrors.cohortYear = "Angkatan tidak valid";
    }
  }
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const { error: pErr } = await supabase.from("profiles").update({
    display_name: displayName,
    study_program_id: studyProgramId,
    cohort_year: isStaff ? null : cohort,
  }).eq("id", user.id);
  if (pErr) return { error: "Profilmu gagal disimpan. Coba lagi sebentar." };

  const { error: cErr } = await supabase.from("profile_contacts").update({
    whatsapp_e164: wa!, hidden, updated_at: new Date().toISOString(),
  }).eq("profile_id", user.id);
  if (cErr) return { error: "Nomor WA gagal disimpan. Coba lagi sebentar." };

  revalidatePath("/akun");
  return { ok: "Tersimpan." };
}
