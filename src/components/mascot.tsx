/**
 * Tibo, maskot thriftbook: buku kuliah bekas yang ramah.
 * SVG murni (tanpa gambar eksternal), garis tinta tebal sesuai sistem desain.
 * Ekspresi:
 *   happy: senyum biasa
 *   wave: melambai (beranda, landing)
 *   search: memegang kaca pembesar (hasil kosong, Dicari)
 *   oops: bingung (404, error)
 *   cheer: kedua tangan naik (sukses)
 */
export type MascotMood = "happy" | "wave" | "search" | "oops" | "cheer";

const INK = "var(--ink)";

export function Mascot({
  mood = "happy",
  className = "",
  title,
  animate = false,
}: {
  mood?: MascotMood;
  className?: string;
  title?: string;
  /** Kedip & lambaian. Animasi elemen di dalam SVG berjalan di main thread, jadi hanya untuk
      maskot utama di halaman, bukan semua. */
  animate?: boolean;
}) {
  const labelled = Boolean(title);
  return (
    <svg
      viewBox="0 0 200 220"
      className={className}
      role={labelled ? "img" : undefined}
      aria-label={title}
      aria-hidden={labelled ? undefined : true}
      focusable="false"
    >
      {/* bayangan */}
      <ellipse cx="100" cy="206" rx="58" ry="8" fill={INK} opacity="0.15" />

      {/* kaki */}
      <path d="M78 178 v18 h-12" fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M122 178 v18 h12" fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />

      {/* tangan kiri */}
      {mood === "cheer" ? (
        <path d="M44 104 C 28 88, 22 70, 26 54" fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" />
      ) : (
        <path d="M44 112 C 30 120, 24 132, 26 146" fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" />
      )}

      {/* halaman (tepi kanan) */}
      <path
        d="M150 44 h10 a10 10 0 0 1 10 10 v116 a10 10 0 0 1 -10 10 h-10 z"
        fill="var(--paper)" stroke={INK} strokeWidth="4" strokeLinejoin="round"
      />
      <path d="M156 62 h10 M156 80 h10 M156 98 h10 M156 116 h10 M156 134 h10 M156 152 h10" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />

      {/* sampul */}
      <rect x="40" y="30" width="116" height="150" rx="16" fill="var(--yellow-400)" stroke={INK} strokeWidth="4" />
      {/* punggung buku */}
      <path d="M40 46 a16 16 0 0 1 16 -16 h10 v150 h-10 a16 16 0 0 1 -16 -16 z" fill="var(--navy-900)" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      <path d="M52 62 h6 M52 148 h6" stroke="var(--yellow-400)" strokeWidth="3" strokeLinecap="round" />

      {/* pita pembatas */}
      <path d="M128 26 v40 l9 -8 l9 8 v-40" fill="var(--mint)" stroke={INK} strokeWidth="4" strokeLinejoin="round" />

      {/* baris judul di sampul (dibuat tipis & rendah agar tidak terbaca sebagai mulut) */}
      <path d="M86 154 h44 M86 164 h26" stroke={INK} strokeWidth="3" strokeLinecap="round" opacity="0.55" />

      {/* pipi */}
      <ellipse cx="84" cy="112" rx="8" ry="5" fill="var(--pink)" />
      <ellipse cx="132" cy="112" rx="8" ry="5" fill="var(--pink)" />

      {/* mata */}
      {mood === "oops" ? (
        <g stroke={INK} strokeWidth="4" strokeLinecap="round">
          <path d="M86 86 l10 10 M96 86 l-10 10" />
          <path d="M120 86 l10 10 M130 86 l-10 10" />
        </g>
      ) : (
        <g>
          <g className={animate ? "mascot-eye" : undefined}>
            <ellipse cx={mood === "search" ? 94 : 91} cy="92" rx="6.5" ry="8" fill={INK} />
            <circle cx={mood === "search" ? 96 : 93} cy="89" r="2.2" fill="#fff" />
          </g>
          <g className={animate ? "mascot-eye" : undefined}>
            <ellipse cx={mood === "search" ? 128 : 125} cy="92" rx="6.5" ry="8" fill={INK} />
            <circle cx={mood === "search" ? 130 : 127} cy="89" r="2.2" fill="#fff" />
          </g>
        </g>
      )}

      {/* mulut */}
      {mood === "oops" ? (
        <path d="M98 122 q10 -8 20 0" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />
      ) : mood === "cheer" || mood === "wave" ? (
        <path d="M96 112 q12 16 24 0 z" fill={INK} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      ) : (
        <path d="M97 114 q11 11 22 0" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />
      )}

      {/* tangan kanan */}
      {mood === "wave" && (
        <g className={animate ? "mascot-wave" : undefined}>
          <path d="M156 100 C 172 90, 180 74, 178 56" fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" />
          <circle cx="178" cy="52" r="6" fill="var(--paper)" stroke={INK} strokeWidth="4" />
        </g>
      )}
      {mood === "cheer" && (
        <path d="M156 104 C 172 88, 178 70, 174 54" fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" />
      )}
      {mood === "search" && (
        <g>
          <path d="M156 118 C 166 116, 172 110, 174 102" fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" />
          <circle cx="180" cy="88" r="13" fill="var(--paper)" stroke={INK} strokeWidth="4" />
          <path d="M174 100 l-6 10" stroke={INK} strokeWidth="6" strokeLinecap="round" />
          <path d="M175 83 a7 7 0 0 1 7 -2" fill="none" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
        </g>
      )}
      {(mood === "happy" || mood === "oops") && (
        <path d="M156 112 C 170 120, 176 132, 174 146" fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" />
      )}

      {/* tanda tanya saat bingung */}
      {mood === "oops" && (
        <path d="M176 30 q0 -12 12 -12 q12 0 12 11 q0 8 -10 12 v6 M190 56 v1" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />
      )}
    </svg>
  );
}
