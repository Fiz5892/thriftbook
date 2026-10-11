/** Elemen dekoratif bergaya coretan tangan. Semua aria-hidden kecuali stiker bertulisan. */

/** Stiker bintang bergerigi (starburst) dengan teks di tengah. */
export function Starburst({
  children,
  className = "",
  color = "var(--yellow-400)",
  points = 14,
}: {
  children: React.ReactNode;
  className?: string;
  color?: string;
  points?: number;
}) {
  const pts: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? 50 : 39;
    const a = (Math.PI * i) / points - Math.PI / 2;
    pts.push(`${(50 + r * Math.cos(a)).toFixed(2)},${(50 + r * Math.sin(a)).toFixed(2)}`);
  }
  return (
    // "relative" hanya jika pemanggil tidak memosisikan sendiri; dua kelas posisi bertabrakan
    <span className={`inline-grid place-items-center ${/\b(absolute|fixed|sticky)\b/.test(className) ? "" : "relative"} ${className}`}>
      <svg viewBox="-4 -4 108 108" className="absolute inset-0 size-full" aria-hidden="true" focusable="false">
        <polygon points={pts.join(" ")} fill={color} stroke="var(--ink)" strokeWidth="3" strokeLinejoin="round" />
      </svg>
      <span className="relative px-3 text-center text-xs font-bold leading-tight text-ink">{children}</span>
    </span>
  );
}

/** Tumpukan tiga buku mendatar, tempat maskot berdiri. */
export function BookStack({ className = "" }: { className?: string }) {
  const book = (y: number, x: number, w: number, fill: string) => (
    <g key={y}>
      <rect x={x} y={y} width={w} height="26" rx="6" fill={fill} stroke="var(--ink)" strokeWidth="3" />
      <rect x={x + 10} y={y} width="12" height="26" fill="var(--ink)" opacity="0.85" />
      <path d={`M${x + w - 4} ${y + 7} h-${Math.round(w * 0.35)} M${x + w - 4} ${y + 14} h-${Math.round(w * 0.45)} M${x + w - 4} ${y + 20} h-${Math.round(w * 0.3)}`}
        stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
    </g>
  );
  return (
    <svg viewBox="0 0 240 92" className={className} aria-hidden="true" focusable="false">
      {book(62, 10, 220, "var(--orange)")}
      {book(34, 26, 190, "var(--mint)")}
      {book(6, 18, 204, "var(--pink)")}
    </svg>
  );
}

/** Coretan spiral/loop seperti di sketsa. */
export function Squiggle({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 60" className={className} aria-hidden="true" focusable="false">
      <path
        d="M4 40 C 30 40, 34 12, 52 14 C 70 16, 58 46, 76 46 C 94 46, 86 14, 104 14 C 122 14, 112 46, 130 46 C 148 46, 140 14, 158 14 C 176 14, 168 44, 214 30"
        fill="none" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round"
      />
      <path d="M200 22 l14 8 l-12 10" fill="none" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Kilau/bintang kecil empat sudut. */
export function Sparkle({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true" focusable="false">
      <path d="M20 2 C 22 14, 26 18, 38 20 C 26 22, 22 26, 20 38 C 18 26, 14 22, 2 20 C 14 18, 18 14, 20 2 Z"
        fill="var(--ink)" />
    </svg>
  );
}

/** Coretan bintang garis (seperti di kartu langkah pada referensi). */
export function Asterisk({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true" focusable="false">
      <path d="M24 4 v40 M6 14 l36 20 M42 14 l-36 20" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
