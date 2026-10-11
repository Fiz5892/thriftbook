/**
 * Test RLS terhadap database Supabase sungguhan (SEC-12).
 * Menjalankan: npm run test:rls   (membaca .env, membuat 2 pengguna uji lalu menghapusnya)
 * Dilewati otomatis jika SUPABASE_SERVICE_ROLE_KEY tidak ada, jadi aman untuk `npm test`.
 */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const skip = !SERVICE || !URL || !ANON;

const opts = { auth: { persistSession: false, autoRefreshToken: false } };
const stamp = Date.now();
const emails = {
  a: `rls-a-${stamp}@students.um.ac.id`,
  b: `rls-b-${stamp}@students.um.ac.id`,
};
const ids: Record<string, string> = {};
let admin: SupabaseClient, anon: SupabaseClient, A: SupabaseClient, B: SupabaseClient;
let listingId: string;
let courseId: number;
let prodiId: number;

// Provider email/password dimatikan di produksi (SEC-03), jadi sesi uji dibuat lewat
// magic link yang diterbitkan service role, tanpa mengirim email.
async function login(email: string) {
  const link = await admin.auth.admin.generateLink({ type: "magiclink", email });
  assert.equal(link.error, null, `generateLink ${email}: ${link.error?.message}`);
  const c = createClient(URL, ANON, opts);
  const { error } = await c.auth.verifyOtp({
    token_hash: link.data.properties.hashed_token,
    type: "magiclink",
  });
  assert.equal(error, null, `login ${email}: ${error?.message}`);
  return c;
}

before(async () => {
  if (skip) return;
  admin = createClient(URL, SERVICE!, opts);
  anon = createClient(URL, ANON, opts);

  for (const k of ["a", "b"] as const) {
    const { data, error } = await admin.auth.admin.createUser({
      email: emails[k],
      email_confirm: true,
    });
    assert.equal(error, null, `createUser ${k}: ${error?.message}`);
    ids[k] = data.user!.id;
  }
  A = await login(emails.a);
  B = await login(emails.b);

  const { data: prodi } = await admin.from("study_programs").select("id").limit(1).single();
  prodiId = prodi!.id;

  for (const [k, c, wa] of [
    ["a", A, "6281234567801"],
    ["b", B, "6281234567802"],
  ] as const) {
    const p = await c.from("profiles").insert({
      id: ids[k], display_name: `Uji ${k.toUpperCase()}`, study_program_id: prodiId,
    });
    assert.equal(p.error, null, `profile ${k}: ${p.error?.message}`);
    const w = await c.from("profile_contacts").insert({ profile_id: ids[k], whatsapp_e164: wa });
    assert.equal(w.error, null, `contact ${k}: ${w.error?.message}`);
  }

  const course = await A.from("courses")
    .insert({ name: `MK Uji ${stamp}`, created_by: ids.a }).select("id").single();
  assert.equal(course.error, null, course.error?.message);
  courseId = course.data!.id;

  const l = await A.from("listings").insert({
    owner_id: ids.a, title: "Buku Uji RLS", course_id: courseId, study_program_id: prodiId,
    condition: "baik", offer_type: "jual", price: 20000, authenticity_confirmed: true,
  }).select("id").single();
  assert.equal(l.error, null, `listing: ${l.error?.message}`);
  listingId = l.data!.id;
});

after(async () => {
  if (skip) return;
  await admin.from("listings").delete().eq("owner_id", ids.a);
  await admin.from("courses").delete().eq("id", courseId);
  for (const id of Object.values(ids)) await admin.auth.admin.deleteUser(id);
});

test("SEC-02: akun non-UM ditolak trigger database", { skip }, async () => {
  const { error } = await admin.auth.admin.createUser({
    email: `rls-${stamp}@gmail.com`, email_confirm: true,
  });
  assert.ok(error, "seharusnya gagal");
});

test("SEC-02: domain tiruan ditolak", { skip }, async () => {
  const { error } = await admin.auth.admin.createUser({
    email: `x-${stamp}@students.um.ac.id.evil.com`, email_confirm: true,
  });
  assert.ok(error, "seharusnya gagal");
});

test("anon boleh membaca listing aktif, tapi tidak boleh menulis", { skip }, async () => {
  const r = await anon.from("listings").select("id").eq("id", listingId);
  assert.equal(r.data?.length, 1);
  const w = await anon.from("listings").insert({
    owner_id: ids.a, title: "x", course_id: courseId, study_program_id: prodiId,
    condition: "baik", offer_type: "hibah", authenticity_confirmed: true,
  });
  assert.ok(w.error);
});

test("AC-06.2: B tidak bisa mengubah atau menghapus listing A", { skip }, async () => {
  const u = await B.from("listings").update({ price: 1000 }).eq("id", listingId).select();
  assert.equal(u.data?.length ?? 0, 0);
  const d = await B.from("listings").delete().eq("id", listingId).select();
  assert.equal(d.data?.length ?? 0, 0);
  const still = await admin.from("listings").select("price").eq("id", listingId).single();
  assert.equal(still.data?.price, 20000);
});

