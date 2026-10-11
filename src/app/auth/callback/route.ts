import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAllowedEmail } from "@/lib/email-domain";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailHash } from "@/lib/hash";

// Hanya path relatif yang diawali "/" dan bukan "//" (SEC-08, cegah open redirect)
function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return "/";
  return raw;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  const providerError = `${searchParams.get("error_description") ?? ""} ${searchParams.get("error") ?? ""}`;
  if (/banned/i.test(providerError)) return NextResponse.redirect(`${origin}/diblokir`);

  if (!code) return NextResponse.redirect(`${origin}/masuk?error=kode`);

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    // Akun diblokir di level Auth: tampilkan penjelasan, bukan "login gagal" (AC-16.3)
    if (/banned/i.test(error.message)) return NextResponse.redirect(`${origin}/diblokir`);
    return NextResponse.redirect(`${origin}/masuk?error=gagal`);
  }

  const { data } = await supabase.auth.getUser();
  const user = data.user;
  const verified = Boolean(user?.email_confirmed_at);

  if (!user || !verified || !isAllowedEmail(user.email)) {
    // Lapisan 1 (SEC-02a). Lapisan 2 adalah trigger di auth.users.
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/masuk?error=domain`);
  }

  // Email yang pernah diblokir tidak boleh mendaftar ulang setelah hapus akun (SEC-34)
  try {
    const { data: hit } = await createAdminClient()
      .from("banned_emails").select("email_sha256")
      .eq("email_sha256", emailHash(user.email!)).maybeSingle();
    if (hit) {
      await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}/diblokir`);
    }
  } catch {
    // Pepper/DB tak tersedia: jangan mengunci semua orang; kegagalan tercatat di log server.
    console.error("[auth] pemeriksaan banned_emails gagal");
  }

  return NextResponse.redirect(`${origin}${next}`);
}
