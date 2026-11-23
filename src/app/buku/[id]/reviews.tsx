import Link from "next/link";
import { timeAgo } from "@/lib/format";
import { ConfirmButton } from "@/components/confirm-button";
import { IconTrash } from "@/components/icons";
import { ReviewForm } from "./review-form";
import { deleteReview } from "./actions";

export type ReviewRow = {
  id: string; reviewer_id: string; rating: number; comment: string | null; created_at: string;
};

const stars = (n: number) => "★".repeat(n) + "☆".repeat(5 - n);

/**
 * Ulasan dan rating (alur: "Beri ulasan dan rating"). Siapa pun boleh membaca; hanya pembeli
 * sungguhan yang boleh menulis (canReview dari can_review_listing di database).
 */
export function Reviews({
  listingId, reviews, names, userId, canReview, isOwner, hint,
}: {
  listingId: string;
  reviews: ReviewRow[];
  names: Record<string, string>;
  userId: string | null;
  canReview: boolean;
  isOwner: boolean;
  hint: string;
}) {
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const mine = reviews.find((r) => r.reviewer_id === userId);
  const others = reviews.filter((r) => r.id !== mine?.id);

  return (
    <section aria-labelledby="ulasan" className="mt-10 border-t-2 border-ink pt-6">
      <h2 id="ulasan" className="text-xl font-extrabold text-ink">Ulasan</h2>
      {reviews.length > 0 ? (
        <p className="mt-1">
          <span aria-hidden="true" className="text-lg">{stars(Math.round(avg))}</span>{" "}
          <strong>{avg.toFixed(1)}</strong>
          <span className="sr-only"> dari 5 bintang,</span>
          <span className="text-muted"> · {reviews.length} ulasan</span>
        </p>
      ) : (
        <p className="mt-1 text-muted">Belum ada ulasan.</p>
      )}

      {!userId ? (
        <p className="mt-3 text-sm">
          <Link href={`/masuk?next=${encodeURIComponent(`/buku/${listingId}`)}`} className="btn-link">
            Masuk untuk memberi ulasan
          </Link>
        </p>
      ) : userId && !isOwner && (canReview || mine) ? (
        <ReviewForm
          key={mine?.id ?? "baru"} listingId={listingId}
          initial={mine ? { rating: mine.rating, comment: mine.comment } : undefined}
        />
      ) : (
        userId && !isOwner && <p className="mt-3 text-sm text-muted">{hint}</p>
      )}

      <ul className="mt-4 flex flex-col gap-3">
        {[...(mine ? [mine] : []), ...others].map((r) => (
          <li key={r.id} className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm">
                <strong className="text-ink">{names[r.reviewer_id] ?? "Pengguna thriftbook"}</strong>
                {r.reviewer_id === userId ? " (kamu)" : ""}
                <span className="text-muted"> · {timeAgo(r.created_at)}</span>
              </p>
              <p className="shrink-0" aria-label={`${r.rating} dari 5 bintang`}>
                <span aria-hidden="true">{stars(r.rating)}</span>
              </p>
            </div>
            {r.comment && <p className="mt-2 whitespace-pre-wrap">{r.comment}</p>}
            {r.reviewer_id === userId && (
              <form action={deleteReview} className="mt-2">
                <input type="hidden" name="id" value={r.id} />
                <input type="hidden" name="listingId" value={listingId} />
                <ConfirmButton message="Hapus ulasanmu?" className="btn btn-sm btn-outline" label="Hapus ulasan">
                  <IconTrash />
                  Hapus
                </ConfirmButton>
              </form>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
