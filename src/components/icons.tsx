/** Ikon garis 24px (stroke mengikuti currentColor). Dekoratif: label ada di tombol/teks sekitarnya. */
type P = { className?: string };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: "false",
} as const;

export const IconCheck = ({ className = "size-5" }: P) => (
  <svg {...base} className={className}><path d="M5 12.5 10 17.5 19 7" /></svg>
);
export const IconBookmark = ({ className = "size-5" }: P) => (
  <svg {...base} className={className}><path d="M7 4h10v16l-5-4-5 4z" /></svg>
);
export const IconEdit = ({ className = "size-5" }: P) => (
  <svg {...base} className={className}><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16zM13.5 6.5l4 4" /></svg>
);
export const IconTrash = ({ className = "size-5" }: P) => (
  <svg {...base} className={className}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>
);
export const IconShare = ({ className = "size-5" }: P) => (
  <svg {...base} className={className}>
    <circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" />
    <path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4" />
  </svg>
);
export const IconFlag = ({ className = "size-5" }: P) => (
  <svg {...base} className={className}><path d="M5 21V4M5 4h11l-2 4 2 4H5" /></svg>
);
export const IconUndo = ({ className = "size-5" }: P) => (
  <svg {...base} className={className}><path d="M9 7 4 12l5 5M4 12h10a6 6 0 0 1 0 12" transform="translate(0 -4)" /></svg>
);
export const IconRefresh = ({ className = "size-5" }: P) => (
  <svg {...base} className={className}><path d="M20 11a8 8 0 0 0-14.5-4M4 5v4h4M4 13a8 8 0 0 0 14.5 4M20 19v-4h-4" /></svg>
);
export const IconClose = ({ className = "size-5" }: P) => (
  <svg {...base} className={className}><path d="M6 6l12 12M18 6 6 18" /></svg>
);
