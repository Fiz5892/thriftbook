"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import { createListing, type ListingFormState } from "./actions";
import {
  CONDITIONS, CONDITION_LABEL, CONDITION_HELP, OFFER_TYPES, OFFER_LABEL,
} from "@/lib/schemas";
import { photoUrl } from "@/lib/format";

type Photo = { id: string; thumb: string };
const MAX_INPUT = 10 * 1024 * 1024;
const input = "min-h-11 w-full rounded-xl border border-line px-4 py-2";

export function ListingForm({
  programs,
  defaultProgramId,
}: {
  programs: { id: number; short_name: string }[];
  defaultProgramId?: number;
}) {
  const [state, action, pending] = useActionState<ListingFormState, FormData>(createListing, {});
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [offer, setOffer] = useState<string>("");
  const [condition, setCondition] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
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
  }

  // Bawa pengguna ke ringkasan error: tanpa ini pesan di tengah form tak terlihat dari tombol
  useEffect(() => {
    if (state.error || Object.keys(fe).length) {
      summaryRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
      summaryRef.current?.focus();
    }
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  const FIELD_LABEL: Record<string, string> = {
    photoIds: "Foto", title: "Judul buku", course: "Mata kuliah", studyProgramId: "Prodi",
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

  return (
    <form action={action} className="mt-6 flex flex-col gap-5" noValidate>
      <fieldset>
        <legend className="font-semibold">Foto (1–3)</legend>
        <div className="mt-2 flex flex-wrap gap-3">
          {photos.map((p, i) => (
            <div key={p.id} className="relative size-24 overflow-hidden rounded-xl border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoUrl(p.thumb)} alt={`Foto ke-${i + 1}`} className="size-full object-cover" />
              <input type="hidden" name="photoIds" value={p.id} />
              {i === 0 && (
                <span className="absolute bottom-0 left-0 bg-yellow-400 px-2 text-xs font-semibold text-navy-900">
                  Sampul
                </span>
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
              className="flex size-24 items-center justify-center rounded-xl border border-dashed border-navy-600 px-2 text-center text-sm font-semibold text-navy-900 disabled:opacity-60"
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
          <select name="studyProgramId" defaultValue={v.studyProgramId ?? defaultProgramId ?? ""} className={input}>
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

      <fieldset>
        <legend className="font-semibold">Kondisi</legend>
        <div className="mt-2 flex flex-col gap-2">
          {CONDITIONS.map((c) => (
            <label key={c} className="flex items-start gap-3 rounded-xl border border-line p-3">
              <input type="radio" name="condition" value={c} checked={condition === c}
                onChange={() => setCondition(c)} className="mt-1 size-5" />
              <span>
                <span className="font-semibold">{CONDITION_LABEL[c]}</span>
                <span className="block text-sm text-muted">{CONDITION_HELP[c]}</span>
              </span>
            </label>
          ))}
        </div>
        {fe.condition && <span role="alert" className="text-sm text-danger">{fe.condition}</span>}
      </fieldset>

      <fieldset>
        <legend className="font-semibold">Mau diapakan?</legend>
        <div className="mt-2 flex gap-2">
          {OFFER_TYPES.map((t) => (
            <label key={t} className={`flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-full border px-3 text-center text-sm font-semibold ${offer === t ? "border-navy-900 bg-navy-900 text-white" : "border-line"}`}>
              <input type="radio" name="offerType" value={t} checked={offer === t}
                onChange={() => setOffer(t)} className="sr-only" />
              {OFFER_LABEL[t]}
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
        <input type="checkbox" name="authenticity" defaultChecked={v.authenticity === "on"} className="mt-1 size-5" />
        <span>Ini buku fisik asli, bukan fotokopi, cetak ulang, atau file PDF.</span>
      </label>
      {fe.authenticity && <span role="alert" className="-mt-3 text-sm text-danger">{fe.authenticity}</span>}

      <div ref={summaryRef} tabIndex={-1} aria-live="assertive">
        {(state.error || Object.keys(fe).length > 0) && (
          <div role="alert" className="rounded-xl border border-danger px-4 py-3 text-danger">
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

      <button disabled={pending || uploading}
        className="min-h-11 rounded-full bg-yellow-400 px-6 py-3 font-semibold text-navy-900 disabled:opacity-60">
        {pending ? "Memposting…" : "Terbitkan"}
      </button>
    </form>
  );
}
