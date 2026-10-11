import Link from "next/link";
import { CONDITION_LABEL, type CONDITIONS } from "@/lib/schemas";
import { photoUrl, rupiah, timeAgo } from "@/lib/format";

export type CardListing = {
  id: string;
  title: string;
  price: number | null;
  offer_type: "jual" | "hibah" | "tukar";
  condition: (typeof CONDITIONS)[number];
  semester: number | null;
  status: string;
  created_at: string;
  study_programs: { short_name: string } | null;
  listing_photos: { path_thumb: string; position: number }[];
};

export const CARD_SELECT =
  "id, title, price, offer_type, condition, semester, status, created_at, study_programs(short_name), listing_photos(path_thumb, position)";

/**
 * Urutan informasi (PRD §9.2): foto → judul → harga → prodi · semester → waktu.
 * Tidak ada nomor WA di kartu (SEC-20).
 */
export function BookCard({ b }: { b: CardListing }) {
  const cover = [...b.listing_photos].sort((x, y) => x.position - y.position)[0];
  const meta = [b.study_programs?.short_name, b.semester ? `Sem ${b.semester}` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      href={`/buku/${b.id}`}
      className="flex flex-col overflow-hidden rounded-xl border border-line bg-white"
    >
      <div className="relative aspect-[3/4] bg-surface">
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl(cover.path_thumb)}
            alt={`Foto sampul ${b.title}`}
            loading="lazy"
            className="size-full object-cover"
          />
        )}
        <span className="absolute left-2 top-2 rounded-full bg-yellow-400 px-2 py-0.5 text-xs font-semibold text-navy-900">
          {CONDITION_LABEL[b.condition]}
        </span>
      </div>
      <div className="flex flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold text-ink">{b.title}</h3>
        {b.offer_type === "jual" && b.price !== null ? (
          <p className="font-bold text-navy-900">{rupiah(b.price)}</p>
        ) : (
          <p className="w-fit rounded-full border border-navy-900 px-2 text-xs font-bold text-navy-900">
            {b.offer_type === "hibah" ? "Gratis" : "Tukar"}
          </p>
        )}
        {meta && <p className="text-xs text-muted">{meta}</p>}
        <p className="text-xs text-muted">
          {b.status === "dipesan" ? "Dipesan" : timeAgo(b.created_at)}
        </p>
      </div>
    </Link>
  );
}
