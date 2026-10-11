import { z } from "zod";
import { normalizeWhatsapp } from "./whatsapp.ts";

export const CONDITIONS = ["seperti_baru", "baik", "layak", "banyak_coretan"] as const;
export const OFFER_TYPES = ["jual", "hibah", "tukar"] as const;

export const CONDITION_LABEL: Record<(typeof CONDITIONS)[number], string> = {
  seperti_baru: "Seperti baru",
  baik: "Baik",
  layak: "Layak",
  banyak_coretan: "Banyak coretan",
};

export const CONDITION_HELP: Record<(typeof CONDITIONS)[number], string> = {
  seperti_baru: "Tidak ada coretan atau stabilo, sampul dan jilid mulus.",
  baik: "Sedikit stabilo atau catatan pensil (kurang dari 10 halaman), jilid kuat.",
  layak: "Banyak stabilo atau catatan, sampul lecek, tapi semua halaman lengkap dan terbaca.",
  banyak_coretan: "Catatan di banyak halaman atau ada kerusakan kecil. Sebutkan di catatan.",
};

export const OFFER_LABEL: Record<(typeof OFFER_TYPES)[number], string> = {
  jual: "Jual",
  hibah: "Hibah (gratis)",
  tukar: "Tukar",
};

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional()
    .transform((v) => v ?? null);

export const onboardingSchema = z.object({
  displayName: z.string().trim().min(2, "Nama minimal 2 karakter").max(40, "Nama maksimal 40 karakter"),
  studyProgramId: z.coerce.number().int().positive("Pilih prodi"),
  isStaff: z.coerce.boolean().default(false),
  cohortYear: z.coerce
    .number()
    .int()
    .min(2015, "Angkatan tidak valid")
    .max(new Date().getFullYear(), "Angkatan tidak valid")
    .optional(),
  whatsapp: z
    .string()
    .transform((v, ctx) => {
      const n = normalizeWhatsapp(v);
      if (!n) {
        ctx.addIssue({ code: "custom", message: "Nomor WA harus diawali 08 atau 62, 10–13 digit." });
        return z.NEVER;
      }
      return n;
    }),
  consent: z.literal("on", { error: "Centang persetujuan dulu, ya." }),
});

export const listingSchema = z
  .object({
    title: z.string().trim().min(3, "Judul minimal 3 karakter").max(120),
    author: optionalText(80),
    course: z.string().trim().min(2, "Isi mata kuliah").max(80),
    studyProgramId: z.coerce.number().int().positive("Pilih prodi"),
    semester: z
      .union([z.literal(""), z.coerce.number().int().min(1).max(8)])
      .transform((v) => (v === "" ? null : v)),
    condition: z.enum(CONDITIONS, { error: "Pilih kondisi buku" }),
    offerType: z.enum(OFFER_TYPES, { error: "Pilih jual, hibah, atau tukar" }),
    price: z.union([z.literal(""), z.coerce.number().int()]).transform((v) => (v === "" ? null : v)),
    swapWish: optionalText(200),
    notes: optionalText(500),
    authenticity: z.literal("on", { error: "Centang pernyataan keaslian buku." }),
    photoIds: z.array(z.string().uuid()).min(1, "Minimal 1 foto").max(3, "Maksimal 3 foto"),
  })
  .superRefine((v, ctx) => {
    if (v.offerType === "jual") {
      if (v.price === null) {
        ctx.addIssue({ code: "custom", path: ["price"], message: "Isi harga" });
      } else if (v.price < 1000 || v.price > 1_000_000 || v.price % 500 !== 0) {
        ctx.addIssue({
          code: "custom",
          path: ["price"],
          message: "Harga Rp1.000–Rp1.000.000, kelipatan Rp500",
        });
      }
    }
    if (v.offerType === "tukar" && (!v.swapWish || v.swapWish.length < 3)) {
      ctx.addIssue({ code: "custom", path: ["swapWish"], message: "Tulis buku apa yang kamu mau" });
    }
  });

/** Sama dengan kolom name_norm di database (lower, non-alfanumerik jadi spasi, trim). */
export function normalizeCourseName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/** Escape karakter khusus LIKE agar input pengguna tidak jadi pola (SEC-91). */
export function escapeLike(q: string): string {
  return q.replace(/[\\%_]/g, (c) => "\\" + c);
}

export const REPORT_REASONS = [
  "bajakan", "penipuan", "palsu", "nomor_salah", "spam", "tidak_pantas", "lainnya",
] as const;

export const REPORT_LABEL: Record<(typeof REPORT_REASONS)[number], string> = {
  bajakan: "Fotokopi, cetak ulang, atau PDF",
  penipuan: "Penipuan (minta transfer/DP, barang tidak sesuai)",
  palsu: "Listing palsu atau foto curian",
  nomor_salah: "Nomor WA bukan milik penjual",
  spam: "Spam",
  tidak_pantas: "Konten tidak pantas",
  lainnya: "Lainnya",
};

export const requestSchema = z.object({
  title: z.string().trim().min(3, "Judul atau topik minimal 3 karakter").max(120),
  course: z.string().trim().min(2, "Isi mata kuliah").max(80),
  studyProgramId: z
    .union([z.literal(""), z.coerce.number().int().positive()])
    .transform((v) => (v === "" ? null : v)),
  semester: z
    .union([z.literal(""), z.coerce.number().int().min(1).max(8)])
    .transform((v) => (v === "" ? null : v)),
  accepts: z.array(z.enum(OFFER_TYPES)).min(1, "Pilih minimal satu cara"),
  maxBudget: z
    .union([z.literal(""), z.coerce.number().int().min(1000, "Minimal Rp1.000").max(1_000_000, "Maksimal Rp1.000.000")])
    .transform((v) => (v === "" ? null : v)),
  notes: optionalText(300),
});
