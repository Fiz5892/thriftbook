import Link from "next/link";

export default function Diblokir() {
  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-12">
      <h1 className="text-2xl text-ink font-extrabold">Akunmu diblokir</h1>
      <p className="mt-3">
        Akunmu diblokir karena melanggar Syarat Penggunaan. Kalau menurutmu ini keliru, hubungi tim
        thriftbook (alamat kontak akan dicantumkan sebelum peluncuran).
      </p>
      <Link href="/syarat" className="btn btn-outline mt-6">
        Baca Syarat
      </Link>
    </main>
  );
}
