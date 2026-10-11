import "server-only";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Pastikan pengguna adalah admin. Non-admin mendapat 404 (bukan 403) agar keberadaan
 * panel tidak bocor (AC-15.2, SEC-17). RLS tetap jadi lapisan kedua.
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) notFound();
  const { data: p } = await supabase
    .from("profiles").select("role, banned_at").eq("id", data.user.id).maybeSingle();
  if (!p || p.role !== "admin" || p.banned_at) notFound();
  return { supabase, user: data.user };
}
