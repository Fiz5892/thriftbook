"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { updateListing, type EditState } from "./actions";
import { CONDITIONS, CONDITION_LABEL, CONDITION_HELP, OFFER_TYPES, OFFER_LABEL } from "@/lib/schemas";

const input = "input";
const FIELD_LABEL: Record<string, string> = {
  title: "Judul buku", course: "Mata kuliah", studyProgramId: "Prodi", condition: "Kondisi",
  offerType: "Mau diapakan", price: "Harga", swapWish: "Ingin ditukar dengan",
};

export function EditForm({
  id, programs, initial,
}: {
  id: string;
  programs: { id: number; short_name: string }[];
  initial: Record<string, string>;
}) {
  const [state, action, pending] = useActionState<EditState, FormData>(updateListing, {});
  const fe = state.fieldErrors ?? {};
  const v = { ...initial, ...(state.values ?? {}) };
  const [condition, setCondition] = useState(initial.condition);
  const [offer, setOffer] = useState(initial.offerType);
  const [seen, setSeen] = useState(state);
  if (seen !== state) {
    setSeen(state);
    if (state.values?.condition) setCondition(state.values.condition);
    if (state.values?.offerType) setOffer(state.values.offerType);
  }
  const summary = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state.error || Object.keys(fe).length) {
      summary.current?.scrollIntoView({ block: "center", behavior: "smooth" });
      summary.current?.focus();
    }
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <form action={action} className="mt-6 flex flex-col gap-5" noValidate>
      <input type="hidden" name="id" value={id} />

      <label className="flex flex-col gap-1">
        <span className="font-semibold">Judul buku</span>
        <input name="title" defaultValue={v.title} maxLength={120} className={input} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="font-semibold">Penulis</span>
        <input name="author" defaultValue={v.author} maxLength={80} className={input} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="font-semibold">Mata kuliah</span>
        <input name="course" defaultValue={v.course} maxLength={80} className={input} />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="font-semibold">Prodi</span>
          <select name="studyProgramId" defaultValue={v.studyProgramId} className={input}>
            {programs.map((p) => <option key={p.id} value={p.id}>{p.short_name}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-semibold">Semester</span>
          <select name="semester" defaultValue={v.semester} className={input}>
            <option value="">Bebas</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
      </div>

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
      </fieldset>

      <fieldset>
        <legend className="font-semibold">Mau diapakan?</legend>
        <div className="mt-2 flex gap-2">
          {OFFER_TYPES.map((t) => (
            <label key={t} className="option min-h-11 flex-1 items-center justify-center text-center text-sm font-semibold has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-navy-600">
              <input type="radio" name="offerType" value={t} checked={offer === t}
                onChange={() => setOffer(t)} className="sr-only" />
              {OFFER_LABEL[t]}
            </label>
          ))}
        </div>
      </fieldset>

      {offer === "jual" && (
        <label className="flex flex-col gap-1">
          <span className="font-semibold">Harga (Rp)</span>
          <input name="price" defaultValue={v.price} inputMode="numeric" className={input} />
          <span className="text-sm text-muted">Rp1.000–Rp1.000.000, kelipatan Rp500.</span>
        </label>
      )}
      {offer === "tukar" && (
        <label className="flex flex-col gap-1">
          <span className="font-semibold">Ingin ditukar dengan</span>
          <input name="swapWish" defaultValue={v.swapWish} maxLength={200} className={input} />
        </label>
      )}

      <label className="flex flex-col gap-1">
        <span className="font-semibold">Catatan</span>
        <textarea name="notes" defaultValue={v.notes} rows={3} maxLength={500} className={input} />
      </label>

      <div ref={summary} tabIndex={-1} aria-live="assertive">
        {(state.error || Object.keys(fe).length > 0) && (
          <div role="alert" className="alert-danger">
            <p className="font-semibold">Perubahannya belum tersimpan.</p>
            {state.error && <p>{state.error}</p>}
            {Object.keys(fe).length > 0 && (
              <ul className="mt-1 list-disc pl-5">
                {Object.entries(fe).map(([k, m]) => <li key={k}>{FIELD_LABEL[k] ?? k}: {m}</li>)}
              </ul>
            )}
          </div>
        )}
      </div>

      <button disabled={pending}
        className="btn btn-yellow disabled:opacity-60">
        {pending ? "Menyimpan…" : "Simpan perubahan"}
      </button>
    </form>
  );
}
