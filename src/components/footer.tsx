import Link from "next/link";
import { Logo } from "./nav";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t-2 border-ink bg-paper">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-2 text-sm text-muted">
            Papan buku kuliah bekas untuk sivitas Universitas Negeri Malang. Jual, hibah, atau
            tukar, lalu ketemuan COD di kampus.
          </p>
        </div>
        <nav aria-label="Tautan kaki" className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm sm:grid-cols-4 md:grid-cols-2">
          <Link href="/panduan-cod" className="btn-link">Panduan COD</Link>
          <Link href="/tentang" className="btn-link">Tentang</Link>
          <Link href="/syarat" className="btn-link">Syarat</Link>
          <Link href="/kebijakan-privasi" className="btn-link">Privasi</Link>
        </nav>
      </div>
    </footer>
  );
}
