/**
 * Waktu sekarang di server. Dibungkus fungsi agar komponen server tidak memanggil
 * Date.now() langsung (aturan react-hooks/purity). Hasilnya memang berbeda tiap request.
 */
export function nowMs(): number {
  return Date.now();
}
