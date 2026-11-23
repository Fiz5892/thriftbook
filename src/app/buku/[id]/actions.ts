"use server";

import { TAG } from "@/lib/public-data";
import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireCompleteUser } from "@/lib/session";
import { reviewSchema } from "@/lib/schemas";
import { EBOOK_BUCKET } from "@/lib/ebook";
import { createAdminClient } from "@/lib/supabase/admin";

const Id = z.string().uuid();
const Status = z.enum(["aktif", "dipesan", "selesai"]);

/** Pemilik mengubah status. RLS + trigger memastikan hanya pemilik, dan 'selesai' final. */
export async function setListingStatus(formData: FormData) {
  const id = Id.safeParse(formData.get("id"));
  const status = Status.safeParse(formData.get("status"));
  if (!id.success || !status.success) return;

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/masuk");

  // AC-07.2: jawaban "laku lewat thriftbook?" disimpan untuk metrik M-04
  const via = z.enum(["thriftbook", "lainnya", "tidak_dijawab"]).safeParse(formData.get("via"));
  const patch: { status: string; bumped_at?: string; done_via?: string } = { status: status.data };
  if (status.data === "aktif") patch.bumped_at = new Date().toISOString();
  if (status.data === "selesai") patch.done_via = via.success ? via.data : "tidak_dijawab";
  const { data } = await supabase
    .from("listings").update(patch).eq("id", id.data).select("id");

  if (data?.length) {
    await supabase.rpc("log_event", {
      p_name: "listing_status_changed",
      p_props: { listing_id: id.data, status: status.data },
    }).then(() => {}, () => {});
  }
  if (data?.length) revalidateTag(TAG.listings, { expire: 0 });
  revalidatePath(`/buku/${id.data}`);
  revalidatePath("/akun");
}

/** Hapus listing; file foto dihapus sekarang (jalur cepat), sisanya oleh job pembersih. */
export async function deleteListing(formData: FormData) {
  const id = Id.safeParse(formData.get("id"));
  if (!id.success) return;

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/masuk");

  const { data: photos } = await supabase
    .from("listing_photos").select("path_full, path_thumb").eq("listing_id", id.data);
  const { data: own } = await supabase
    .from("listings").select("ebook_path").eq("id", id.data).maybeSingle();

  const { data: deleted } = await supabase
    .from("listings").delete().eq("id", id.data).select("id");

  if (deleted?.length && photos?.length) {
    const admin = createAdminClient();
    await admin.storage
      .from("listing-photos")
      .remove(photos.flatMap((p) => [p.path_full, p.path_thumb]));
  }
  if (deleted?.length && own?.ebook_path) {
    await createAdminClient().storage.from(EBOOK_BUCKET).remove([own.ebook_path]);
  }
  if (deleted?.length) revalidateTag(TAG.listings, { expire: 0 });
  redirect("/akun");
}

/**
 * Checkout e-book (tanpa WhatsApp). E-book gratis langsung memberi hak baca/unduh.
 * E-book berbayar BELUM bisa dibeli: belum ada penyedia pembayaran yang terhubung,
 * jadi tidak ada hak baca yang diberikan tanpa pembayaran.
 */
export async function checkoutEbook(formData: FormData) {
  const id = Id.safeParse(formData.get("id"));
  if (!id.success) return;
  const { supabase, user } = await requireCompleteUser(`/buku/${id.data}`);

  const { data: l } = await supabase
    .from("listings").select("id, owner_id, format, price, status, hidden_at")
    .eq("id", id.data).maybeSingle();
  if (!l || l.format !== "ebook" || l.hidden_at || l.status !== "aktif" || l.owner_id === user.id) {
    redirect(`/buku/${id.data}`);
  }
  if (l.price !== null) redirect(`/buku/${id.data}?ebook=bayar`);

  const { error } = await createAdminClient().from("ebook_orders")
    .upsert(
      { listing_id: l.id, buyer_id: user.id, status: "lunas" },
      { onConflict: "listing_id,buyer_id", ignoreDuplicates: true },
    );
  revalidatePath(`/buku/${id.data}`);
  redirect(`/buku/${id.data}?ebook=${error ? "gagal" : "ok"}`);
}

export type ReviewState = { error?: string; ok?: boolean; values?: { rating: string; comment: string } };

/** Simpan ulasan (buat baru atau ubah milik sendiri). Hak mengulas dijaga RLS (can_review_listing). */
export async function saveReview(_prev: ReviewState, form: FormData): Promise<ReviewState> {
  const values = { rating: String(form.get("rating") ?? ""), comment: String(form.get("comment") ?? "") };
  const parsed = reviewSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Isian belum valid.", values };

  const { supabase, user } = await requireCompleteUser(`/buku/${parsed.data.listingId}`);
  const { listingId, rating, comment } = parsed.data;

  const { error } = await supabase.from("reviews").upsert(
    { listing_id: listingId, reviewer_id: user.id, rating, comment },
    { onConflict: "listing_id,reviewer_id" },
  );
  if (error) {
    return {
      error: "Ulasan gagal disimpan. Ulasan e-book butuh checkout dulu.",
      values,
    };
  }
  revalidatePath(`/buku/${listingId}`);
  return { ok: true, values };
}

export async function deleteReview(formData: FormData) {
  const id = Id.safeParse(formData.get("id"));
  const listingId = Id.safeParse(formData.get("listingId"));
  if (!id.success || !listingId.success) return;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/masuk");
  await supabase.from("reviews").delete().eq("id", id.data); // RLS: hanya milik sendiri (atau admin)
  revalidatePath(`/buku/${listingId.data}`);
}
