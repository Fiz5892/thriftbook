import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/** Beranda, halaman statis, dan semua listing aktif yang terlihat publik (NFR-20). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

  const base: MetadataRoute.Sitemap = ["", "/cari", "/dicari", "/panduan-cod", "/tentang", "/syarat", "/kebijakan-privasi"]
    .map((p) => ({ url: `${site}${p}` }));

  try {
    const db = createAdminClient();
    const { data } = await db
      .from("listings").select("id, updated_at")
      .eq("status", "aktif").is("hidden_at", null)
      .order("created_at", { ascending: false }).limit(5000);
    const items = (data ?? []).map((l) => ({
      url: `${site}/buku/${l.id}`, lastModified: new Date(l.updated_at),
    }));
    return [...base, ...items];
  } catch {
    return base; // jangan gagalkan sitemap jika DB sedang tak terjangkau
  }
}
