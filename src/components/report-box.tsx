import { createReport } from "@/app/lapor/actions";
import { REPORT_REASONS, REPORT_LABEL } from "@/lib/schemas";

/** Form laporan tanpa JS: <details> + server action (FR-14). */
export function ReportBox({ kind, targetId }: { kind: "listing" | "request"; targetId: string }) {
  return (
    <details className="mt-8 rounded-xl border border-line p-4 text-sm">
      <summary className="cursor-pointer font-semibold">Laporkan</summary>
      <form action={createReport} className="mt-3 flex flex-col gap-3">
        <input type="hidden" name="kind" value={kind} />
        <input type="hidden" name="targetId" value={targetId} />
        <label className="flex flex-col gap-1">
          <span>Alasan</span>
          <select name="reason" required defaultValue="" className="min-h-11 rounded-xl border border-line px-3">
            <option value="" disabled>Pilih alasan</option>
            {REPORT_REASONS.map((r) => <option key={r} value={r}>{REPORT_LABEL[r]}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span>Catatan <span className="text-muted">(opsional)</span></span>
          <textarea name="note" rows={2} maxLength={500} className="rounded-xl border border-line px-3 py-2" />
        </label>
        <p className="text-muted">Identitasmu tidak ditunjukkan ke yang dilaporkan.</p>
        <button className="min-h-11 rounded-full border border-navy-900 px-5 font-semibold text-navy-900">
          Kirim laporan
        </button>
      </form>
    </details>
  );
}
