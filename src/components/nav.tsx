"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string; icon: React.ReactNode; match: (p: string) => boolean };

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 2.4, strokeLinecap: "round", strokeLinejoin: "round" } as const;

const ICON = {
  home: <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true"><path {...stroke} d="M3 11 12 4l9 7M5 10v10h5v-6h4v6h5V10" /></svg>,
  search: <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true"><circle {...stroke} cx="11" cy="11" r="7" /><path {...stroke} d="m20 20-4-4" /></svg>,
  plus: <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true"><path {...stroke} d="M12 5v14M5 12h14" /></svg>,
  wanted: <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true"><path {...stroke} d="M4 5h16v11H9l-5 4z" /><path {...stroke} d="M9 10h6" /></svg>,
  user: <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true"><circle {...stroke} cx="12" cy="8" r="4" /><path {...stroke} d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>,
};

const ITEMS: Item[] = [
  { href: "/", label: "Beranda", icon: ICON.home, match: (p) => p === "/" },
  { href: "/cari", label: "Cari", icon: ICON.search, match: (p) => p.startsWith("/cari") || p.startsWith("/buku") },
  { href: "/jual", label: "Jual", icon: ICON.plus, match: (p) => p.startsWith("/jual") },
  { href: "/dicari", label: "Dicari", icon: ICON.wanted, match: (p) => p.startsWith("/dicari") },
  { href: "/akun", label: "Akun", icon: ICON.user, match: (p) => p.startsWith("/akun") || p.startsWith("/admin") },
];

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display text-xl font-extrabold tracking-tight text-ink ${className}`}>
      thriftbook<span className="text-navy-600">.</span>
    </span>
  );
}

/** Header atas. Desktop: navigasi lengkap. Mobile: logo + tombol Masuk untuk tamu. */
export function SiteHeader({ loggedIn }: { loggedIn: boolean }) {
  const path = usePathname() ?? "/";
  const desktopLinks = ITEMS.filter((i) => i.href !== "/jual" && (loggedIn || i.href !== "/akun"));

  return (
    <header className="sticky top-0 z-30 border-b-2 border-ink bg-cream/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" aria-label="thriftbook, ke beranda" className="flex min-h-11 items-center">
          <Logo />
        </Link>

        <nav aria-label="Menu utama" className="hidden items-center gap-1 md:flex">
          {desktopLinks.map((i) => {
            const active = i.match(path);
            return (
              <Link
                key={i.href}
                href={i.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-11 items-center rounded-full px-4 font-semibold transition-colors ${
                  active ? "bg-ink text-white" : "text-ink hover:bg-yellow-400"
                }`}
              >
                {i.label}
              </Link>
            );
          })}
          <Link href="/jual" className="btn btn-yellow ml-2">Jual bukumu</Link>
          {!loggedIn && <Link href="/masuk" className="btn btn-ink ml-1">Masuk</Link>}
        </nav>

        {!loggedIn && (
          <Link href="/masuk" className="btn btn-ink btn-sm md:hidden">Masuk</Link>
        )}
      </div>
    </header>
  );
}

/** Navigasi bawah: hanya untuk layar kecil. */
export function BottomNav() {
  const path = usePathname() ?? "/";
  return (
    <nav aria-label="Menu utama" className="sticky bottom-0 z-30 border-t-2 border-ink bg-paper md:hidden">
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-2 pb-[env(safe-area-inset-bottom)]">
        {ITEMS.map((i) => {
          const active = i.match(path);
          if (i.href === "/jual") {
            return (
              <li key={i.href} className="flex flex-1 justify-center">
                <Link
                  href={i.href}
                  aria-current={active ? "page" : undefined}
                  className="-mt-5 flex size-14 flex-col items-center justify-center rounded-full border-2 border-ink bg-yellow-400 text-ink shadow-[3px_3px_0_var(--ink)]"
                >
                  {i.icon}
                  <span className="sr-only">{i.label}</span>
                </Link>
              </li>
            );
          }
          return (
            <li key={i.href} className="flex flex-1">
              <Link
                href={i.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${
                  active ? "text-navy-900" : "text-muted"
                }`}
              >
                <span className={`grid h-7 w-12 place-items-center rounded-full ${active ? "bg-yellow-400 text-ink" : ""}`}>
                  {i.icon}
                </span>
                {i.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
