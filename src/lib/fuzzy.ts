/**
 * Pencocokan toleran salah ketik untuk pencarian (AC-09.1), tanpa extension database.
 * Dipakai hanya sebagai cadangan saat ILIKE tidak menemukan apa pun, pada himpunan kecil
 * (listing aktif satu kampus), jadi O(n) di server masih wajar.
 */

const squash = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");
const words = (s: string) => s.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);

function bigrams(s: string): Map<string, number> {
  const t = ` ${s} `;
  const m = new Map<string, number>();
  for (let i = 0; i < t.length - 1; i++) {
    const g = t.slice(i, i + 2);
    m.set(g, (m.get(g) ?? 0) + 1);
  }
  return m;
}

/** Koefisien Dice atas bigram, 0..1. */
export function dice(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  const A = bigrams(a);
  const B = bigrams(b);
  let inter = 0;
  for (const [g, n] of A) inter += Math.min(n, B.get(g) ?? 0);
  const total = a.length + 1 + (b.length + 1);
  return (2 * inter) / total;
}

/** Skor 0..1: seberapa cocok `query` dengan `text`. 1 jika semua kata muncul apa adanya. */
export function fuzzyScore(query: string, text: string): number {
  const qWords = words(query);
  if (qWords.length === 0) return 0;

  const tWords = words(text);
  const squashedText = squash(text);

  // Kandidat: kata, pasangan kata berurutan digabung ("basis data" → "basisdata")
  const candidates = new Set<string>(tWords);
  for (let i = 0; i < tWords.length - 1; i++) candidates.add(tWords[i] + tWords[i + 1]);

  let sum = 0;
  for (const w of qWords) {
    if (squashedText.includes(w)) {
      sum += 1;
      continue;
    }
    let best = 0;
    for (const c of candidates) {
      if (c.startsWith(w) && w.length >= 3) best = Math.max(best, 0.9);
      else best = Math.max(best, dice(w, c));
    }
    // Kata tunggal yang terlalu pendek terlalu rawan salah cocok
    sum += w.length < 3 ? Math.min(best, 0.5) : best;
  }
  return sum / qWords.length;
}

export const FUZZY_THRESHOLD = 0.6;

/** Urutkan item berdasarkan skor; buang yang di bawah ambang. */
export function rankFuzzy<T>(
  query: string,
  items: T[],
  textOf: (item: T) => string,
  threshold = FUZZY_THRESHOLD,
): { item: T; score: number }[] {
  return items
    .map((item) => ({ item, score: fuzzyScore(query, textOf(item)) }))
    .filter((r) => r.score >= threshold)
    .sort((a, b) => b.score - a.score);
}
