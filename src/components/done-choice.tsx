import { IconCheck } from "./icons";

/**
 * "Selesai" dengan pertanyaan satu ketukan: laku lewat thriftbook? (AC-07.2).
 * Jawabannya disimpan di listings.done_via untuk metrik M-04.
 * Saat terbuka, panel pilihan mengambil satu baris penuh agar tidak mendorong tombol lain.
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
  const choice = "btn btn-outline btn-sm w-full";
  return (
    <details className="group open:w-full">
      <summary
        className={`btn btn-yellow list-none [&::-webkit-details-marker]:hidden ${compact ? "btn-sm" : ""}`}
      >
        <IconCheck className="size-5" />
        {compact ? "Selesai" : "Tandai selesai"}
      </summary>
      <form action={action} className="card mt-3 flex flex-col gap-2 p-3">
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="status" value="selesai" />
        <p className="text-sm font-semibold">Bukunya laku lewat thriftbook?</p>
        <button name="via" value="thriftbook" className={choice}>Ya, lewat thriftbook</button>
        <button name="via" value="lainnya" className={choice}>Lewat jalur lain</button>
        <button name="via" value="tidak_dijawab" className="btn-link justify-center text-sm text-muted">
          Lewati
        </button>
      </form>
    </details>
  );
}