test("SEC-20: B tidak bisa membaca nomor WA A secara langsung", { skip }, async () => {
  const r = await B.from("profile_contacts").select("whatsapp_e164").eq("profile_id", ids.a);
  assert.equal(r.data?.length ?? 0, 0);
  const own = await B.from("profile_contacts").select("whatsapp_e164").eq("profile_id", ids.b);
  assert.equal(own.data?.length, 1);
});

test("SEC-11: pengguna tidak bisa menaikkan role sendiri", { skip }, async () => {
  await B.from("profiles").update({ role: "admin" }).eq("id", ids.b);
  const { data } = await admin.from("profiles").select("role").eq("id", ids.b).single();
  assert.equal(data?.role, "user");
});

test("SEC-11: pemilik tidak bisa memindahkan kepemilikan listing", { skip }, async () => {
  await A.from("listings").update({ owner_id: ids.b }).eq("id", listingId);
  const { data } = await admin.from("listings").select("owner_id").eq("id", listingId).single();
  assert.equal(data?.owner_id, ids.a);
});

test("constraint harga: jual tanpa harga, hibah berharga, tukar tanpa swap_wish ditolak", { skip }, async () => {
  const base = {
    owner_id: ids.a, title: "Constraint Uji", course_id: courseId, study_program_id: prodiId,
    condition: "baik", authenticity_confirmed: true,
  };
  const r1 = await A.from("listings").insert({ ...base, offer_type: "jual" });
  assert.ok(r1.error, "jual tanpa harga");
  const r2 = await A.from("listings").insert({ ...base, offer_type: "hibah", price: 5000 });
  assert.ok(r2.error, "hibah dengan harga");
  const r3 = await A.from("listings").insert({ ...base, offer_type: "tukar" });
  assert.ok(r3.error, "tukar tanpa swap_wish");
});

test("AC-04.8: pernyataan keaslian wajib", { skip }, async () => {
  const r = await A.from("listings").insert({
    owner_id: ids.a, title: "Tanpa Pernyataan", course_id: courseId, study_program_id: prodiId,
    condition: "baik", offer_type: "hibah", authenticity_confirmed: false,
  });
  assert.ok(r.error);
});

test("FR-11: kontak WA lewat RPC — anon ditolak, B berhasil, A pada listing sendiri ditolak", { skip }, async () => {
  const noAuth = await anon.rpc("reveal_listing_contact", { p_listing_id: listingId });
  assert.ok(noAuth.error);

  const ok = await B.rpc("reveal_listing_contact", { p_listing_id: listingId });
  assert.equal(ok.error, null, ok.error?.message);
  const row = Array.isArray(ok.data) ? ok.data[0] : ok.data;
  assert.equal(row.whatsapp, "6281234567801");

  const own = await A.rpc("reveal_listing_contact", { p_listing_id: listingId });
  assert.equal(own.error?.code, "22023");

  const log = await admin.from("contact_reveals").select("id").eq("viewer_id", ids.b);
  assert.equal(log.data?.length, 1);
});

test("FR-11: listing yang disembunyikan tidak bisa dihubungi", { skip }, async () => {
  await admin.from("listings").update({ hidden_at: new Date().toISOString() }).eq("id", listingId);
  const r = await B.rpc("reveal_listing_contact", { p_listing_id: listingId });
  assert.equal(r.error?.code, "P0002");
  const vis = await B.from("listings").select("id").eq("id", listingId);
  assert.equal(vis.data?.length ?? 0, 0, "listing tersembunyi tidak boleh terbaca orang lain");
  await admin.from("listings").update({ hidden_at: null }).eq("id", listingId);
});

test("FR-16: pengguna diblokir tidak bisa membuat listing atau membuka kontak", { skip }, async () => {
  await admin.from("profiles").update({ banned_at: new Date().toISOString() }).eq("id", ids.b);
  const r = await B.rpc("reveal_listing_contact", { p_listing_id: listingId });
  assert.equal(r.error?.code, "42501");
  const w = await B.from("listings").insert({
    owner_id: ids.b, title: "Dari Banned", course_id: courseId, study_program_id: prodiId,
    condition: "baik", offer_type: "hibah", authenticity_confirmed: true,
  });
  assert.ok(w.error);
  await admin.from("profiles").update({ banned_at: null }).eq("id", ids.b);
});

test("FR-14/FR-15: laporan bisa dibuat, tidak bisa dibaca pelapor, dan tidak ganda", { skip }, async () => {
  const r = await B.from("reports").insert({
    reporter_id: ids.b, target_listing_id: listingId, reason: "spam",
  });
  assert.equal(r.error, null, r.error?.message);
  const read = await B.from("reports").select("id");
  assert.equal(read.data?.length ?? 0, 0);
  const dup = await B.from("reports").insert({
    reporter_id: ids.b, target_listing_id: listingId, reason: "spam",
  });
  assert.ok(dup.error, "laporan ganda harus ditolak");
});

test("moderation_actions: non-admin tidak bisa menulis atau membaca", { skip }, async () => {
  const w = await B.from("moderation_actions").insert({
    admin_id: ids.b, action: "hide_listing", target_id: listingId, reason: "coba-coba",
  });
  assert.ok(w.error);
  const r = await B.from("moderation_actions").select("id");
  assert.equal(r.data?.length ?? 0, 0);
});
