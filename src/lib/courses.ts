import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeCourseName } from "./schemas";

/**
 * Cari mata kuliah berdasarkan nama ternormalisasi, atau buat baru (D-06).
 * Menangani balapan dengan pengguna lain yang membuat MK yang sama.
 */
export async function resolveCourse(
  supabase: SupabaseClient,
  userId: string,
  name: string,
): Promise<number | null> {
  const norm = normalizeCourseName(name);
  if (norm.length < 2) return null;

  const find = async () => {
    const { data } = await supabase
      .from("courses").select("id, merged_into").eq("name_norm", norm).maybeSingle();
    return data ? ((data.merged_into ?? data.id) as number) : null;
  };

  const existing = await find();
  if (existing !== null) return existing;

  const ins = await supabase
    .from("courses").insert({ name: name.trim(), created_by: userId }).select("id").single();
  if (ins.data) return ins.data.id as number;
  return find();
}
