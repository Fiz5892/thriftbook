import "server-only";
import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { CARD_SELECT, type CardListing } from "@/components/book-card";

/*
 * Data publik yang sama untuk semua pengunjung, di-cache lintas permintaan.
 * Memakai klien anon TANPA cookie (cookie tidak boleh dibaca di dalam cache) sehingga yang
 * tersimpan hanya data yang memang boleh dilihat publik menurut RLS.
 *
 * Invalidasi: server action dan cron memanggil revalidateTag(TAG.*, { expire: 0 }).
 * (updateTag TIDAK berlaku untuk unstable_cache; sudah dicoba, data tetap basi.)
 * Tanpa invalidasi pun data paling lama basi `revalidate` detik.
 */

export const TAG = {
  programs: "programs",
  listings: "listings",
  requests: "requests",
} as const;

const anon = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

export type Program = { id: number; slug: string; short_name: string };

/** Daftar prodi aktif. Hampir tidak pernah berubah. */
export const getPrograms = unstable_cache(
  async (): Promise<Program[]> => {
    const { data, error } = await anon()
      .from("study_programs").select("id, slug, short_name").eq("is_active", true).order("short_name");
    if (error) throw error; // jangan cache kegagalan
    return data ?? [];
  },
  ["programs-v1"],
  { revalidate: 3600, tags: [TAG.programs] },
);

/** Listing aktif terbaru untuk beranda dan landing. */
export const getRecentListings = unstable_cache(
  async (limit: number): Promise<CardListing[]> => {
    const { data, error } = await anon()
      .from("listings").select(CARD_SELECT)
      .eq("status", "aktif").is("hidden_at", null)
      .order("created_at", { ascending: false }).limit(limit);
    if (error) throw error;
    return (data ?? []) as unknown as CardListing[];
  },
  ["recent-listings-v1"],
  { revalidate: 60, tags: [TAG.listings] },
);

/** Jumlah listing aktif per prodi + total. */
export const getListingStats = unstable_cache(
  async (): Promise<{ total: number; perProgram: Record<number, number> }> => {
    const { data, error } = await anon()
      .from("listings").select("study_program_id").eq("status", "aktif").is("hidden_at", null).limit(10000);
    if (error) throw error;
    const perProgram: Record<number, number> = {};
    for (const r of data ?? []) perProgram[r.study_program_id] = (perProgram[r.study_program_id] ?? 0) + 1;
    return { total: data?.length ?? 0, perProgram };
  },
  ["listing-stats-v1"],
  { revalidate: 60, tags: [TAG.listings] },
);

export type WantedSummary = { id: string; title: string; course_name_snapshot: string; created_at: string };

/** Dicari terbuka terbaru + jumlah total. */
export const getOpenRequests = unstable_cache(
  async (limit: number): Promise<{ total: number; items: WantedSummary[] }> => {
    const now = new Date().toISOString();
    const { data, count, error } = await anon()
      .from("book_requests").select("id, title, course_name_snapshot, created_at", { count: "exact" })
      .eq("status", "terbuka").is("hidden_at", null).gt("expires_at", now)
      .order("created_at", { ascending: false }).limit(limit);
    if (error) throw error;
    return { total: count ?? 0, items: data ?? [] };
  },
  ["open-requests-v1"],
  { revalidate: 60, tags: [TAG.requests] },
);
