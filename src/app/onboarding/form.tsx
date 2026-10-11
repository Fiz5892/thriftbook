"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { completeOnboarding, type FormState } from "./actions";

type Props = {
  programs: { id: number; short_name: string }[];
  next: string;
  defaults: { displayName: string; studyProgramId?: number; cohortYear?: number };
};

const input = "min-h-11 w-full rounded-xl border border-line px-4 py-2";

export function OnboardingForm({ programs, next, defaults }: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(completeOnboarding, {});
  const [staff, setStaff] = useState(false);
  const fe = state.fieldErrors ?? {};

  return (
    <form action={action} className="mt-6 flex flex-col gap-5" noValidate>
      <input type="hidden" name="next" value={next} />

      <label className="flex flex-col gap-1">
        <span className="font-semibold">Nama tampilan</span>
        <input name="displayName" defaultValue={defaults.displayName} className={input} autoComplete="given-name" />
        {fe.displayName && <span role="alert" className="text-sm text-danger">{fe.displayName}</span>}
      </label>

      <label className="flex flex-col gap-1">
        <span className="font-semibold">Prodi</span>
        <select name="studyProgramId" defaultValue={defaults.studyProgramId ?? ""} className={input}>
          <option value="" disabled>Pilih prodi</option>
          {programs.map((p) => <option key={p.id} value={p.id}>{p.short_name}</option>)}
        </select>
        {fe.studyProgramId && <span role="alert" className="text-sm text-danger">{fe.studyProgramId}</span>}
      </label>

      <label className="flex items-center gap-3">
        <input type="checkbox" name="isStaff" checked={staff} onChange={(e) => setStaff(e.target.checked)} className="size-5" />
        <span>Aku dosen/staf</span>
      </label>

      {!staff && (
        <label className="flex flex-col gap-1">
          <span className="font-semibold">Angkatan <span className="font-normal text-muted">(opsional)</span></span>
          <input name="cohortYear" inputMode="numeric" placeholder="2023" defaultValue={defaults.cohortYear} className={input} />
          {fe.cohortYear && <span role="alert" className="text-sm text-danger">{fe.cohortYear}</span>}
        </label>
      )}

      <label className="flex flex-col gap-1">
        <span className="font-semibold">Nomor WhatsApp</span>
        <input name="whatsapp" inputMode="tel" placeholder="0812-3456-7801" className={input} autoComplete="tel" />
        {fe.whatsapp && <span role="alert" className="text-sm text-danger">{fe.whatsapp}</span>}
      </label>

      <label className="flex items-start gap-3">
        <input type="checkbox" name="consent" className="mt-1 size-5" />
        <span>
          Aku setuju dengan <Link href="/syarat" className="underline">Syarat Penggunaan</Link> dan{" "}
          <Link href="/kebijakan-privasi" className="underline">Kebijakan Privasi</Link>.
        </span>
      </label>
      {fe.consent && <span role="alert" className="-mt-3 text-sm text-danger">{fe.consent}</span>}

      {state.error && <p role="alert" className="rounded-xl border border-danger px-4 py-3 text-danger">{state.error}</p>}

      <button disabled={pending} className="min-h-11 rounded-full bg-navy-900 px-6 py-3 font-semibold text-white disabled:opacity-60">
        {pending ? "Menyimpan…" : "Simpan & lanjut"}
      </button>
    </form>
  );
}
