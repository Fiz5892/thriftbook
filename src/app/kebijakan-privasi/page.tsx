export const metadata = { title: "Kebijakan Privasi — thriftbook." };

const ROWS: [string, string, string, string][] = [
  ["Email kampus", "Memastikan kamu warga UM, untuk login", "Tidak publik", "Selama akun aktif"],
  ["Nama tampilan, prodi, angkatan", "Ditampilkan di listing", "Publik", "Selama akun aktif"],
  ["Nomor WhatsApp", "Dihubungi pembeli atau pemilik buku", "Hanya dikirim ke pengguna login yang mengetuk tombol chat, maks 30 per hari", "Selama akun aktif"],
  ["Foto buku", "Ditampilkan di listing", "Publik", "Sampai listing dihapus"],
  ["Riwayat membuka kontak", "Batas penyalahgunaan dan investigasi penipuan", "Kamu dan admin", "90 hari"],
];

export default function Privasi() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <p role="note" className="rounded-xl bg-yellow-400 px-4 py-3 text-sm font-semibold text-navy-900">
        DRAF untuk uji coba. Belum ditinjau pihak hukum atau dosen pengampu (PRD Q-08). Jangan
        diluncurkan ke publik sebelum ditinjau.
      </p>
      <h1 className="mt-6 text-2xl font-bold text-navy-900">Kebijakan Privasi</h1>
      <p className="mt-3">
        Berikut data yang kami simpan dan alasannya. Kami tidak menyimpan NIM, foto profil, lokasi,
        atau memakai pelacak pihak ketiga.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line">
              <th className="py-2 pr-3">Data</th><th className="py-2 pr-3">Untuk apa</th>
              <th className="py-2 pr-3">Siapa yang bisa lihat</th><th className="py-2">Disimpan</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r[0]} className="border-b border-line align-top">
                {r.map((c, i) => <td key={i} className="py-2 pr-3">{c}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-6">
        Data disimpan oleh penyedia layanan kami (Supabase, Vercel, Google) yang servernya bisa berada
        di luar Indonesia. Kamu berhak meminta salinan data, memperbaikinya, dan menghapus akunmu.
      </p>
    </main>
  );
}
