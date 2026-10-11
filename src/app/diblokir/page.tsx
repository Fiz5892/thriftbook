import Link from "next/link";

export default function Diblokir() {
  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-12">
      <h1 className="text-2xl font-bold text-navy-900">Akunmu diblokir</h1>
      <p className="mt-3">
        Akunmu diblokir karena melanggar Syarat Penggunaan. Kalau menurutmu ini keliru, hubungi tim
        thriftbook (alamat kontak akan dicantumkan sebelum peluncuran).
      </p>
      <Link href="/syarat" className="mt-6 inline-block min-h-11 rounded-full border border-navy-900 px-6 py-3 font-semibold text-navy-900">
        Baca Syarat
      </Link>
    </main>
  );
}
