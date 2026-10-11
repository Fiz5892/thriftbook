"use client";

import { createClient } from "@/lib/supabase/client";

export function LoginButton({ next }: { next?: string }) {
  async function login() {
    const supabase = createClient();
    const target = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(target)}`,
        // Hanya kenyamanan UI; BUKAN kontrol keamanan (SEC-01)
        queryParams: { hd: "students.um.ac.id", prompt: "select_account" },
      },
    });
  }
  return (
    <button
      onClick={login}
      className="btn btn-ink"
    >
      Masuk dengan Google
    </button>
  );
}
