"use client";

import { useActionState } from "react";
import { moderate, type ModerateState } from "./actions";

type Button = { intent: "hide" | "dismiss" | "unhide" | "ban" | "unban"; label: string; danger?: boolean };

/** Satu form per target: alasan wajib + tombol aksi. */
export function ModerateForm({
  kind,
  targetId,
  buttons,
}: {
  kind: "listing" | "request" | "profile";
  targetId: string;
  buttons: Button[];
}) {
  const [state, action, pending] = useActionState<ModerateState, FormData>(moderate, {});
  return (
    <form action={action} className="mt-3 flex flex-col gap-2">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="targetId" value={targetId} />
      <input
        name="reason" required minLength={5} maxLength={300}
        placeholder="Alasan (wajib, minimal 5 karakter)"
        aria-label="Alasan tindakan"
        className="min-h-10 rounded-xl border border-line px-3 text-sm"
      />
      <div className="flex flex-wrap gap-2">
        {buttons.map((b) => (
          <button
            key={b.intent} name="intent" value={b.intent} disabled={pending}
            className={`min-h-10 rounded-full border px-4 text-sm font-semibold disabled:opacity-60 ${
              b.danger ? "border-danger text-danger" : "border-navy-900 text-navy-900"
            }`}
          >
            {b.label}
          </button>
        ))}
      </div>
      {state.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
      {state.ok && <p role="status" className="text-sm text-muted">{state.ok}</p>}
    </form>
  );
}
