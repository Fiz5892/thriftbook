import Link from "next/link";

const ITEMS = [
  { href: "/", label: "Beranda" },
  { href: "/cari", label: "Cari" },
  { href: "/jual", label: "Jual", primary: true },
  { href: "/dicari", label: "Dicari" },
  { href: "/akun", label: "Akun" },
];

export function BottomNav() {
  return (
    <nav
      aria-label="Menu utama"
      className="sticky bottom-0 z-10 border-t border-line bg-white"
    >
      <ul className="mx-auto flex max-w-5xl">
        {ITEMS.map((i) => (
          <li key={i.href} className="flex-1">
            <Link
              href={i.href}
              className={`flex min-h-14 items-center justify-center text-sm font-semibold ${
                i.primary ? "m-1 rounded-full bg-yellow-400 text-navy-900" : "text-navy-900"
              }`}
            >
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
