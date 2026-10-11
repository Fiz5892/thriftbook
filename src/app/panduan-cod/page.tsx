export const metadata = { title: "Panduan COD aman — thriftbook." };

const POLA: { judul: string; isi: string }[] = [
  {
    judul: "Diminta transfer duluan biar “di-keep”",
    isi: "Jangan. Buku boleh ditahan lewat chat, tapi uang hanya berpindah tangan saat kamu sudah memegang dan mengecek bukunya.",
  },
  {
    judul: "Penjual bilang lagi di luar kota, minta transfer plus ongkir",
    isi: "Thriftbook untuk COD di kampus. Kalau penjual tidak bisa ketemu, cari buku lain atau laporkan listingnya.",
  },
  {
    judul: "Foto bukunya kelihatan seperti dari internet",
    isi: "Minta foto tambahan (sampul belakang, halaman isi, atau foto dengan kertas tanggal hari ini). Kalau menolak, laporkan.",
  },
  {
    judul: "Buku yang diserahkan beda dengan yang difoto",
    isi: "Kamu berhak membatalkan di tempat. Tidak ada kewajiban membeli setelah janji ketemu.",
  },
  {
    judul: "Bukti transfer palsu dari pembeli",
    isi: "Kalau kamu penjual, jangan serahkan buku sebelum uang benar-benar masuk atau diterima tunai.",
  },
];

export default function PanduanCod() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <h1 className="text-2xl text-ink font-extrabold">Panduan COD aman</h1>
      <p className="mt-2">
        Transaksi di thriftbook terjadi langsung antar mahasiswa, di luar aplikasi. Kami tidak
        memegang uang dan tidak menjamin barang. Tiga aturan dasarnya:
      </p>
      <ol className="mt-3 list-decimal space-y-1 pl-5">
        <li>Ketemu di area ramai kampus pada jam kuliah.</li>
        <li>Cek bukunya dulu, baru bayar.</li>
        <li>Jangan transfer DP ke siapa pun.</li>
      </ol>

      <h2 className="mt-8 text-lg font-semibold">Pola yang sering terjadi</h2>
      <ul className="mt-3 flex flex-col gap-3">
        {POLA.map((p) => (
          <li key={p.judul} className="card p-4">
            <p className="font-semibold">{p.judul}</p>
            <p className="mt-1 text-sm">{p.isi}</p>
          </li>
        ))}
      </ul>

      <p role="note" className="notice mt-8 text-sm">
        Rekomendasi titik temu di kampus akan ditambahkan setelah tim melakukan survei lokasi.
      </p>
    </main>
  );
}
