/**
 * "Tandai selesai" dengan pertanyaan satu ketukan: laku lewat thriftbook? (AC-07.2).
 * Jawabannya disimpan di listings.done_via untuk metrik M-04.
 */
export function DoneChoice({
  id,
  action,
  compact = false,
}: {
  id: string;
  action: (formData: FormData) => void | Promise<void>;
  compact?: boolean;
}) {
  const choice = "btn btn-outline btn-sm";
  return (
    <details className="group">
      <summary
        className={`btn btn-yellow list-none [&::-webkit-details-marker]:hidden ${compact ? "btn-sm" : ""}`}
      >
        {compact ? "Selesai" : "Tandai selesai"}
      </summary>
      <form action={action} className="card mt-2 flex flex-col gap-2 p-3">
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="status" value="selesai" />
        <p className="text-sm font-semibold">Bukunya laku lewat thriftbook?</p>
        <button name="via" value="thriftbook" className={choice}>Ya, lewat thriftbook</button>
        <button name="via" value="lainnya" className={choice}>Lewat jalur lain</button>
        <button name="via" value="tidak_dijawab" className="min-h-11 text-sm text-muted underline">Lewati</button>
      </form>
    </details>
  );
}
