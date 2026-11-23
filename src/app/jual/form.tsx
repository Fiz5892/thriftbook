"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import { createListing, type ListingFormState } from "./actions";
import {
  CONDITIONS, CONDITION_LABEL, CONDITION_HELP, OFFER_TYPES, OFFER_LABEL,
  BOOK_FORMATS, FORMAT_LABEL, OTHER_PROGRAM_SLUG, MAX_EBOOK_BYTES,
} from "@/lib/schemas";
import { createClient } from "@/lib/supabase/client";
import { photoUrl } from "@/lib/format";
import { DRAFT_KEY, DRAFT_FIELDS, DRAFT_RADIOS } from "@/lib/draft";

type Photo = { id: string; thumb: string };
type Ebook = { path: string; name: string; size: number };
const MAX_INPUT = 10 * 1024 * 1024;
const input = "input";

export function ListingForm({
  programs,
  defaultProgramId,
}: {
  programs: { id: number; slug: string; short_name: string }[];
  defaultProgramId?: number;
}) {
  const [state, action, pending] = useActionState<ListingFormState, FormData>(createListing, {});
  const v0 = state.values ?? {};
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [format, setFormat] = useState<string>("fisik");
  const [ebook, setEbook] = useState<Ebook | null>(null);
  const [ebookUploading, setEbookUploading] = useState(false);
  const [ebookError, setEbookError] = useState<string | null>(null);
  const ebookRef = useRef<HTMLInputElement>(null);
  const [progId, setProgId] = useState<string>(String(v0.studyProgramId ?? defaultProgramId ?? ""));
  const [offer, setOffer] = useState<string>("");
  const [condition, setCondition] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const fe = state.fieldErrors ?? {};
  const v = state.values ?? {};
  const summaryRef = useRef<HTMLDivElement>(null);

  // Setelah gagal, kembalikan pilihan radio dari isian yang dikirim (disesuaikan saat render,
  // bukan di effect, sesuai anjuran React untuk state turunan dari hasil action)
  const [seen, setSeen] = useState(state);
  if (seen !== state) {
    setSeen(state);
    if (state.values?.condition) setCondition(state.values.condition);
    if (state.values?.offerType) setOffer(state.values.offerType);
    if (state.values?.format) setFormat(state.values.format);
    if (state.values?.studyProgramId) setProgId(state.values.studyProgramId);
  }

  // AC-04.9: pulihkan draf teks jika koneksi/halaman terputus. DOM ditulis langsung (bukan
  // setState di effect); radio dipulihkan dengan meng-klik agar state React ikut berubah.
  useEffect(() => {
    if (state.values) return;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      const form = formRef.current;
      if (!raw || !form) return;
      const d = JSON.parse(raw) as Record<string, string>;
      for (const k of DRAFT_FIELDS) {
        const el = form.elements.namedItem(k) as HTMLInputElement | HTMLSelectElement | null;
        if (el && d[k] !== undefined && "value" in el && !el.value) el.value = d[k];
      }
      for (const k of DRAFT_RADIOS) {
        if (!d[k]) continue;
        form.querySelector<HTMLInputElement>(`input[name="${k}"][value="${CSS.escape(d[k])}"]`)?.click();
      }
      // select dipulihkan lewat DOM; beri tahu React agar kolom "Lainnya" ikut menyesuaikan
      form.querySelector("select[name=studyProgramId]")?.dispatchEvent(new Event("change", { bubbles: true }));
    } catch {
      // draf rusak atau localStorage diblokir: abaikan
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function saveDraft() {
    try {
      const form = formRef.current;
      if (!form) return;
      const fd = new FormData(form);
      const d: Record<string, string> = {};
      for (const k of [...DRAFT_FIELDS, ...DRAFT_RADIOS]) {
        const v = fd.get(k);
        if (typeof v === "string") d[k] = v;
      }
      localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
    } catch {
      // abaikan
    }
  }

  function makeCover(id: string) {
    setPhotos((p) => {
      const picked = p.find((x) => x.id === id);
      return picked ? [picked, ...p.filter((x) => x.id !== id)] : p;
    });
  }

  // Bawa pengguna ke ringkasan error: tanpa ini pesan di tengah form tak terlihat dari tombol
  useEffect(() => {
    if (state.error || Object.keys(fe).length) {
      summaryRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
      summaryRef.current?.focus();
    }
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  const FIELD_LABEL: Record<string, string> = {
    photoIds: "Foto", ebookPath: "File PDF", studyProgramOther: "Nama prodi", format: "Format", title: "Judul buku", course: "Mata kuliah", studyProgramId: "Prodi",
    condition: "Kondisi", offerType: "Mau diapakan", price: "Harga", swapWish: "Ingin ditukar dengan",
    authenticity: "Pernyataan keaslian", semester: "Semester", author: "Penulis", notes: "Catatan",
  };

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPhotoError(null);

    if (file.size > MAX_INPUT) {
      return setPhotoError("Fotonya kebesaran (maks 10 MB). Coba foto ulang atau pilih yang lain.");
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      return setPhotoError("Pakai foto JPG, PNG, atau WebP.");
    }

    setUploading(true);
    try {
      // Kompres di klien untuk menghemat kuota; validasi sebenarnya tetap di server (SEC-52)
      const small = await imageCompression(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1600,
        fileType: "image/webp",
        useWebWorker: false, // worker blob akan diblokir CSP bernonce
      });
      const body = new FormData();
      body.append("file", small, "foto.webp");
      const res = await fetch("/api/photos", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "Fotonya gagal keunggah.");
      setPhotos((p) => [...p, { id: json.id, thumb: json.thumb }]);
    } catch (err) {
      setPhotoError(
        err instanceof Error ? err.message : "Fotonya gagal keunggah. Cek sinyalmu, lalu coba lagi.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function onPickPdf(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setEbookError(null);
    if (file.size > MAX_EBOOK_BYTES) return setEbookError("PDF-nya kebesaran. Maksimal 20 MB.");
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return setEbookError("Pilih file berformat PDF.");
    }
    setEbookUploading(true);
    try {
      // 1) minta URL unggah dari server (cek login + batas), 2) unggah langsung ke Storage
      const res = await fetch("/api/ebooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ size: file.size }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "PDF-nya gagal keunggah.");
      const up = await createClient().storage
        .from("ebooks").uploadToSignedUrl(json.path, json.token, file, { contentType: "application/pdf" });
      if (up.error) throw new Error("PDF-nya gagal keunggah. Cek sinyalmu, lalu coba lagi.");
      setEbook({ path: json.path, name: file.name, size: file.size });
    } catch (err) {
      setEbookError(err instanceof Error ? err.message : "PDF-nya gagal keunggah. Coba lagi.");
    } finally {
      setEbookUploading(false);
    }
  }

  const isEbook = format === "ebook";
  const isOther = programs.find((p) => String(p.id) === progId)?.slug === OTHER_PROGRAM_SLUG;
  const offerTypes = isEbook ? OFFER_TYPES.filter((t) => t !== "tukar") : OFFER_TYPES;

  return (
    <form ref={formRef} action={action} onChange={saveDraft} className="mt-6 flex flex-col gap-5" noValidate>
      <fieldset>
        <legend className="font-semibold">Mau pasang apa?</legend>
        <div className="mt-2 flex gap-2">
          {BOOK_FORMATS.map((f) => (
            <label key={f} className="option min-h-11 flex-1 items-center justify-center text-center text-sm font-semibold has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-navy-600">
              <input type="radio" name="format" value={f} checked={format === f}
                onChange={() => { setFormat(f); if (f === "ebook" && offer === "tukar") setOffer(""); }}
                className="sr-only" />
              {FORMAT_LABEL[f]}
            </label>
          ))}
        </div>
      </fieldset>

      {isEbook && (
        <fieldset>
          <legend className="font-semibold">File PDF (maks 20 MB)</legend>
          {ebook ? (
            <div className="card mt-2 flex items-center justify-between gap-3 px-4 py-3">
              <p className="min-w-0 text-sm">
                <span className="block truncate font-semibold">{ebook.name}</span>
                <span className="text-muted">{(ebook.size / 1024 / 1024).toFixed(1)} MB · terunggah</span>
              </p>
              <button type="button" onClick={() => setEbook(null)} className="btn btn-sm btn-outline">Ganti</button>
              <input type="hidden" name="ebookPath" value={ebook.path} />
            </div>
          ) : (
            <button
              type="button" disabled={ebookUploading} onClick={() => ebookRef.current?.click()}
              className="mt-2 flex min-h-20 w-full items-center justify-center rounded-[18px] border-2 border-dashed border-ink bg-paper px-2 text-center text-sm font-semibold text-ink hover:bg-yellow-400 disabled:opacity-60"
            >
              {ebookUploading ? "Mengunggah PDF…" : "Pilih file PDF"}
            </button>
          )}
          <input ref={ebookRef} type="file" accept="application/pdf,.pdf" onChange={onPickPdf}
            className="hidden" aria-label="Pilih file PDF" />
          <p className="mt-1 text-sm text-muted">
            E-book langsung tampil di katalog. Pastikan kamu berhak membagikannya; e-book yang dilaporkan melanggar hak cipta akan diturunkan.
          </p>
          {(ebookError || fe.ebookPath) && (
            <p role="alert" className="mt-1 text-sm text-danger">{ebookError ?? fe.ebookPath}</p>
          )}
        </fieldset>
      )}

      <fieldset>
        <legend className="font-semibold">{isEbook ? "Foto sampul (opsional, maks 3)" : "Foto (1–3)"}</legend>
        <div className="mt-2 flex flex-wrap gap-3">
          {photos.map((p, i) => (
            <div key={p.id} className="card relative size-24 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoUrl(p.thumb)} alt={`Foto ke-${i + 1}`} className="size-full object-cover" />
              <input type="hidden" name="photoIds" value={p.id} />
              {i === 0 ? (
                <span className="absolute bottom-0 left-0 bg-yellow-400 px-2 text-xs font-semibold text-navy-900">
                  Sampul
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => makeCover(p.id)}
                  className="absolute bottom-0 left-0 right-0 bg-white/90 px-1 py-1 text-xs font-semibold text-navy-900"
                >
                  Jadikan sampul
                </button>
              )}
              <button
                type="button"
                aria-label={`Hapus foto ke-${i + 1}`}
                onClick={() => setPhotos((x) => x.filter((y) => y.id !== p.id))}
                className="absolute right-0 top-0 size-7 bg-white/90 font-bold"
              >
                ×
              </button>
            </div>
          ))}
          {photos.length < 3 && (
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="flex size-24 items-center justify-center rounded-[18px] border-2 border-dashed border-ink bg-paper px-2 text-center text-sm font-semibold text-ink hover:bg-yellow-400 disabled:opacity-60"
            >
              {uploading ? "Mengunggah…" : "Tambah foto"}
            </button>
          )}
        </div>
        <input
          ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment"
          onChange={onPick} className="hidden" aria-label="Pilih foto buku"
        />
        {(photoError || fe.photoIds) && (
          <p role="alert" className="mt-2 text-sm text-danger">{photoError ?? fe.photoIds}</p>
        )}
      </fieldset>

      <label className="flex flex-col gap-1">
        <span className="font-semibold">Judul buku</span>
        <input name="title" defaultValue={v.title} className={input} maxLength={120} />
        {fe.title && <span role="alert" className="text-sm text-danger">{fe.title}</span>}
      </label>

      <label className="flex flex-col gap-1">
        <span className="font-semibold">Penulis <span className="font-normal text-muted">(opsional)</span></span>
        <input name="author" defaultValue={v.author} className={input} maxLength={80} />
      </label>

      <label className="flex flex-col gap-1">
        <span className="font-semibold">Mata kuliah</span>
        <input name="course" defaultValue={v.course} className={input} maxLength={80} placeholder="Basis Data" />
        {fe.course && <span role="alert" className="text-sm text-danger">{fe.course}</span>}
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="font-semibold">Prodi</span>
          <select name="studyProgramId" defaultValue={v.studyProgramId ?? defaultProgramId ?? ""} className={input}
            onChange={(e) => setProgId(e.target.value)}>
            <option value="" disabled>Pilih</option>
            {programs.map((p) => <option key={p.id} value={p.id}>{p.short_name}</option>)}
          </select>
          {fe.studyProgramId && <span role="alert" className="text-sm text-danger">{fe.studyProgramId}</span>}
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-semibold">Semester</span>
          <select name="semester" defaultValue={v.semester ?? ""} className={input}>
            <option value="">Bebas</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
      </div>

      {/* Tetap ada di DOM (hidden) agar pemulihan draf bisa mengisinya */}
      <label className={isOther ? "flex flex-col gap-1" : "hidden"}>
        <span className="font-semibold">Nama prodimu</span>
        <input name="studyProgramOther" defaultValue={v.studyProgramOther} maxLength={60}
          className={input} placeholder="Mis. Pendidikan Sejarah" />
        {fe.studyProgramOther && <span role="alert" className="text-sm text-danger">{fe.studyProgramOther}</span>}
      </label>

      {!isEbook && (
      <fieldset>
        <legend className="font-semibold">Kondisi</legend>
        <div className="mt-2 flex flex-col gap-2">
          {CONDITIONS.map((c) => (
            <label key={c} className="option has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-navy-600">
              <input type="radio" name="condition" value={c} checked={condition === c}
                onChange={() => setCondition(c)} className="check mt-0.5" />
              <span>
                <span className="font-semibold">{CONDITION_LABEL[c]}</span>
                <span className="block text-sm text-muted">{CONDITION_HELP[c]}</span>
              </span>
            </label>
          ))}
        </div>
        {fe.condition && <span role="alert" className="text-sm text-danger">{fe.condition}</span>}
      </fieldset>
      )}

      <fieldset>
        <legend className="font-semibold">Mau diapakan?</legend>
        <div className="mt-2 flex gap-2">
          {offerTypes.map((t) => (
            <label key={t} className="option min-h-11 flex-1 items-center justify-center text-center text-sm font-semibold has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-navy-600">
              <input type="radio" name="offerType" value={t} checked={offer === t}
                onChange={() => setOffer(t)} className="sr-only" />
              {isEbook && t === "hibah" ? "Gratis" : OFFER_LABEL[t]}
            </label>
          ))}
        </div>
        {fe.offerType && <span role="alert" className="text-sm text-danger">{fe.offerType}</span>}
      </fieldset>

      {offer === "jual" && (
        <label className="flex flex-col gap-1">
          <span className="font-semibold">Harga (Rp)</span>
          <input name="price" defaultValue={v.price} inputMode="numeric" placeholder="45000" className={input} />
          <span className="text-sm text-muted">Rp1.000–Rp1.000.000, kelipatan Rp500.</span>
          {fe.price && <span role="alert" className="text-sm text-danger">{fe.price}</span>}
        </label>
      )}
      {offer === "tukar" && (
        <label className="flex flex-col gap-1">
          <span className="font-semibold">Ingin ditukar dengan</span>
          <input name="swapWish" defaultValue={v.swapWish} maxLength={200} className={input} />
          {fe.swapWish && <span role="alert" className="text-sm text-danger">{fe.swapWish}</span>}
        </label>
      )}

      <label className="flex flex-col gap-1">
        <span className="font-semibold">Catatan <span className="font-normal text-muted">(opsional)</span></span>
        <textarea name="notes" defaultValue={v.notes} rows={3} maxLength={500} className={input}
          placeholder="Edisi, halaman yang hilang, atau info lain" />
      </label>

      <label className="flex items-start gap-3">
        <input type="checkbox" name="authenticity" defaultChecked={v.authenticity === "on"} className="mt-1 check" />
        <span>
          {isEbook
            ? "Aku berhak membagikan file ini (karyaku sendiri, berlisensi terbuka, atau ada izin penulis/penerbit), bukan hasil bajakan."
            : "Ini buku fisik asli, bukan fotokopi, cetak ulang, atau file PDF."}
        </span>
      </label>
      {fe.authenticity && <span role="alert" className="-mt-3 text-sm text-danger">{fe.authenticity}</span>}

      <div ref={summaryRef} tabIndex={-1} aria-live="assertive">
        {(state.error || Object.keys(fe).length > 0) && (
          <div role="alert" className="alert-danger">
            <p className="font-semibold">Bukunya belum terposting.</p>
            {state.error && <p>{state.error}</p>}
            {Object.keys(fe).length > 0 && (
              <ul className="mt-1 list-disc pl-5">
                {Object.entries(fe).map(([k, msg]) => (
                  <li key={k}>{FIELD_LABEL[k] ?? k}: {msg}</li>
                ))}
              </ul>
            )}
            <p className="mt-1 text-sm">Isianmu tidak hilang, tinggal lengkapi lalu kirim lagi.</p>
          </div>
        )}
      </div>

      <button disabled={pending || uploading || ebookUploading}
        className="btn btn-yellow disabled:opacity-60">
        {pending ? "Memposting…" : "Terbitkan"}
      </button>
    </form>
  );
}
