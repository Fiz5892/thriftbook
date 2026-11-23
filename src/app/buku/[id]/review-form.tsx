"use client";

import { useActionState } from "react";
import { saveReview, type ReviewState } from "./actions";

/** Bintang 1–5 sebagai radio (bisa dipakai keyboard dan pembaca layar). */
export function ReviewForm({
  listingId, initial,
}: {
  listingId: string;
  initial?: { rating: number; comment: string | null };
}) {
  const [state, action, pending] = useActionState<ReviewState, FormData>(saveReview, {});
  const v = state.values ?? { rating: String(initial?.rating ?? ""), comment: initial?.comment ?? "" };

  return (
    <form action={action} className="card mt-4 flex flex-col gap-3 p-4" noValidate>
      <input type="hidden" name="listingId" value={listingId} />
      <fieldset>
        <legend className="font-semibold">{initial ? "Ubah ulasanmu" : "Beri rating"}</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="option min-h-11 min-w-14 items-center justify-center text-sm font-semibold has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-navy-600">
              <input type="radio" name="rating" value={n} defaultChecked={v.rating === String(n)} className="sr-only" />
              <span aria-hidden="true">{n} ★</span>
              <span className="sr-only">{n} dari 5 bintang</span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="flex flex-col gap-1">
        <span className="font-semibold">Ulasan <span className="font-normal text-muted">(opsional)</span></span>
        <textarea name="comment" rows={3} maxLength={500} defaultValue={v.comment} className="input"
          placeholder="Bagaimana kondisi buku dan transaksinya?" />
      </label>
      <div aria-live="polite">
        {state.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
        {state.ok && <p role="status" className="text-sm font-semibold">Makasih, ulasanmu tersimpan.</p>}
      </div>
      <button disabled={pending} className="btn btn-yellow self-start disabled:opacity-60">
        {pending ? "Menyimpan…" : initial ? "Simpan perubahan" : "Kirim ulasan"}
      </button>
    </form>
  );
}
