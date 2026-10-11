export const metadata = { title: "Syarat Penggunaan — thriftbook." };

export default function Syarat() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <p role="note" className="rounded-xl bg-yellow-400 px-4 py-3 text-sm font-semibold text-navy-900">
        DRAF untuk uji coba. Belum ditinjau pihak hukum atau dosen pengampu (PRD Q-08). Jangan
        diluncurkan ke publik sebelum ditinjau.
      </p>
      <h1 className="mt-6 text-2xl font-bold text-navy-900">Syarat Penggunaan</h1>
      <div className="mt-4 space-y-4">
        <section>
          <h2 className="font-semibold">Siapa yang boleh memakai</h2>
          <p>Mahasiswa, dosen, dan staf Universitas Negeri Malang dengan akun Google kampus yang aktif.</p>
        </section>
        <section>
          <h2 className="font-semibold">thriftbook hanya papan informasi</h2>
          <p>
            Kami mempertemukan pemilik dan pencari buku. Kami bukan pihak dalam transaksi dan tidak
            menjamin barang, harga, atau pembayaran. Transaksi dilakukan langsung antar pengguna, di
            luar thriftbook.
          </p>
        </section>
        <section>
          <h2 className="font-semibold">Yang dilarang</h2>
          <ul className="list-disc pl-5">
            <li>Menjual fotokopi, cetak ulang, atau file digital (PDF/e-book) buku ber-hak cipta.</li>
            <li>Kunci jawaban ujian dan barang selain buku atau modul kuliah.</li>
            <li>Meminta transfer atau DP sebelum buku diserahkan, listing palsu, atau foto curian.</li>
            <li>Memakai nomor WhatsApp milik orang lain, spam, atau mengumpulkan nomor pengguna.</li>
          </ul>
        </section>
        <section>
          <h2 className="font-semibold">Moderasi</h2>
          <p>
            Listing yang dilaporkan bisa disembunyikan dan akun bisa diblokir. Kami tidak menjadi
            mediator ganti rugi. Jika ada kerugian uang, simpan bukti dan laporkan ke kanal
            pengaduan kemahasiswaan atau pihak berwajib.
          </p>
        </section>
      </div>
    </main>
  );
}
