"use client";

import { useActionState } from "react";
import { deleteMyAccount, type DeleteState } from "./actions";

export function DeleteForm() {
  const [state, action, pending] = useActionState<DeleteState, FormData>(deleteMyAccount, {});
  return (
    <form action={action} className="mt-6 flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="font-semibold">Ketik HAPUS untuk konfirmasi</span>
        <input name="confirm" autoComplete="off" className="input" />
      </label>
      {state.error && <p role="alert" className="alert-danger">{state.error}</p>}
      <button disabled={pending}
        className="btn btn-danger disabled:opacity-60">
        {pending ? "Menghapus…" : "Hapus akunku permanen"}
      </button>
    </form>
  );
}
