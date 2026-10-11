import { test } from "node:test";
import assert from "node:assert/strict";
import { fuzzyScore, rankFuzzy, FUZZY_THRESHOLD } from "../src/lib/fuzzy.ts";

const T = "basis data praktis basis data pend informatika";

test("AC-09.1: kata digabung/dipisah tetap cocok", () => {
  assert.ok(fuzzyScore("basisdata", T) >= FUZZY_THRESHOLD);
  assert.ok(fuzzyScore("basis data", T) >= FUZZY_THRESHOLD);
});

test("AC-09.1: salah ketik ringan tetap cocok", () => {
  assert.ok(fuzzyScore("bsis data", T) >= FUZZY_THRESHOLD, "bsis");
  assert.ok(fuzzyScore("basis dta praktis", T) >= FUZZY_THRESHOLD, "dta");
  assert.ok(fuzzyScore("algoritma strukur data", "algoritma dan struktur data pend informatika") >= FUZZY_THRESHOLD, "strukur");
  assert.ok(fuzzyScore("jaringan komputr", "jaringan komputer dasar tek pendidikan") >= FUZZY_THRESHOLD, "komputr");
});

test("kata yang tidak berhubungan tidak cocok", () => {
  assert.ok(fuzzyScore("kimia organik", T) < FUZZY_THRESHOLD);
  assert.ok(fuzzyScore("akuntansi biaya", "jaringan komputer dasar") < FUZZY_THRESHOLD);
});

test("query kosong atau simbol saja tidak cocok apa pun", () => {
  assert.equal(fuzzyScore("", T), 0);
  assert.equal(fuzzyScore("!!!", T), 0);
});

test("rankFuzzy mengurutkan dan membuang di bawah ambang", () => {
  const items = [
    { id: 1, t: "kimia dasar" },
    { id: 2, t: "basis data praktis" },
    { id: 3, t: "basis dasar elektronika" },
  ];
  const r = rankFuzzy("basisdata", items, (x) => x.t);
  assert.equal(r[0].item.id, 2);
  assert.ok(!r.some((x) => x.item.id === 1));
});
