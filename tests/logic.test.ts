import { test } from "node:test";
import assert from "node:assert/strict";
import { looksLikePiracy } from "../src/lib/piracy.ts";
import {
  escapeLike, normalizeCourseName, listingSchema, requestSchema, onboardingSchema,
} from "../src/lib/schemas.ts";

const PHOTO = "7d32b57d-a70b-4567-a0ca-3cc13b2a3094";
const baseListing = {
  title: "Basis Data Praktis", author: "", course: "Basis Data", studyProgramId: "1",
  semester: "", condition: "baik", offerType: "jual", price: "45000", swapWish: "",
  notes: "", authenticity: "on", photoIds: [PHOTO],
};

test("SEC-40: kata kunci bajakan terdeteksi", () => {
  for (const t of ["Ada PDF-nya", "buku fotokopi bagus", "ebook lengkap", "soft file", "hasil print", "Cetak ulang"]) {
    assert.equal(looksLikePiracy(t), true, t);
  }
});

test("SEC-40: judul biasa tidak ditandai", () => {
  for (const t of ["Basis Data Praktis", "Algoritma dan Struktur Data", "Pengantar Nusantara", null, undefined, ""]) {
    assert.equal(looksLikePiracy(t), false, String(t));
  }
});

test("SEC-91: escapeLike menetralkan wildcard", () => {
  const BS = String.fromCharCode(92); // backslash
  assert.equal(escapeLike("100%_a"), "100" + BS + "%" + BS + "_a");
  assert.equal(escapeLike("a" + BS + "b"), "a" + BS + BS + "b");
  assert.equal(escapeLike("aman"), "aman");
});

test("D-06: normalisasi nama mata kuliah konsisten dengan kolom SQL", () => {
  assert.equal(normalizeCourseName("  Basis   Data!! "), "basis data");
  assert.equal(normalizeCourseName("Belajar & Pembelajaran"), "belajar pembelajaran");
  assert.equal(normalizeCourseName("!!"), "");
});

test("AC-04.2/04.3: aturan harga per tipe", () => {
  assert.equal(listingSchema.safeParse(baseListing).success, true);
  assert.equal(listingSchema.safeParse({ ...baseListing, price: "" }).success, false, "jual tanpa harga");
  assert.equal(listingSchema.safeParse({ ...baseListing, price: "40123" }).success, false, "bukan kelipatan 500");
  assert.equal(listingSchema.safeParse({ ...baseListing, price: "500" }).success, false, "di bawah minimal");
  assert.equal(listingSchema.safeParse({ ...baseListing, price: "2000000" }).success, false, "di atas maksimal");
  assert.equal(listingSchema.safeParse({ ...baseListing, offerType: "hibah", price: "" }).success, true);
  assert.equal(listingSchema.safeParse({ ...baseListing, offerType: "tukar", price: "" }).success, false, "tukar tanpa keinginan");
  assert.equal(
    listingSchema.safeParse({ ...baseListing, offerType: "tukar", price: "", swapWish: "Kalkulus 1" }).success,
    true,
  );
});

test("AC-04.8, AC-05.7: pernyataan keaslian dan jumlah foto", () => {
  assert.equal(listingSchema.safeParse({ ...baseListing, authenticity: undefined }).success, false);
  assert.equal(listingSchema.safeParse({ ...baseListing, photoIds: [] }).success, false);
  assert.equal(listingSchema.safeParse({ ...baseListing, photoIds: [PHOTO, PHOTO, PHOTO, PHOTO] }).success, false);
});

test("input liar ditolak: kondisi, tipe, id foto bukan UUID", () => {
  assert.equal(listingSchema.safeParse({ ...baseListing, condition: "mulus" }).success, false);
  assert.equal(listingSchema.safeParse({ ...baseListing, offerType: "sewa" }).success, false);
  assert.equal(listingSchema.safeParse({ ...baseListing, photoIds: ["../../etc/passwd"] }).success, false);
});

test("FR-12: validasi Dicari", () => {
  const ok = { title: "Belajar dan Pembelajaran", course: "Belajar", studyProgramId: "", semester: "", accepts: ["hibah"], maxBudget: "", notes: "" };
  assert.equal(requestSchema.safeParse(ok).success, true);
  assert.equal(requestSchema.safeParse({ ...ok, accepts: [] }).success, false);
  assert.equal(requestSchema.safeParse({ ...ok, title: "ab" }).success, false);
  assert.equal(requestSchema.safeParse({ ...ok, maxBudget: "50" }).success, false);
  assert.equal(requestSchema.safeParse({ ...ok, accepts: ["gratis"] }).success, false);
});

test("FR-02: onboarding mengubah format nomor WA dan butuh persetujuan", () => {
  const ok = { displayName: "Hafiz", studyProgramId: "1", whatsapp: "0812-3456-7801", consent: "on" };
  const r = onboardingSchema.safeParse(ok);
  assert.equal(r.success, true);
  if (r.success) assert.equal(r.data.whatsapp, "6281234567801");
  assert.equal(onboardingSchema.safeParse({ ...ok, consent: undefined }).success, false);
  assert.equal(onboardingSchema.safeParse({ ...ok, whatsapp: "123" }).success, false);
});

// Regresi: form hanya merender kolom harga saat tipe "jual", jadi untuk hibah/tukar
// kunci `price` tidak ada sama sekali di FormData (bukan string kosong).
test("hibah tanpa kolom harga sama sekali lolos validasi", () => {
  const { price, ...tanpaHarga } = baseListing;
  void price;
  const r = listingSchema.safeParse({ ...tanpaHarga, offerType: "hibah" });
  assert.equal(r.success, true, JSON.stringify(r.success ? "" : r.error.issues));
  if (r.success) assert.equal(r.data.price, null);
});

test("tukar tanpa kolom harga sama sekali lolos validasi", () => {
  const { price, ...tanpaHarga } = baseListing;
  void price;
  const r = listingSchema.safeParse({ ...tanpaHarga, offerType: "tukar", swapWish: "Kalkulus 1" });
  assert.equal(r.success, true, JSON.stringify(r.success ? "" : r.error.issues));
  if (r.success) assert.equal(r.data.price, null);
});

test("jual tanpa kolom harga tetap ditolak dengan pesan yang jelas", () => {
  const { price, ...tanpaHarga } = baseListing;
  void price;
  const r = listingSchema.safeParse({ ...tanpaHarga, offerType: "jual" });
  assert.equal(r.success, false);
  if (!r.success) assert.ok(r.error.issues.some((i) => i.path[0] === "price" && /harga/i.test(i.message)));
});

test("hibah dengan harga terkirim: harga dibuang, bukan ditolak", () => {
  // Pengguna sempat mengetik harga lalu pindah ke Hibah; kolom sudah tidak dirender,
  // tapi nilai lama bisa ikut terkirim. Server harus tetap menyimpan price = null.
  const r = listingSchema.safeParse({ ...baseListing, offerType: "hibah", price: "45000" });
  assert.equal(r.success, true);
});
