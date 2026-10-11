"use client";

import { useActionState } from "react";
import { updateProfile, type ProfileState } from "./actions";

const input = "input";

export function ProfileForm({
  programs,
  initial,
}: {
  programs: { id: number; short_name: string }[];
  initial: {
    displayName: string; studyProgramId: string; cohortYear: string;
    isStaff: boolean; whatsapp: string; hidden: boolean;
  };
}) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(updateProfile, {});
  const fe = state.fieldErrors ?? {};

  return (
    <form action={action} className="mt-6 flex flex-col gap-5" noValidate>
      <label className="flex flex-col gap-1">
        <span className="font-semibold">Nama tampilan</span>
        <input name="displayName" defaultValue={initial.displayName} className={input} />
        {fe.displayName && <span role="alert" className="text-sm text-danger">{fe.displayName}</span>}
      </label>
      <label className="flex flex-col gap-1">
        <span className="font-semibold">Prodi</span>
        <select name="studyProgramId" defaultValue={initial.studyProgramId} className={input}>
          {programs.map((p) => <option key={p.id} value={p.id}>{p.short_name}</option>)}
        </select>
      </label>
      {initial.isStaff ? (
        <input type="hidden" name="isStaff" value="on" />
      ) : (
        <label className="flex flex-col gap-1">
          <span className="font-semibold">Angkatan</span>
          <input name="cohortYear" defaultValue={initial.cohortYear} inputMode="numeric" className={input} />
          {fe.cohortYear && <span role="alert" className="text-sm text-danger">{fe.cohortYear}</span>}
        </label>
      )}
      <label className="flex flex-col gap-1">
        <span className="font-semibold">Nomor WhatsApp</span>
        <input name="whatsapp" defaultValue={initial.whatsapp} inputMode="tel" className={input} />
        {fe.whatsapp && <span role="alert" className="text-sm text-danger">{fe.whatsapp}</span>}
      </label>
      <label className="flex items-start gap-3">
        <input type="checkbox" name="hidden" defaultChecked={initial.hidden} className="mt-1 check" />
        <span>
          Sembunyikan nomorku sementara
          <span className="block text-sm text-muted">
            Listingmu tetap tampil, tapi tombol chat nonaktif sampai kamu menyalakannya lagi.
          </span>
        </span>
      </label>

      {state.error && <p role="alert" className="alert-danger">{state.error}</p>}
      {state.ok && <p role="status" className="notice">{state.ok}</p>}

      <button disabled={pending}
        className="btn btn-ink disabled:opacity-60">
        {pending ? "Menyimpan…" : "Simpan"}
      </button>
    </form>
  );
}
