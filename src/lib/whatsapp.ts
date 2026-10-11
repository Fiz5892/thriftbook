/**
 * Normalisasi nomor WA ke format 62xxxxxxxxxx (tanpa "+"). (AC-02.2, AC-02.3)
 * Mengembalikan null jika tidak valid.
 */
export function normalizeWhatsapp(input: string): string | null {
  let digits = input.replace(/[\s\-().+]/g, "");
  if (!/^\d+$/.test(digits)) return null;
  if (digits.startsWith("0")) digits = "62" + digits.slice(1);
  return /^628[1-9][0-9]{7,10}$/.test(digits) ? digits : null;
}

/** Tautan wa.me dengan pesan template. Hanya boleh dipanggil di server. (FR-11) */
export function buildWaLink(e164: string, message: string): string {
  return `https://wa.me/${e164}?text=${encodeURIComponent(message)}`;
}

export function listingMessage(title: string, url: string): string {
  return `Halo, aku lihat "${title}" di thriftbook (${url}). Masih ada?`;
}
