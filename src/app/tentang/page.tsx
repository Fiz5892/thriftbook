import Link from "next/link";

export const metadata = { title: "Tentang — thriftbook." };

const CONTACT = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

export default function Tentang() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <h1 className="text-2xl text-ink font-extrabold">Tentang thriftbook.</h1>
      <p className="mt-3">
        Thriftbook adalah papan katalog buku kuliah bekas untuk sivitas Universitas Negeri Malang.
        Pemilik buku memajang bukunya untuk dijual, dihibahkan, atau ditukar. Pencari bisa menyaring
        berdasarkan prodi, mata kuliah, dan kondisi, lalu menghubungi pemiliknya lewat WhatsApp.
      </p>
      <p className="mt-3">
        Proyek ini lahir dari tugas Manajemen Inovasi (Kelompok 10) dengan pendekatan design
        thinking, berangkat dari unggahan menfess UM yang cepat tenggelam dan tidak terstruktur.
      </p>
      <h2 className="mt-6 font-semibold">Kontak</h2>
      <p className="mt-1">
        {CONTACT ? (
          <a href={`mailto:${CONTACT}`} className="underline">{CONTACT}</a>
        ) : (
          "Alamat kontak akan dicantumkan sebelum peluncuran."
        )}
      </p>
      <ul className="mt-6 flex flex-wrap gap-4 text-sm">
        <li><Link href="/panduan-cod" className="underline">Panduan COD</Link></li>
        <li><Link href="/syarat" className="underline">Syarat Penggunaan</Link></li>
        <li><Link href="/kebijakan-privasi" className="underline">Kebijakan Privasi</Link></li>
      </ul>
    </main>
  );
}
