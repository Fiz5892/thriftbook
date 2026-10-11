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

// Latar sampul pengganti (saat foto belum ada/termuat), dipilih stabil dari judul
const COVER_BG = ["bg-pink", "bg-mint", "bg-lilac", "bg-orange", "bg-yellow-400"];
function coverBg(title: string) {
  let h = 0;
  for (let i = 0; i < title.length; i++) h = (h * 31 + title.charCodeAt(i)) >>> 0;
  return COVER_BG[h % COVER_BG.length];
}

/**
 * Urutan informasi (PRD §9.2): foto → judul → harga → prodi · semester → waktu.
 * Tidak ada nomor WA di kartu (SEC-20). Seluruh kartu satu target sentuh.
 */
export function BookCard({ b, priority = false }: { b: CardListing; priority?: boolean }) {
  const cover = [...b.listing_photos].sort((x, y) => x.position - y.position)[0];
  const meta = [b.study_programs?.short_name, b.semester ? `Sem ${b.semester}` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link href={`/buku/${b.id}`} className="card group flex h-full flex-col overflow-hidden">
      <div className={`relative aspect-3/4 border-b-2 border-ink ${coverBg(b.title)}`}>
        {/* Sampul pengganti hanya bila memang tidak ada foto. Jika ditaruh di belakang foto,
            judulnya tembus pada foto berlatar transparan. */}
        {!cover && (
          <span aria-hidden="true" className="font-display absolute inset-x-3 bottom-3 line-clamp-4 text-sm font-extrabold text-ink">
            {b.title}
          </span>
        )}
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl(cover.path_thumb)}
            alt={`Foto sampul ${b.title}`}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            className="relative size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        )}
        <span className="badge absolute left-2 top-2">{CONDITION_LABEL[b.condition]}</span>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-ink">{b.title}</h3>
        <div className="mt-auto pt-1">
          {b.offer_type === "jual" && b.price !== null ? (
            <p className="font-display text-base font-extrabold text-ink">{rupiah(b.price)}</p>
          ) : (
            <span className={`badge ${b.offer_type === "hibah" ? "bg-mint" : "bg-lilac"}`}>
              {b.offer_type === "hibah" ? "Gratis" : "Tukar"}
            </span>
          )}
        </div>
        {meta && <p className="text-xs text-muted">{meta}</p>}
        <p className="text-xs text-muted">{b.status === "dipesan" ? "Dipesan" : timeAgo(b.created_at)}</p>
      </div>
    </Link>
  );
}
