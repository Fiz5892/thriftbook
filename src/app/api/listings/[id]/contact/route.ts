import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { buildWaLink, listingMessage } from "@/lib/whatsapp";

const Params = z.object({ id: z.string().uuid() });

// Kode error dari fungsi SQL reveal_listing_contact → status HTTP + pesan ramah
const ERRORS: Record<string, { status: number; message: string }> = {
  "28000": { status: 401, message: "Masuk dulu untuk chat penjual." },
  "42501": { status: 403, message: "Akunmu tidak bisa menghubungi penjual." },
  P0002: { status: 404, message: "Buku ini sudah tidak tersedia." },
  "22023": { status: 400, message: "Ini bukumu sendiri." },
  "54000": {
    status: 429,
    message: "Kamu sudah menghubungi terlalu banyak penjual. Coba lagi nanti, ya.",
  },
};

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  // CSRF: Origin harus sama dengan host kita (SEC-92)
  const origin = request.headers.get("origin");
  if (!origin || new URL(origin).host !== request.nextUrl.host) {
    return NextResponse.json({ message: "Permintaan ditolak." }, { status: 403 });
  }

  const parsed = Params.safeParse(await ctx.params);
  if (!parsed.success) {
    return NextResponse.json({ message: "Buku tidak ditemukan." }, { status: 404 });
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser(); // bukan getSession() (SEC-06)
  if (!auth.user) {
    return NextResponse.json(ERRORS["28000"], { status: 401, headers: noStore });
  }

  const { data, error } = await supabase.rpc("reveal_listing_contact", {
    p_listing_id: parsed.data.id,
  });

  if (error) {
    const mapped = ERRORS[error.code] ?? {
      status: 500,
      message: "Ada yang error di sisi kami, bukan salahmu. Coba lagi sebentar.",
    };
    return NextResponse.json(
      { message: mapped.message },
      { status: mapped.status, headers: noStore },
    );
  }

  const row = Array.isArray(data) ? data[0] : data;
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin;
  const url = buildWaLink(
    row.whatsapp,
    listingMessage(row.title, `${site}/buku/${parsed.data.id}`),
  );
  return NextResponse.json({ url }, { headers: noStore });
}

const noStore = { "Cache-Control": "no-store" };
