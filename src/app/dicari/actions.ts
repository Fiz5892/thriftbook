"use server";

import { TAG } from "@/lib/public-data";
import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { requireCompleteUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { requestSchema } from "@/lib/schemas";
import { resolveCourse } from "@/lib/courses";

export type RequestFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
};

const KEYS = ["title", "course", "studyProgramId", "semester", "maxBudget", "notes"] as const;

function echo(form: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of KEYS) {
    const v = form.get(k);
    if (typeof v === "string") out[k] = v;
  }
  out.accepts = form.getAll("accepts").map(String).join(",");
  return out;
}

export async function createRequest(
  _prev: RequestFormState,
  form: FormData,
): Promise<RequestFormState> {
  const { supabase, user } = await requireCompleteUser("/dicari/baru");

  const parsed = requestSchema.safeParse({
    ...Object.fromEntries(form),
    accepts: form.getAll("accepts").map(String),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return { fieldErrors, values: echo(form) };
  }
  const v = parsed.data;

  // Batas: 5 terbuka, 10 per 24 jam (AC-12.2, PRD §5.3)
  const since = new Date(Date.now() - 24 * 3600_000).toISOString();
  const [{ count: open }, { count: day }] = await Promise.all([
    supabase.from("book_requests").select("id", { count: "exact", head: true })
      .eq("requester_id", user.id).eq("status", "terbuka"),
    supabase.from("book_requests").select("id", { count: "exact", head: true })
      .eq("requester_id", user.id).gte("created_at", since),
  ]);
  if ((open ?? 0) >= 5) {
    return { error: "Kamu sudah punya 5 Dicari yang terbuka. Tutup salah satu dulu, ya.", values: echo(form) };
  }
  if ((day ?? 0) >= 10) {
    return { error: "Batas 10 Dicari per hari. Coba lagi besok, ya.", values: echo(form) };
  }

  const courseId = await resolveCourse(supabase, user.id, v.course);
  if (courseId === null) {
    return { error: "Mata kuliah gagal disimpan. Coba lagi sebentar.", values: echo(form) };
  }

  const { data, error } = await supabase.from("book_requests").insert({
    requester_id: user.id,
    title: v.title,
    course_id: courseId,
    study_program_id: v.studyProgramId,
    semester: v.semester,
    accepts: v.accepts,
    max_budget: v.accepts.includes("jual") ? v.maxBudget : null,
    notes: v.notes,
  }).select("id").single();

  if (error || !data) {
    return { error: "Dicari-mu gagal dipasang. Coba lagi sebentar.", values: echo(form) };
  }

  await supabase.rpc("log_event", {
    p_name: "request_created", p_props: { request_id: data.id },
  }).then(() => {}, () => {});

  revalidateTag(TAG.requests, { expire: 0 });
  redirect(`/dicari/${data.id}?baru=1`);
}

const Id = z.string().uuid();

/** Pembuat menutup Dicari: terpenuhi (+ jawaban "lewat thriftbook?") atau ditutup. */
export async function closeRequest(formData: FormData) {
  const id = Id.safeParse(formData.get("id"));
  const outcome = z.enum(["terpenuhi", "ditutup"]).safeParse(formData.get("outcome"));
  const via = z.enum(["thriftbook", "lainnya", "tidak_dijawab"]).safeParse(formData.get("via"));
  if (!id.success || !outcome.success) return;

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/masuk");

  const { data } = await supabase.from("book_requests")
    .update({
      status: outcome.data,
      fulfilled_via: outcome.data === "terpenuhi" ? (via.success ? via.data : "tidak_dijawab") : null,
    })
    .eq("id", id.data).eq("requester_id", auth.user.id).eq("status", "terbuka").select("id");

  if (data?.length) {
    await supabase.rpc("log_event", {
      p_name: "request_status_changed", p_props: { request_id: id.data, status: outcome.data },
    }).then(() => {}, () => {});
  }
  if (data?.length) revalidateTag(TAG.requests, { expire: 0 });
  revalidatePath(`/dicari/${id.data}`);
  revalidatePath("/akun");
  redirect(`/dicari/${id.data}`);
}

/** Perpanjang 30 hari, hanya jika tersisa ≤ 7 hari (AC-12.5). */
export async function extendRequest(formData: FormData) {
  const id = Id.safeParse(formData.get("id"));
  if (!id.success) return;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/masuk");

  const soon = new Date(Date.now() + 7 * 86400_000).toISOString();
  await supabase.from("book_requests")
    .update({ expires_at: new Date(Date.now() + 30 * 86400_000).toISOString() })
    .eq("id", id.data).eq("requester_id", auth.user.id).eq("status", "terbuka").lte("expires_at", soon);

  revalidatePath(`/dicari/${id.data}`);
  redirect(`/dicari/${id.data}`);
}
