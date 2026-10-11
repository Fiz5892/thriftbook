"use client";

import { useActionState, useEffect, useRef } from "react";
import { createRequest, type RequestFormState } from "../actions";
import { OFFER_TYPES } from "@/lib/schemas";

const input = "input";
const ACCEPT_LABEL = { jual: "Beli", hibah: "Hibah (gratis)", tukar: "Tukar" } as const;
const FIELD_LABEL: Record<string, string> = {
  title: "Judul atau topik", course: "Mata kuliah", accepts: "Cara yang diterima",
  maxBudget: "Anggaran", semester: "Semester", studyProgramId: "Prodi", notes: "Catatan",
};

export function RequestForm({
  programs,
  initial,
}: {
  programs: { id: number; short_name: string }[];
  initial: { title: string; course: string };
}) {
  const [state, action, pending] = useActionState<RequestFormState, FormData>(createRequest, {});
  const fe = state.fieldErrors ?? {};
  const v = state.values ?? {};
  const accepted = (v.accepts ?? "jual,hibah,tukar").split(",");
  const summary = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.error || Object.keys(fe).length) {
      summary.current?.scrollIntoView({ block: "center", behavior: "smooth" });
      summary.current?.focus();
    }
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <form action={action} className="mt-6 flex flex-col gap-5" noValidate>
      <label className="flex flex-col gap-1">
        <span className="font-semibold">Judul atau topik buku</span>
        <input name="title" defaultValue={v.title ?? initial.title} maxLength={120} className={input}
          placeholder="Belajar dan Pembelajaran" />
        {fe.title && <span role="alert" className="text-sm text-danger">{fe.title}</span>}
      </label>

      <label className="flex flex-col gap-1">
        <span className="font-semibold">Mata kuliah</span>
        <input name="course" defaultValue={v.course ?? initial.course} maxLength={80} className={input} />
        {fe.course && <span role="alert" className="text-sm text-danger">{fe.course}</span>}
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="font-semibold">Prodi <span className="font-normal text-muted">(opsional)</span></span>
          <select name="studyProgramId" defaultValue={v.studyProgramId ?? ""} className={input}>
            <option value="">Bebas</option>
            {programs.map((p) => <option key={p.id} value={p.id}>{p.short_name}</option>)}
          </select>
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
        <legend className="font-semibold">Aku terima</legend>
        <div className="mt-2 flex flex-wrap gap-4">
          {OFFER_TYPES.map((t) => (
            <label key={t} className="flex items-center gap-2">
              <input type="checkbox" name="accepts" value={t} defaultChecked={accepted.includes(t)} className="check" />
              {ACCEPT_LABEL[t]}
            </label>
          ))}
        </div>
        {fe.accepts && <span role="alert" className="text-sm text-danger">{fe.accepts}</span>}
      </fieldset>

      <label className="flex flex-col gap-1">
        <span className="font-semibold">Anggaran maksimal (Rp) <span className="font-normal text-muted">(opsional)</span></span>
        <input name="maxBudget" defaultValue={v.maxBudget} inputMode="numeric" placeholder="30000" className={input} />
        {fe.maxBudget && <span role="alert" className="text-sm text-danger">{fe.maxBudget}</span>}
      </label>

      <label className="flex flex-col gap-1">
        <span className="font-semibold">Catatan <span className="font-normal text-muted">(opsional)</span></span>
        <textarea name="notes" defaultValue={v.notes} rows={3} maxLength={300} className={input}
          placeholder="Edisi tertentu, atau bisa ketemu di gedung mana" />
      </label>

      <div ref={summary} tabIndex={-1} aria-live="assertive">
        {(state.error || Object.keys(fe).length > 0) && (
          <div role="alert" className="alert-danger">
            <p className="font-semibold">Dicari-mu belum terpasang.</p>
            {state.error && <p>{state.error}</p>}
            {Object.keys(fe).length > 0 && (
              <ul className="mt-1 list-disc pl-5">
                {Object.entries(fe).map(([k, m]) => <li key={k}>{FIELD_LABEL[k] ?? k}: {m}</li>)}
              </ul>
            )}
            <p className="mt-1 text-sm">Isianmu tidak hilang, tinggal lengkapi lalu kirim lagi.</p>
          </div>
        )}
      </div>

      <button disabled={pending}
        className="btn btn-yellow disabled:opacity-60">
        {pending ? "Memasang…" : "Pasang Dicari"}
      </button>
    </form>
  );
}
