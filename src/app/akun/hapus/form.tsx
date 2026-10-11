"use client";

import { useActionState } from "react";
import { deleteMyAccount, type DeleteState } from "./actions";

export function DeleteForm() {
  const [state, action, pending] = useActionState<DeleteState, FormData>(deleteMyAccount, {});
  return (
    <form action={action} className="mt-6 flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="font-semibold">Ketik HAPUS untuk konfirmasi</span>
        <input name="confirm" autoComplete="off" className="min-h-11 rounded-xl border border-line px-4 py-2" />
      </label>
      {state.error && <p role="alert" className="rounded-xl border border-danger px-4 py-3 text-danger">{state.error}</p>}
      <button disabled={pending}
        className="min-h-11 rounded-full border border-danger px-6 py-3 font-semibold text-danger disabled:opacity-60">
        {pending ? "Menghapus…" : "Hapus akunku permanen"}
      </button>
    </form>
  );
}
