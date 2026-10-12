"use server";

import { TAG } from "@/lib/public-data";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { REPORT_REASONS } from "@/lib/schemas";

const Input = z.object({
  kind: z.enum(["listing", "request"]),
  targetId: z.string().uuid(),
  reason: z.enum(REPORT_REASONS),
  note: z.string().trim().max(500).optional(),
});

const COLUMN = { listing: "target_listing_id", request: "target_request_id" } as const;
const PATH = { listing: "/buku/", request: "/dicari/" } as const;

export async function createReport(formData: FormData) {
  const parsed = Input.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/");
  const { kind, targetId, reason, note } = parsed.data;
  const back = `${PATH[kind]}${targetId}`;

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect(`/masuk?next=${encodeURIComponent(back)}`);

  // Batas 10 laporan per 24 jam (AC-14.4). Pelapor tidak boleh membaca tabel reports (RLS),
  // jadi menghitungnya lewat service role.
  const admin = createAdminClient();
  const { count } = await admin.from("reports")
    .select("id", { count: "exact", head: true })
    .eq("reporter_id", auth.user.id)
    .gte("created_at", new Date(Date.now() - 86400_000).toISOString());
  if ((count ?? 0) >= 10) redirect(`${back}?lapor=batas`);

  const { error } = await supabase.from("reports").insert({
    reporter_id: auth.user.id,
    [COLUMN[kind]]: targetId,
    reason,
    note: note || null,
  });

  if (error) {
    if (error.code === "23505") redirect(`${back}?lapor=ganda`);
    redirect(`${back}?lapor=gagal`);
  }

  // Sembunyikan otomatis setelah 3 pelapor berbeda (AC-14.3). Trigger database melakukan hal
  // yang sama (migrasi 0003); ini fallback agar fitur tetap jalan dan idempotent.
  const { data: rows } = await admin.from("reports")
    .select("reporter_id").eq(COLUMN[kind], targetId).eq("status", "baru").not("reporter_id", "is", null);
  const distinct = new Set((rows ?? []).map((r) => r.reporter_id)).size;
  if (distinct >= 3) {
    await admin.from(kind === "listing" ? "listings" : "book_requests")
      .update({ hidden_at: new Date().toISOString(), hidden_reason: "auto_3_reports" })
      .eq("id", targetId).is("hidden_at", null);
  }

  await supabase.rpc("log_event", { p_name: "report_created", p_props: { kind, reason } })
    .then(() => {}, () => {});

  if (distinct >= 3) { revalidateTag(TAG.listings, { expire: 0 }); revalidateTag(TAG.requests, { expire: 0 }); }
  redirect(`${back}?lapor=ok`);
}
