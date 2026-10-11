/**
 * Test RLS untuk Dicari, moderasi admin, dan auto-hide (SEC-12).
 * Menjalankan: npm run test:rls   (butuh .env; dilewati otomatis jika tidak ada)
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
const ids: Record<string, string> = {};
const clients: Record<string, SupabaseClient> = {};
let admin: SupabaseClient, anon: SupabaseClient;
let courseId: number, listingId: string, requestId: string;

async function mk(label: string, role?: "admin") {
  const email = `rlsm-${label}-${stamp}@students.um.ac.id`;
  const r = await admin.auth.admin.createUser({ email, email_confirm: true });
  assert.equal(r.error, null, `createUser ${label}: ${r.error?.message}`);
  ids[label] = r.data.user!.id;
  const p = await admin.from("profiles").insert({
    id: ids[label], display_name: `M ${label}`, study_program_id: 1,
  });
  assert.equal(p.error, null, `profile ${label}: ${p.error?.message}`);
  if (role) await admin.from("profiles").update({ role }).eq("id", ids[label]);
  const link = await admin.auth.admin.generateLink({ type: "magiclink", email });
  const c = createClient(URL, ANON, opts);
  const v = await c.auth.verifyOtp({ token_hash: link.data!.properties!.hashed_token, type: "magiclink" });
  assert.equal(v.error, null, `login ${label}: ${v.error?.message}`);
  clients[label] = c;
}

before(async () => {
  if (skip) return;
  admin = createClient(URL, SERVICE!, opts);
  anon = createClient(URL, ANON, opts);
  for (const l of ["o", "x", "r1", "r2", "r3"]) await mk(l);
  await mk("adm", "admin");

  const c = await clients.o.from("courses")
    .insert({ name: `Moderasi ${stamp}`, created_by: ids.o }).select("id").single();
  assert.equal(c.error, null, c.error?.message);
  courseId = c.data!.id;

  const l = await clients.o.from("listings").insert({
    owner_id: ids.o, title: `Listing Moderasi ${stamp}`, course_id: courseId, study_program_id: 1,
    condition: "baik", offer_type: "hibah", authenticity_confirmed: true,
  }).select("id").single();
  assert.equal(l.error, null, l.error?.message);
  listingId = l.data!.id;

  const r = await clients.o.from("book_requests").insert({
    requester_id: ids.o, title: `Dicari Moderasi ${stamp}`, course_id: courseId, accepts: ["hibah"],
  }).select("id").single();
  assert.equal(r.error, null, r.error?.message);
  requestId = r.data!.id;
});

after(async () => {
  if (skip) return;
  await admin.from("moderation_actions").delete().in("target_id", [listingId, requestId].filter(Boolean));
  await admin.from("listings").delete().eq("owner_id", ids.o);
  await admin.from("book_requests").delete().eq("requester_id", ids.o);
  await admin.from("courses").delete().eq("id", courseId);
  for (const id of Object.values(ids)) await admin.auth.admin.deleteUser(id);
});

test("Dicari terbuka terbaca publik; pemilik lain tidak bisa mengubah/menghapus", { skip }, async () => {
  const pub = await anon.from("book_requests").select("id").eq("id", requestId);
  assert.equal(pub.data?.length, 1);

  const upd = await clients.x.from("book_requests").update({ title: "diretas" }).eq("id", requestId).select();
  assert.equal(upd.data?.length ?? 0, 0);
  const del = await clients.x.from("book_requests").delete().eq("id", requestId).select();
  assert.equal(del.data?.length ?? 0, 0);

  const { data } = await admin.from("book_requests").select("title").eq("id", requestId).single();
  assert.ok(data?.title.startsWith("Dicari Moderasi"));
});

test("tidak bisa membuat Dicari atas nama orang lain", { skip }, async () => {
  const r = await clients.x.from("book_requests").insert({
    requester_id: ids.o, title: "Palsu atas nama o", course_id: courseId, accepts: ["jual"],
  });
  assert.ok(r.error);
});

test("Dicari wajib punya minimal satu cara diterima", { skip }, async () => {
  const r = await clients.x.from("book_requests").insert({
    requester_id: ids.x, title: "Tanpa cara", course_id: courseId, accepts: [],
  });
  assert.ok(r.error);
});

test("pemilik tidak bisa menyembunyikan/memulihkan konten sendiri (kolom moderasi dilindungi)", { skip }, async () => {
  await clients.o.from("listings").update({ hidden_at: new Date().toISOString() }).eq("id", listingId);
  const { data } = await admin.from("listings").select("hidden_at").eq("id", listingId).single();
  assert.equal(data?.hidden_at, null);
});

test("auto-hide: 3 pelapor berbeda menyembunyikan listing (AC-14.3)", { skip }, async () => {
  for (const l of ["r1", "r2"]) {
    const r = await clients[l].from("reports").insert({
      reporter_id: ids[l], target_listing_id: listingId, reason: "spam",
    });
    assert.equal(r.error, null, r.error?.message);
  }
  const mid = await admin.from("listings").select("hidden_at").eq("id", listingId).single();
  assert.equal(mid.data?.hidden_at, null, "2 laporan belum cukup");

  const r3 = await clients.r3.from("reports").insert({
    reporter_id: ids.r3, target_listing_id: listingId, reason: "spam",
  });
  assert.equal(r3.error, null, r3.error?.message);

  const after_ = await admin.from("listings").select("hidden_at, hidden_reason").eq("id", listingId).single();
  assert.equal(after_.data?.hidden_reason, "auto_3_reports");

  const pub = await anon.from("listings").select("id").eq("id", listingId);
  assert.equal(pub.data?.length ?? 0, 0, "tersembunyi untuk publik");
  const own = await clients.o.from("listings").select("id").eq("id", listingId);
  assert.equal(own.data?.length, 1, "pemilik masih melihat listingnya");
});

test("laporan: pelapor tidak bisa membaca; non-admin tidak bisa mengubah status", { skip }, async () => {
  const read = await clients.r1.from("reports").select("id");
  assert.equal(read.data?.length ?? 0, 0);
  const upd = await clients.r1.from("reports").update({ status: "ditolak" }).eq("target_listing_id", listingId).select();
  assert.equal(upd.data?.length ?? 0, 0);
});

test("admin bisa membaca laporan dan memulihkan listing", { skip }, async () => {
  const rep = await clients.adm.from("reports").select("id").eq("target_listing_id", listingId);
  assert.equal(rep.data?.length, 3);

  const un = await clients.adm.from("listings")
    .update({ hidden_at: null, hidden_reason: null }).eq("id", listingId).select("id");
  assert.equal(un.data?.length, 1);
  const { data } = await admin.from("listings").select("hidden_at").eq("id", listingId).single();
  assert.equal(data?.hidden_at, null);
});

test("riwayat moderasi: hanya admin, dan append-only", { skip }, async () => {
  const ok = await clients.adm.from("moderation_actions").insert({
    admin_id: ids.adm, action: "unhide_listing", target_id: listingId, reason: "uji pemulihan",
  }).select("id").single();
  assert.equal(ok.error, null, ok.error?.message);

  const spoof = await clients.adm.from("moderation_actions").insert({
    admin_id: ids.o, action: "hide_listing", target_id: listingId, reason: "atas nama orang lain",
  });
  assert.ok(spoof.error, "admin tidak boleh menulis atas nama admin lain");

  const upd = await clients.adm.from("moderation_actions")
    .update({ reason: "diubah" }).eq("id", ok.data!.id).select();
  assert.equal(upd.data?.length ?? 0, 0, "tidak ada policy UPDATE");
  const del = await clients.adm.from("moderation_actions").delete().eq("id", ok.data!.id).select();
  assert.equal(del.data?.length ?? 0, 0, "tidak ada policy DELETE");

  const nonAdmin = await clients.x.from("moderation_actions").select("id");
  assert.equal(nonAdmin.data?.length ?? 0, 0);
});

test("daftar blokir email tidak bisa diakses klien", { skip }, async () => {
  const r = await clients.adm.from("banned_emails").select("*");
  assert.ok(r.error, "bahkan admin lewat klien tidak punya akses");
  const w = await clients.x.from("banned_emails").insert({ email_sha256: "x" });
  assert.ok(w.error);
});

test("log_event: nama event di luar whitelist ditolak", { skip }, async () => {
  const good = await clients.x.rpc("log_event", { p_name: "listing_created", p_props: {} });
  assert.equal(good.error, null, good.error?.message);
  const bad = await clients.x.rpc("log_event", { p_name: "admin_granted", p_props: {} });
  assert.ok(bad.error);
  const anonCall = await anon.rpc("log_event", { p_name: "listing_created", p_props: {} });
  assert.ok(anonCall.error);
});
