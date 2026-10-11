"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
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

  const patch: { status: string; bumped_at?: string } = { status: status.data };
  if (status.data === "aktif") patch.bumped_at = new Date().toISOString();
  const { data } = await supabase
    .from("listings").update(patch).eq("id", id.data).select("id");

  if (data?.length) {
    await supabase.rpc("log_event", {
      p_name: "listing_status_changed",
      p_props: { listing_id: id.data, status: status.data },
    }).then(() => {}, () => {});
  }
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

  const { data: deleted } = await supabase
    .from("listings").delete().eq("id", id.data).select("id");

  if (deleted?.length && photos?.length) {
    const admin = createAdminClient();
    await admin.storage
      .from("listing-photos")
      .remove(photos.flatMap((p) => [p.path_full, p.path_thumb]));
  }
  redirect("/akun");
}
