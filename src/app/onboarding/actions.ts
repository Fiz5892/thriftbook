"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { onboardingSchema } from "@/lib/schemas";
import { CONSENT_VERSION } from "@/lib/consent";

export type FormState = { error?: string; fieldErrors?: Record<string, string> };

function safeNext(raw: FormDataEntryValue | null): string {
  const s = typeof raw === "string" ? raw : "/";
  return s.startsWith("/") && !s.startsWith("//") && !s.startsWith("/\\") ? s : "/";
}

export async function completeOnboarding(_prev: FormState, form: FormData): Promise<FormState> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/masuk");

  const raw = Object.fromEntries(form);
  const parsed = onboardingSchema.safeParse({
    ...raw,
    isStaff: raw.isStaff === "on",
    cohortYear: raw.isStaff === "on" || raw.cohortYear === "" ? undefined : raw.cohortYear,
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return { fieldErrors };
  }
  const v = parsed.data;

  const { error: pErr } = await supabase.from("profiles").upsert({
    id: auth.user.id,
    display_name: v.displayName,
    study_program_id: v.studyProgramId,
    cohort_year: v.isStaff ? null : (v.cohortYear ?? null),
    consented_at: new Date().toISOString(),
    consent_version: CONSENT_VERSION,
  });
  if (pErr) return { error: "Profilmu gagal disimpan. Coba lagi sebentar." };

  const { error: cErr } = await supabase.from("profile_contacts").upsert({
    profile_id: auth.user.id,
    whatsapp_e164: v.whatsapp,
    updated_at: new Date().toISOString(),
  });
  if (cErr) return { error: "Nomor WA gagal disimpan. Coba lagi sebentar." };

  // Metrik tidak boleh menggagalkan onboarding; gagal diam-diam jika migrasi 0002 belum jalan.
  await supabase.rpc("log_event", { p_name: "signup_completed" }).then(() => {}, () => {});

  redirect(safeNext(form.get("next")));
}
