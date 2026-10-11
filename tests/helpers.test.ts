import { test } from "node:test";
import assert from "node:assert/strict";
import { isAllowedEmail } from "../src/lib/email-domain.ts";
import { normalizeWhatsapp, buildWaLink } from "../src/lib/whatsapp.ts";

const ALLOWED = "students.um.ac.id,um.ac.id";

test("AC-01.1 domain mahasiswa & staf diterima", () => {
  assert.equal(isAllowedEmail("a@students.um.ac.id", ALLOWED), true);
  assert.equal(isAllowedEmail("B@UM.AC.ID", ALLOWED), true);
});

test("AC-01.2/01.3 domain lain & tiruan ditolak", () => {
  for (const e of [
    "a@gmail.com",
    "x@evilum.ac.id",
    "x@students.um.ac.id.evil.com",
    "x@fip.um.ac.id", // subdomain: tidak otomatis boleh, tunggu konfirmasi Q-03
    "students.um.ac.id",
    "@um.ac.id",
    "a@",
    "",
  ]) {
    assert.equal(isAllowedEmail(e, ALLOWED), false, e);
  }
  assert.equal(isAllowedEmail(null, ALLOWED), false);
});

test("AC-02.2 normalisasi nomor WA", () => {
  assert.equal(normalizeWhatsapp("0812-3456-7801"), "6281234567801");
  assert.equal(normalizeWhatsapp("+62 812 3456 7801"), "6281234567801");
  assert.equal(normalizeWhatsapp("6281234567801"), "6281234567801");
});

test("AC-02.3 nomor tidak valid ditolak", () => {
  for (const n of ["021555123", "0812", "abc", "", "0712345678901"]) {
    assert.equal(normalizeWhatsapp(n), null, n);
  }
});

test("AC-11.2 pesan WA di-encode", () => {
  const u = buildWaLink("6281234567801", 'Halo "Basis Data" & co');
  assert.ok(u.startsWith("https://wa.me/6281234567801?text="));
  assert.ok(!u.includes(" "));
  assert.ok(!u.includes("&co"));
});
