/**
 * Kata kunci yang memicu antrean "cek bajakan" (SEC-40). Listing TIDAK diblokir otomatis,
 * karena "bukan fotokopi" juga mengandung kata itu; hanya diberi tanda untuk admin.
 */
const PATTERN = /\b(pdf|e-?book|soft\s?file|foto\s?copy|fotokopi|fotocopy|photocopy|print(?:\s?an)?|cetak ulang|bajakan)\b/i;

export function looksLikePiracy(...texts: (string | null | undefined)[]): boolean {
  return texts.some((t) => (t ? PATTERN.test(t) : false));
}
