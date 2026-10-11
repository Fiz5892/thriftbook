# PRD — thriftbook.

> Marketplace buku kuliah bekas (jual · hibah · tukar) untuk sivitas akademika Universitas Negeri Malang.

| | |
|---|---|
| Versi | 0.1 (draf untuk MVP) |
| Tanggal | 11 Oktober 2026 |
| Pemilik dokumen | Kelompok 10 — Manajemen Inovasi |
| Status | Draf, menunggu jawaban pertanyaan terbuka di [§11.3](#113-pertanyaan-terbuka) |
| Sumber | Presentasi "PRESENTASI MANAJEMEN INOVASI D15-1.pdf" (5 slide) + jawaban klarifikasi tim |

**Konvensi ID:** `FR-xx` kebutuhan fungsional · `NFR-xx` non-fungsional · `SEC-xx` keamanan & privasi · `D-xx` keputusan · `A-xx` asumsi · `R-xx` risiko · `Q-xx` pertanyaan terbuka · `M-xx` metrik. Satu ID tidak pernah dipakai ulang; kalau sebuah requirement dibatalkan, tandai *dibatalkan*, jangan dihapus.

**Penanda verifikasi:** angka yang ditandai **⚠️ cek** berasal dari sumber pihak ketiga atau dari ingatan penulis. Angka itu harus dicocokkan dengan halaman resmi penyedia sebelum dipakai untuk mengambil keputusan.

---

## Daftar isi

1. [Ringkasan & tujuan](#1-ringkasan--tujuan)
2. [Persona & user journey](#2-persona--user-journey)
3. [Kebutuhan fungsional](#3-kebutuhan-fungsional)
4. [Model data](#4-model-data)
5. [Struktur halaman, rute & aksi server](#5-struktur-halaman-rute--aksi-server)
6. [Kebutuhan non-fungsional](#6-kebutuhan-non-fungsional)
7. [Keamanan & privasi](#7-keamanan--privasi)
8. [Tech stack](#8-tech-stack)
9. [Prinsip desain](#9-prinsip-desain)
10. [Rencana rilis](#10-rencana-rilis)
11. [Metrik keberhasilan](#11-metrik-keberhasilan)
12. [Risiko, asumsi & pertanyaan terbuka](#12-risiko-asumsi--pertanyaan-terbuka)
13. [Rencana uji coba (tahap Tes)](#13-rencana-uji-coba-tahap-tes)
14. [Ringkasan keputusan (1 halaman)](#14-ringkasan-keputusan-1-halaman)

---

## 1. Ringkasan & tujuan

### 1.1 Masalah

Dari slide Define, ada dua masalah yang sebenarnya saling melengkapi:

1. Mahasiswa kesulitan mendapatkan buku kuliah dengan harga terjangkau.
2. Mahasiswa yang punya buku bekas tidak punya wadah khusus untuk menyalurkannya.

Saat ini kedua pihak bertemu lewat menfess UM di X (`@um_menfess`). Lima unggahan yang dikutip di slide Empathize memperlihatkan polanya:

| Tanggal (dari slide) | Isi | Pola yang terlihat |
|---|---|---|
| 26 Agu | Maba bertanya tempat membeli buku kuliah bekas | Tidak tahu harus mencari di mana |
| 05 Nov 25 | Mencari buku untuk MK "Belajar dan Pembelajaran" | Pencarian berdasarkan **mata kuliah**, dan MK ini lintas prodi |
| 05 Jun | Menjual buku S1 Ekonomi Pembangunan "serba 15k", "komen nanti ak dm" | Penjual menjual banyak buku sekaligus, transaksi lewat DM |
| 14 Sep | Mencari buku MTK (aljabar, geometri elementer, teori bilangan) | Permintaan spesifik per MK |
| 02 Sep 25 | Mencari buku MK Belajar dan Pembelajaran, "info pdf atau dimana gitu?" | Ada permintaan **PDF**, risiko bajakan (lihat SEC-40) |

Tiap unggahan dilihat sekitar 1–2,2 ribu kali (angka view dari tangkapan layar), tetapi balasannya hanya 1–4. Kesimpulan yang aman diambil: kebutuhannya ada, tetapi saluran saat ini tidak mempertemukan kedua pihak secara terstruktur. Kesimpulan yang **belum** didukung data: seberapa besar volume transaksinya. Hal ini perlu diriset (lihat Q-01).

**Pertanyaan desain (dari slide):** bagaimana mempertemukan pemilik dan pencari buku kuliah bekas di satu kampus secara cepat, murah, dan terstruktur?

### 1.2 Hipotesis yang diuji MVP

| ID | Hipotesis | Terbukti jika (diukur di [§11](#11-metrik-keberhasilan)) |
|---|---|---|
| H1 | Pemilik buku mau memposting jika prosesnya < 3 menit dari HP | ≥ 60 listing aktif dalam 4 minggu setelah peluncuran, median waktu posting ≤ 3 menit saat uji coba |
| H2 | Pencari lebih cepat menemukan buku lewat filter prodi/MK daripada lewat menfess | ≥ 80% peserta uji berhasil menemukan buku target ≤ 60 detik |
| H3 | Kontak WhatsApp langsung + COD di kampus cukup untuk menyelesaikan transaksi, tanpa chat atau pembayaran in-app | ≥ 25% listing yang dihubungi berakhir ditandai "selesai" |
| H4 | Fitur "Dicari" membuat pemilik buku menemukan permintaan yang tidak terjawab di menfess | ≥ 15% permintaan ditandai terpenuhi dalam 30 hari |

Angka target di atas adalah **tebakan awal untuk dikalibrasi**, bukan hasil riset. Setelah 2 minggu data pertama masuk, tinjau ulang.

### 1.3 Tujuan MVP

- Seorang mahasiswa UM bisa memposting buku (jual/hibah/tukar) dari HP dalam ≤ 3 menit.
- Seorang pencari bisa menemukan buku berdasarkan judul, mata kuliah, prodi, atau semester, lalu menghubungi pemiliknya via WhatsApp dalam ≤ 4 ketukan dari hasil pencarian.
- Pencari bisa memasang "Dicari" yang bisa dilihat dan dihubungi pemilik buku.
- Konten bermasalah bisa dilaporkan dan diturunkan admin dalam ≤ 24 jam pada hari kuliah.
- Biaya operasional Rp0 per bulan.

### 1.4 Di luar cakupan MVP (eksplisit)

| Tidak dikerjakan | Alasan | Kapan ditinjau ulang |
|---|---|---|
| Chat in-app | WhatsApp sudah dipakai semua orang. Chat sendiri berarti realtime, moderasi pesan, dan notifikasi, terlalu berat untuk 1 developer | Jika laporan penipuan via WA tinggi dan butuh jejak percakapan |
| Pembayaran in-app / escrow | Transaksinya COD di kampus (slide Ideate). Pembayaran butuh badan usaha dan payment gateway | Tidak direncanakan |
| Pengiriman / ongkir | Satu kampus, COD | Tidak direncanakan |
| Rating/ulasan penjual | Tanpa bukti transaksi, rating mudah dimanipulasi. Lebih baik menunggu data "selesai" yang cukup | Setelah ≥ 100 transaksi selesai |
| Notifikasi email/push | Butuh SMTP/domain berbayar dan izin push; lihat D-08. Ikon lonceng di mockup dihapus dari MVP | Fase 2, prioritas pertama: notifikasi "ada listing cocok dengan Dicari-mu" |
| Aplikasi native (Android/iOS) | Web mobile-first + PWA sudah cukup | Tidak direncanakan |
| Multi-kampus | Fokus ke satu kampus agar suplai buku cukup padat | Setelah M-02 tercapai 2 semester berturut-turut |
| Rekomendasi AI, chatbot, gamifikasi, poin/lencana | Tidak menjawab masalah di Define | — |
| Scan ISBN / auto-isi dari katalog buku | Nice-to-have, menambah dependensi API eksternal | Fase 2 (Could) |
| Login untuk alumni (tanpa email UM aktif) | Butuh verifikasi alternatif | Fase 2, lihat Q-04 |
| Domain kustom (mis. thriftbook.id) | Biaya; MVP memakai subdomain gratis hosting | Saat ada sponsor/dana |

---

## 2. Persona & user journey

Persona di bawah adalah **arketipe yang disusun dari pola unggahan menfess di slide**, bukan hasil wawancara. Validasi saat uji coba ([§13](#13-rencana-uji-coba-tahap-tes)).

### 2.1 Persona

**P1 — Pencari: "Raka, maba semester 1"**
- Konteks: baru masuk, belum kenal kakak tingkat, uang saku terbatas. Dosen menyebut judul buku di RPS, tetapi Raka tidak tahu tempat membelinya (pola unggahan 26 Agu).
- Kebutuhan: tahu apakah buku MK tertentu tersedia, berapa harganya, kondisinya, lalu langsung bisa menghubungi pemilik.
- Frustrasi: menfess tenggelam dalam beberapa jam, balasannya sedikit.
- Perangkat: HP Android kelas menengah, kuota terbatas, sering memakai Wi-Fi kampus yang padat.

**P2 — Pemilik: "Sinta, mahasiswa semester 6"**
- Konteks: punya 6–10 buku dari semester lalu yang tidak terpakai. Mau menjual murah atau menghibahkan (pola unggahan 05 Jun "serba 15k").
- Kebutuhan: memposting cepat dan banyak buku sekaligus, tidak diganggu chat spam, gampang menandai buku yang sudah laku.
- Frustrasi: memposting di menfess hanya sekali tayang; DM dari banyak orang menanyakan buku yang sudah laku.

**P3 — Admin/moderator: "Anggota tim thriftbook"**
- Konteks: 1–2 anggota tim di luar developer, mengecek laporan 1× sehari di sela kuliah.
- Kebutuhan: antrean laporan yang jelas, satu klik untuk menyembunyikan listing atau memblokir akun, dan jejak tindakan.

**Pengguna sekunder:** dosen/staf (sivitas akademika, sesuai slide 2) yang ingin menghibahkan buku. Mereka memakai alur P2.

### 2.2 Journey pencari (P1)

```
Lihat link thriftbook di menfess/IG prodi
 → Beranda (tanpa login): banner, cari, chip prodi, "Baru diposting"
 → Ketik "basis data" ATAU ketuk chip prodi "Pend. Informatika"
 → Hasil + filter (semester, kondisi, jual/hibah/tukar, harga maks)
 → Detail buku: foto, kondisi, harga, MK, prodi, catatan penjual, tips COD
 → Ketuk "Chat penjual via WhatsApp"
     ├─ belum login → masuk dengan Google akun UM → onboarding singkat (jika baru) → kembali ke detail
     └─ sudah login → server membuat tautan wa.me + pesan template → WhatsApp terbuka
 → Negosiasi & janjian COD di WA (di luar sistem)
 → (opsional) Tidak ketemu bukunya → pasang "Dicari"
```

Titik gagal yang harus ditangani: hasil pencarian kosong (arahkan ke "Pasang Dicari"), listing sudah "dipesan" atau "selesai" (tombol WA dinonaktifkan), penjual tidak membalas (tampilkan "terakhir aktif" listing, laporkan jika fiktif).

### 2.3 Journey pemilik (P2)

```
Masuk dengan Google UM → onboarding: nama tampilan, prodi, angkatan, nomor WA (sekali saja)
 → Tab "Jual" → ambil/pilih foto (1–3) → isi judul, MK, prodi, semester, kondisi, tipe (jual/hibah/tukar), harga/keinginan tukar, catatan
 → Centang pernyataan "buku fisik asli, bukan fotokopi/cetak ulang"
 → Terbit → muncul di "Baru diposting" + tampil saran "Ada X orang yang mencari buku mirip"
 → Menerima chat WA dari pencari → janjian COD
 → "Akun > Listing saya" → tandai "Dipesan" (tombol WA disembunyikan untuk orang lain) → tandai "Selesai"
 → Saat "Selesai": pertanyaan 1 klik "Laku lewat thriftbook?" (Ya/Tidak/Lewat jalur lain)
```

### 2.4 Journey admin (P3)

```
Masuk (akun dengan role admin) → /admin
 → Antrean laporan (urut: jumlah laporan terbanyak, lalu yang paling lama)
 → Buka laporan: lihat listing/profil, alasan, catatan pelapor
 → Aksi: Tolak laporan | Sembunyikan listing | Sembunyikan + peringatkan | Blokir akun
 → Isi alasan (wajib) → tercatat di moderation_actions
 → (Blokir) seluruh listing pengguna tersembunyi otomatis, sesi dicabut
```

---

## 3. Kebutuhan fungsional

Prioritas: **Must** = MVP tidak rilis tanpanya · **Should** = dikerjakan jika minggu 7 masih ada waktu · **Could** = setelah MVP.

Ringkasan:

| ID | Fitur | Prioritas |
|---|---|---|
| FR-01 | Masuk dengan akun Google UM | Must |
| FR-02 | Onboarding profil | Must |
| FR-03 | Keluar & sesi | Must |
| FR-04 | Posting listing | Must |
| FR-05 | Unggah foto | Must |
| FR-06 | Edit & hapus listing | Must |
| FR-07 | Ubah status listing (dipesan/selesai) | Must |
| FR-08 | Beranda | Must |
| FR-09 | Pencarian & filter | Must |
| FR-10 | Halaman detail listing | Must |
| FR-11 | Kontak WhatsApp | Must |
| FR-12 | Permintaan buku ("Dicari") | Must |
| FR-13 | Saran pencocokan Dicari ↔ listing | Should |
| FR-14 | Laporkan konten/pengguna | Must |
| FR-15 | Panel moderasi | Must |
| FR-16 | Blokir/buka blokir pengguna | Must |
| FR-17 | Halaman Akun & Listing saya | Must |
| FR-18 | Unduh data & hapus akun | Must |
| FR-19 | Kedaluwarsa listing otomatis | Should |
| FR-20 | Halaman kebijakan privasi, syarat, panduan COD | Must |
| FR-21 | Pratinjau tautan saat dibagikan (Open Graph) | Should |
| FR-22 | PWA (bisa dipasang ke layar utama) | Could |
| FR-23 | Pencatatan event untuk metrik | Must |
| FR-24 | Chip "MK terbanyak di prodi ini" | Should |

### FR-01 — Masuk dengan akun Google UM · Must

**User story:** Sebagai mahasiswa/dosen UM, saya ingin masuk memakai akun Google kampus saya agar tidak perlu membuat password baru, dan agar orang lain tahu saya memang warga UM.

Domain yang diizinkan (konfigurasi `ALLOWED_EMAIL_DOMAINS`): `students.um.ac.id`, `um.ac.id`. Lihat D-03 dan Q-03.

- **AC-01.1** Given pengguna belum login, When mengetuk "Masuk dengan Google" lalu memilih akun `nama@students.um.ac.id`, Then pengguna diarahkan kembali ke halaman asal dan sudah dalam keadaan login.
- **AC-01.2** Given pengguna memilih akun `@gmail.com`, When kembali dari Google, Then tidak ada baris baru di `auth.users`, dan pengguna melihat pesan "Pakai akun Google kampus UM (…@students.um.ac.id atau …@um.ac.id), ya."
- **AC-01.3** Given akun `x@evilum.ac.id` atau `x@students.um.ac.id.evil.com`, When login, Then ditolak seperti AC-01.2. Pencocokan domain memakai bagian setelah `@` yang **sama persis** dengan salah satu domain di allowlist, bukan `endsWith`.
- **AC-01.4** Given akun dibuat langsung via API Supabase Auth (melewati UI) dengan email non-UM, When insert ke `auth.users`, Then trigger database menolak insert (lihat SEC-03).
- **AC-01.5** Given akun dengan `banned_at` terisi, When login berhasil di Google, Then pengguna diarahkan ke `/diblokir`, dan semua aksi tulis ditolak.

### FR-02 — Onboarding profil · Must

**User story:** Sebagai pengguna baru, saya ingin mengisi data minimum sekali saja agar bisa memposting dan dihubungi.

Field: nama tampilan (2–40 karakter, default nama depan dari Google), prodi (pilih dari daftar), angkatan (tahun 4 digit, 2015–tahun berjalan; khusus dosen/staf ada pilihan "Dosen/Staf"), nomor WhatsApp (wajib hanya sebelum memposting atau memasang Dicari, tidak wajib untuk sekadar menghubungi).

- **AC-02.1** Given login pertama kali, When halaman apa pun dimuat, Then pengguna diarahkan ke `/onboarding` sampai nama tampilan dan prodi terisi.
- **AC-02.2** Given input WA `0812-3456-7801`, `+62 812 3456 7801`, atau `6281234567801`, When disimpan, Then tersimpan sebagai `6281234567801` (E.164 tanpa `+`).
- **AC-02.3** Given input WA `021555123` atau `0812` atau `abc`, When disimpan, Then ditolak dengan pesan "Nomor WA harus diawali 08 atau 62, 10–13 digit." Validasi di server dengan regex `^628[1-9][0-9]{7,10}$` setelah normalisasi.
- **AC-02.4** Given nomor WA tersimpan, When pengguna mengetuk "Tes nomor ini", Then terbuka `https://wa.me/<nomor>` agar pengguna bisa memastikan nomornya benar.
- **AC-02.5** Given pengguna lain membuka profil publik atau listing, When melihat sumber HTML/JSON halaman, Then nomor WA tidak ada di sana (lihat SEC-20).

### FR-03 — Keluar & sesi · Must

- **AC-03.1** Given pengguna login, When mengetuk "Keluar" di Akun, Then cookie sesi terhapus, refresh token dicabut di server, dan pengguna diarahkan ke beranda.
- **AC-03.2** Given pengguna tidak aktif selama 30 hari, When membuka situs, Then pengguna harus login ulang (konfigurasi inactivity timeout, lihat SEC-07).
- **AC-03.3** Given ada sesi aktif di dua perangkat, When pengguna memilih "Keluar dari semua perangkat", Then kedua sesi berakhir paling lambat saat access token berikutnya kedaluwarsa (≤ 1 jam).

### FR-04 — Posting listing · Must

**User story:** Sebagai pemilik buku, saya ingin memposting buku dengan foto, kondisi, dan cara penyalurannya (jual/hibah/tukar) agar pencari bisa menemukannya.

Field formulir:

| Field | Wajib | Aturan |
|---|---|---|
| Foto | Ya | 1–3, lihat FR-05 |
| Judul buku | Ya | 3–120 karakter |
| Penulis | Tidak | ≤ 80 karakter |
| Mata kuliah | Ya | 2–80 karakter, autocomplete dari MK yang sudah ada (lihat D-06) |
| Prodi | Ya | Default prodi pengguna, bisa diubah |
| Semester | Tidak | 1–8 |
| Kondisi | Ya | Salah satu dari 4 tingkat (lihat D-05) |
| Tipe | Ya | `jual` / `hibah` / `tukar` |
| Harga | Wajib jika `jual` | Bilangan bulat Rp1.000–Rp1.000.000, kelipatan Rp500 |
| Ingin ditukar dengan | Wajib jika `tukar` | 3–200 karakter |
| Catatan | Tidak | ≤ 500 karakter, teks polos |
| Pernyataan keaslian | Ya | Checkbox: "Ini buku fisik asli, bukan fotokopi, cetak ulang, atau file PDF." |

- **AC-04.1** Given pengguna login dengan profil + WA lengkap, When mengisi semua field wajib dan menekan "Terbitkan", Then listing tersimpan dengan `status = 'aktif'`, pengguna diarahkan ke halaman detailnya, dan listing muncul paling atas di "Baru diposting" beranda dalam ≤ 60 detik.
- **AC-04.2** Given tipe `jual` dan harga kosong, When menekan "Terbitkan", Then server menolak dengan pesan pada field harga, dan tidak ada listing yang tersimpan.
- **AC-04.3** Given tipe `hibah`, When diterbitkan, Then `price` tersimpan `NULL` dan kartu menampilkan "Gratis".
- **AC-04.4** Given tipe `tukar`, When diterbitkan, Then kartu menampilkan "Tukar" dan detail menampilkan isi "Ingin ditukar dengan".
- **AC-04.5** Given pengguna yang belum mengisi nomor WA, When membuka `/jual`, Then pengguna diminta mengisi nomor WA lebih dulu (inline, tanpa kehilangan isian form).
- **AC-04.6** Given pengguna sudah membuat 10 listing dalam 24 jam terakhir, When membuat listing ke-11, Then ditolak dengan pesan "Batas 10 listing per hari. Coba lagi besok, ya." (SEC-31).
- **AC-04.7** Given pengguna sudah memiliki 40 listing berstatus aktif/dipesan, When membuat listing baru, Then ditolak dengan pesan untuk menandai listing lama yang sudah laku.
- **AC-04.8** Given checkbox pernyataan keaslian tidak dicentang, When menekan "Terbitkan", Then tombol tetap nonaktif dan server tetap menolak jika request dikirim manual.
- **AC-04.9** Given koneksi putus saat mengirim, When koneksi kembali, Then isian form (kecuali foto) masih ada karena tersimpan sebagai draf di `localStorage`.

### FR-05 — Unggah foto · Must

**User story:** Sebagai pemilik, saya ingin memotret buku langsung dari HP tanpa memikirkan ukuran file.

Strategi lengkapnya ada di D-09 dan SEC-50…SEC-56.

- **AC-05.1** Given foto JPEG 4–8 MB dari kamera HP, When dipilih, Then klien mengecilkannya ke sisi terpanjang ≤ 1280 px dalam format WebP ≤ 300 KB sebelum diunggah, dengan indikator progres.
- **AC-05.2** Given file 12 MB, When dipilih, Then ditolak di klien dengan pesan "Fotonya kebesaran (maks 10 MB). Coba foto ulang atau pilih yang lain."
- **AC-05.3** Given file `.pdf`, `.gif`, `.svg`, atau `.heic` yang tidak bisa didekode browser, When dipilih, Then ditolak dengan pesan "Pakai foto JPG, PNG, atau WebP."
- **AC-05.4** Given request unggah langsung ke server dengan file berekstensi `.jpg` tetapi isinya HTML/skrip, When diproses, Then server menolak (HTTP 415) berdasarkan magic bytes, bukan berdasarkan ekstensi atau `Content-Type`.
- **AC-05.5** Given foto JPEG yang berisi EXIF GPS, When foto hasil unggahan diunduh dari URL publik, Then `exiftool` tidak menemukan tag GPS maupun EXIF lain.
- **AC-05.6** Given foto berhasil diunggah, When URL-nya diperiksa, Then nama file berbentuk `<uuid-v4>.webp`, tanpa nama asli file atau ID pengguna.
- **AC-05.7** Given 1 listing, When pengguna mencoba menambah foto ke-4, Then tombol tambah foto nonaktif dan server menolak foto ke-4.
- **AC-05.8** Given foto pertama, Then foto itu menjadi sampul; pengguna bisa mengubah urutan sebelum terbit.

### FR-06 — Edit & hapus listing · Must

- **AC-06.1** Given pemilik listing, When mengubah harga dan menyimpan, Then harga baru tampil di detail dan kartu, dan `updated_at` berubah.
- **AC-06.2** Given pengguna B, When mengirim request update/hapus ke listing milik A (via UI maupun API Supabase langsung memakai anon key + JWT B), Then ditolak oleh RLS dan data tidak berubah (SEC-12).
- **AC-06.3** Given pemilik menghapus listing, When dikonfirmasi ("Hapus listing ini? Tidak bisa dibatalkan."), Then listing hilang dari publik seketika, dan file fotonya terhapus dari storage dalam ≤ 24 jam (job pembersihan).
- **AC-06.4** Given listing yang disembunyikan admin, When pemilik mencoba mengeditnya, Then pemilik hanya melihat status "Disembunyikan moderator: <alasan>" tanpa tombol edit.

### FR-07 — Ubah status listing · Must

Status: `aktif` → `dipesan` → `selesai`, atau `aktif` → `selesai`. `dipesan` → `aktif` diizinkan (jika batal). `selesai` bersifat final.

- **AC-07.1** Given listing aktif, When pemilik mengetuk "Tandai dipesan", Then tombol WA di detail berubah menjadi teks nonaktif "Sedang dipesan orang lain" dan listing tetap tampil di pencarian dengan label "Dipesan" (bisa disembunyikan lewat filter).
- **AC-07.2** Given listing aktif/dipesan, When pemilik mengetuk "Tandai selesai", Then muncul pertanyaan satu ketukan "Laku/tersalurkan lewat thriftbook?" [Ya] [Lewat jalur lain] [Lewati]; jawaban disimpan di `listings.done_via` dan listing hilang dari pencarian default.
- **AC-07.3** Given listing selesai, When siapa pun membuka URL detailnya, Then halaman tetap tampil dengan label "Sudah tidak tersedia" tanpa tombol WA (agar tautan yang dibagikan di menfess tidak error).
- **AC-07.4** Given listing selesai, When pemilik membuka menu, Then tidak ada opsi kembali ke aktif; yang tersedia adalah "Posting ulang" yang membuat salinan sebagai listing baru.

### FR-08 — Beranda · Must

Mengikuti mockup slide 2: header + logo, banner tagline, kotak cari, "Cari per program studi", "Baru diposting".

- **AC-08.1** Given pengunjung tanpa login, When membuka `/`, Then beranda tampil lengkap (tidak dipaksa login).
- **AC-08.2** Given ada listing aktif, Then "Cari per program studi" menampilkan maksimal 6 prodi dengan listing aktif terbanyak beserta jumlahnya ("4 buku"), plus tautan "Semua prodi".
- **AC-08.3** Given "Baru diposting", Then tampil 10 listing aktif terbaru (urut `created_at` turun) dalam scroll horizontal, plus "Lihat semua" → `/cari?urut=terbaru`.
- **AC-08.4** Given belum ada listing aktif sama sekali, Then bagian prodi dan "Baru diposting" diganti state kosong (lihat §9.4) dengan tombol "Jual bukumu" dan "Pasang Dicari".
- **AC-08.5** Banner menampilkan "jual · hibah · tukar" (bukan "jual · beli · hibah" seperti di mockup; lihat D-11).

### FR-09 — Pencarian & filter · Must

**User story:** Sebagai pencari, saya ingin mencari berdasarkan judul atau mata kuliah, lalu menyaring berdasarkan prodi, semester, kondisi, tipe, dan harga.

Parameter URL (agar hasil bisa dibagikan dan di-bookmark): `q`, `prodi` (slug), `semester` (1–8), `kondisi` (boleh lebih dari satu), `tipe` (`jual`/`hibah`/`tukar`, boleh lebih dari satu), `harga_maks`, `tampilkan_dipesan` (bool), `urut` (`terbaru` | `termurah` | `relevan`), `cursor`.

- **AC-09.1** Given listing berjudul "Basis Data Praktis" dengan MK "Basis Data", When mencari `basis data`, `BASIS`, atau `basisdata`, Then listing itu muncul di 5 hasil teratas. Pencarian tidak peka huruf besar/kecil dan toleran salah ketik ringan, dengan trigram similarity ≥ 0,3.
- **AC-09.2** Given pencarian `belajar pembelajaran`, Then listing dengan MK "Belajar dan Pembelajaran" muncul walaupun judulnya berbeda (pencarian mencakup judul, penulis, dan MK).
- **AC-09.3** Given filter `tipe=hibah`, Then semua hasil berharga "Gratis".
- **AC-09.4** Given filter `harga_maks=30000`, Then tidak ada hasil `jual` dengan harga > 30.000; listing `hibah` tetap muncul, sedangkan `tukar` tidak muncul kecuali tipe `tukar` dipilih.
- **AC-09.5** Given lebih dari 20 hasil, Then halaman memuat 20 item, dan "Muat lagi" memuat 20 berikutnya memakai cursor (bukan offset).
- **AC-09.6** Given listing berstatus `selesai`, disembunyikan admin, atau milik pengguna diblokir, Then tidak pernah muncul di hasil.
- **AC-09.7** Given hasil kosong, Then tampil state kosong dengan tombol "Pasang Dicari untuk '<q>'" yang mengisi form Dicari dengan kata kuncinya.
- **AC-09.8** Given chip prodi di bagian atas (seperti mockup slide 2), When chip diketuk, Then parameter `prodi` berubah tanpa reload penuh, dan URL ikut berubah.
- **AC-09.9** Given 1.000 listing aktif di database, Then waktu respons query pencarian di server ≤ 300 ms (p95).

### FR-10 — Halaman detail listing · Must

Isi, berurutan: galeri foto (swipe), judul, harga/"Gratis"/"Tukar", label kondisi + penjelasannya, MK · prodi · semester, penulis, catatan penjual, "Ingin ditukar dengan" (jika tukar), nama tampilan + prodi + angkatan penjual, "Diposting 3 hari lalu", tombol utama WA, kotak "Tips COD aman" (3 poin, tautan ke `/panduan-cod`), tombol "Laporkan".

- **AC-10.1** Given listing aktif, Then semua elemen di atas tampil dalam urutan yang ditentukan; tombol WA tetap terlihat di bawah layar (sticky) di viewport ≤ 640 px.
- **AC-10.2** Given pengunjung tanpa login, Then detail tampil penuh **kecuali** nomor WA; tombol WA berbunyi "Masuk untuk chat penjual".
- **AC-10.3** Given pemilik membuka listingnya sendiri, Then tombol WA diganti "Edit", "Tandai dipesan", "Tandai selesai".
- **AC-10.4** Given ID listing tidak ada, Then tampil halaman 404 dengan copy dari §9.4 dan status HTTP 404.
- **AC-10.5** Given listing disembunyikan admin, Then pengunjung selain pemilik dan admin mendapat 404 (bukan 403, agar keberadaannya tidak bocor).

### FR-11 — Kontak WhatsApp · Must

**User story:** Sebagai pencari, saya ingin langsung chat penjual di WhatsApp dengan pesan yang sudah terisi, agar tidak perlu mengetik ulang judul bukunya.

Desain mengikuti SEC-20…SEC-25. Nomor **tidak** dirender di kartu atau detail (berbeda dari mockup; lihat D-04).

- **AC-11.1** Given pengguna login dan listing aktif, When mengetuk tombol WA, Then klien memanggil `POST /api/listings/{id}/contact`, server membalas `{ url: "https://wa.me/62812...?text=..." }`, dan browser membuka URL itu.
- **AC-11.2** Given pesan template, Then isinya: `Halo, aku lihat "<judul>" di thriftbook (<url listing>). Masih ada?` dengan judul yang di-URL-encode.
- **AC-11.3** Given pengguna tanpa login, When endpoint dipanggil, Then server membalas 401 dan tidak ada nomor dalam respons.
- **AC-11.4** Given satu pengguna sudah membuka 30 kontak berbeda dalam 24 jam, When membuka kontak ke-31, Then server membalas 429 dengan pesan "Kamu sudah menghubungi 30 penjual hari ini. Lanjut besok, ya." Membuka ulang kontak yang sama dalam 24 jam tidak dihitung.
- **AC-11.5** Given lebih dari 5 request dalam 60 detik dari satu pengguna, Then server membalas 429.
- **AC-11.6** Given listing berstatus dipesan/selesai, atau pemiliknya diblokir, Then server membalas 409/404 tanpa nomor.
- **AC-11.7** Given setiap pembukaan kontak yang berhasil, Then satu baris tercatat di `contact_reveals` (viewer_id, listing_id, waktu), dan baris berumur > 90 hari dihapus otomatis.
- **AC-11.8** Given pengguna mencoba menghubungi listingnya sendiri, Then tombol tidak tampil, dan server membalas 400 jika dipanggil manual.

### FR-12 — Permintaan buku ("Dicari") · Must

**User story:** Sebagai pencari yang tidak menemukan bukunya, saya ingin memasang "Dicari" agar pemilik buku yang menemukannya bisa menghubungi saya.

Field: judul atau topik (3–120), MK (wajib), prodi, semester (opsional), tipe yang diterima (beli/hibah/tukar, minimal satu), anggaran maksimal (opsional), catatan (≤ 300). Masa aktif 30 hari, dan bisa diperpanjang sekali per 30 hari.

- **AC-12.1** Given pengguna login dengan WA terisi, When mengirim form valid, Then Dicari tampil di `/dicari` (urut terbaru) dengan status `terbuka`.
- **AC-12.2** Given pengguna punya 5 Dicari berstatus terbuka, When membuat yang ke-6, Then ditolak.
- **AC-12.3** Given pemilik buku melihat sebuah Dicari, When mengetuk "Aku punya bukunya", Then alurnya sama dengan FR-11 (login wajib, rate limit sama), dan pesan template-nya: `Halo, aku lihat kamu cari "<judul>" di thriftbook. Aku punya, mau lihat?`.
- **AC-12.4** Given pembuat Dicari, When menandai "Sudah dapat", Then status menjadi `terpenuhi`, ia ditanya "Dapat lewat thriftbook?" [Ya] [Jalur lain] [Lewati], dan Dicari hilang dari daftar publik.
- **AC-12.5** Given Dicari sudah berumur 30 hari tanpa diperpanjang, Then status otomatis menjadi `kedaluwarsa` (job harian, FR-19).
- **AC-12.6** Given `/dicari`, Then filter `prodi` dan `q` bekerja dengan aturan yang sama dengan FR-09.

### FR-13 — Saran pencocokan Dicari ↔ listing · Should

Pengganti notifikasi selama notifikasi belum ada di MVP.

- **AC-13.1** Given listing baru diterbitkan, When ada Dicari terbuka dengan similarity judul/MK ≥ 0,4, Then halaman sukses posting menampilkan "Ada N orang yang mencari buku mirip" beserta maksimal 3 Dicari yang paling mirip.
- **AC-13.2** Given halaman detail Dicari, Then tampil maksimal 5 listing aktif yang paling mirip, dengan judul bagian "Mungkin ini yang kamu cari".
- **AC-13.3** Given halaman "Akun > Dicari saya", Then setiap Dicari terbuka menampilkan jumlah listing aktif yang cocok, sehingga pembuat bisa memeriksanya tanpa notifikasi.

### FR-14 — Laporkan konten/pengguna · Must

Alasan (pilih satu): `bajakan` (fotokopi/cetak ulang/PDF) · `penipuan` (minta transfer duluan, barang tidak sesuai) · `palsu` (listing fiktif/foto curian) · `nomor_salah` (nomor WA bukan milik penjual) · `spam` · `tidak_pantas` · `lainnya`. Catatan opsional ≤ 500 karakter.

- **AC-14.1** Given pengguna login, When melaporkan listing dengan alasan valid, Then tersimpan di `reports` dengan status `baru`, dan pelapor melihat "Makasih, laporanmu sudah masuk. Tim kami cek maksimal 1×24 jam di hari kuliah."
- **AC-14.2** Given pengguna yang sama melaporkan target yang sama dua kali, Then laporan kedua ditolak dengan pesan "Kamu sudah melaporkan ini" (unique constraint).
- **AC-14.3** Given satu listing mendapat laporan dari 3 pengguna berbeda, Then listing otomatis disembunyikan (`hidden_at` terisi, `hidden_reason = 'auto_3_reports'`) sampai admin meninjau.
- **AC-14.4** Given pengguna melaporkan > 10 kali dalam 24 jam, Then laporan ke-11 ditolak (429).
- **AC-14.5** Given pelapor, Then identitasnya tidak pernah ditampilkan ke pihak yang dilaporkan.

### FR-15 — Panel moderasi · Must

- **AC-15.1** Given pengguna dengan `role = 'admin'`, When membuka `/admin`, Then muncul antrean laporan berstatus `baru`, dikelompokkan per target, dan diurutkan berdasarkan jumlah laporan (turun) lalu umur laporan tertua.
- **AC-15.2** Given pengguna non-admin, When membuka `/admin` atau memanggil aksi admin, Then respons 404 (halaman) atau 403 (aksi), dan percobaannya dicatat di log.
- **AC-15.3** Given admin memilih aksi "Sembunyikan listing", When mengisi alasan (wajib, ≥ 5 karakter), Then listing tersembunyi, semua laporan terkait berstatus `ditindak`, dan satu baris tercatat di `moderation_actions` (admin_id, aksi, target, alasan, waktu).
- **AC-15.4** Given aksi "Tolak laporan", Then laporan berstatus `ditolak`, listing yang disembunyikan otomatis (AC-14.3) muncul kembali, dan tindakan tercatat.
- **AC-15.5** Given panel admin, Then ada tab "Riwayat tindakan" yang menampilkan 100 tindakan terakhir (read-only; tidak bisa diedit atau dihapus lewat UI maupun RLS).
- **AC-15.6** Given panel admin, Then ada ringkasan angka: listing aktif, listing baru 7 hari, kontak dibuka 7 hari, laporan terbuka (sumber query ada di §11).

### FR-16 — Blokir/buka blokir pengguna · Must

- **AC-16.1** Given admin memblokir pengguna X dengan alasan, Then `profiles.banned_at` terisi, semua listing dan Dicari milik X tersembunyi dari publik, semua refresh token X dicabut (Supabase Admin API `signOut` untuk user), dan tindakan tercatat.
- **AC-16.2** Given X yang diblokir masih memegang access token yang belum kedaluwarsa, When mencoba membuat listing, Then ditolak oleh RLS karena policy memeriksa `banned_at is null`.
- **AC-16.3** Given X diblokir, When X login ulang, Then X diarahkan ke `/diblokir` yang menjelaskan alasan umum dan alamat email banding.
- **AC-16.4** Given X mencoba mendaftar ulang dengan email UM yang sama, Then ia tetap terblokir (blokir melekat pada email, lihat SEC-34).
- **AC-16.5** Given admin membuka blokir, Then `banned_at` dikosongkan, tetapi listing tetap tersembunyi sampai pemiliknya mengaktifkannya ulang satu per satu.

### FR-17 — Halaman Akun & Listing saya · Must

- **AC-17.1** Given pengguna login, When membuka `/akun`, Then tampil profil, tautan edit profil, "Listing saya" (tab: Aktif / Dipesan / Selesai / Disembunyikan), "Dicari saya", tautan kebijakan, "Unduh dataku", "Hapus akun", dan "Keluar".
- **AC-17.2** Given setiap listing di "Listing saya", Then aksi cepat (Dipesan/Selesai/Edit) bisa dilakukan tanpa membuka detail.

### FR-18 — Unduh data & hapus akun · Must

Mendukung hak subjek data menurut UU PDP (lihat SEC-60…SEC-67).

- **AC-18.1** Given pengguna mengetuk "Unduh dataku", Then terunduh file JSON berisi profil, nomor WA, listing, Dicari, laporan yang dibuatnya, dan riwayat kontak yang dibukanya. Data milik pengguna lain (misal identitas penjual yang ia hubungi selain judul listing) tidak ikut.
- **AC-18.2** Given pengguna mengetuk "Hapus akun" dan mengetik `HAPUS` untuk konfirmasi, Then dalam satu transaksi: profil, kontak, listing, Dicari, contact_reveals, dan events miliknya terhapus; laporan yang dibuatnya dianonimkan (`reporter_id = NULL`); baris `auth.users` terhapus; foto masuk antrean hapus dan terhapus dari storage ≤ 24 jam.
- **AC-18.3** Given pengguna yang terblokir menghapus akun, Then email-nya tetap tersimpan di `banned_emails` sebagai hash SHA-256 (bukan teks asli) agar tidak bisa mendaftar ulang. Hal ini dijelaskan di kebijakan privasi.

### FR-19 — Kedaluwarsa otomatis · Should

- **AC-19.1** Given listing aktif yang tidak diperbarui 60 hari, Then statusnya menjadi `kedaluwarsa` dan hilang dari pencarian; pemilik melihat banner "Masih ada? Aktifkan lagi" di Akun.
- **AC-19.2** Given pemilik mengetuk "Masih ada", Then status kembali `aktif` dan `bumped_at` diperbarui (tetapi tidak menaikkan posisi di "Baru diposting", agar fitur ini tidak bisa dipakai untuk spam naik ke atas).
- **AC-19.3** Job berjalan harian pukul 03.00 WIB via `pg_cron`.

### FR-20 — Halaman statis · Must

`/kebijakan-privasi`, `/syarat`, `/panduan-cod`, `/tentang`. Isi minimum kebijakan privasi ada di SEC-66.

- **AC-20.1** Given halaman onboarding, Then ada checkbox "Aku setuju dengan Syarat & Kebijakan Privasi" (tautan bisa diklik), dan waktu persetujuan serta versi dokumen tersimpan di `profiles.consented_at` / `consent_version`.
- **AC-20.2** Given footer setiap halaman, Then ada tautan ke keempat halaman di atas dan alamat email kontak tim.

### FR-21 — Pratinjau tautan (Open Graph) · Should

Distribusi awal akan lewat menfess, grup WA angkatan, dan IG prodi, jadi pratinjau tautan yang baik menentukan apakah tautan diklik.

- **AC-21.1** Given URL listing dibagikan di WhatsApp/X, Then pratinjau menampilkan foto sampul, judul, dan "Rp45.000 · Kondisi Baik · Pend. Informatika".
- **AC-21.2** Given listing selesai/tersembunyi, Then pratinjau memakai gambar default thriftbook tanpa data listing.
- **AC-21.3** Given halaman detail, Then ada tombol "Bagikan" yang memakai Web Share API, dengan fallback "Salin tautan".

### FR-22 — PWA · Could

- **AC-22.1** Given Chrome Android, Then Lighthouse mendeteksi situs sebagai installable (manifest dengan nama, ikon 192/512, `display: standalone`, `theme_color` biru tua).
- **AC-22.2** Service worker hanya meng-cache aset statis dan halaman offline sederhana ("Kamu lagi offline"). Data listing **tidak** di-cache, agar status buku tidak basi.

### FR-23 — Pencatatan event untuk metrik · Must

Event yang dicatat ke tabel `events` (lihat §4): `signup_completed`, `listing_created`, `listing_status_changed`, `contact_revealed`, `request_created`, `request_status_changed`, `search_performed` (hanya `q` yang dinormalisasi + filter + jumlah hasil; tanpa user_id), `report_created`.

- **AC-23.1** Given setiap aksi di atas berhasil, Then satu baris tercatat di `events` dalam transaksi yang sama dengan aksi utamanya, sehingga tidak ada event untuk aksi yang gagal.
- **AC-23.2** Given event `search_performed`, Then kolom `user_id` bernilai NULL.

### FR-24 — Chip "MK terbanyak di prodi ini" · Should

Mockup slide 2 menampilkan "Sering dicari anak Pend. Informatika". Supaya label tidak menyesatkan saat data pencarian masih sedikit, MVP memakai data listing, bukan data pencarian.

- **AC-24.1** Given filter prodi aktif, Then tampil maksimal 6 chip berisi MK dengan listing aktif terbanyak di prodi itu, berlabel "Mata kuliah terbanyak". Label "Sering dicari" baru boleh dipakai jika sudah ada ≥ 200 event `search_performed` untuk prodi tersebut.
- **AC-24.2** Given chip diketuk, Then `q` terisi nama MK tersebut.

---

## 4. Model data

Database: PostgreSQL (Supabase). Semua tabel di schema `public` memakai RLS (lihat SEC-10). Waktu disimpan sebagai `timestamptz` (UTC) dan ditampilkan dalam WIB.

### 4.1 Diagram relasi

```
auth.users 1─1 profiles 1─1 profile_contacts
                 │
                 ├─1─* listings 1─* listing_photos
                 │        └─*─1 study_programs, courses
                 ├─1─* book_requests ─*─1 study_programs, courses
                 ├─1─* contact_reveals (viewer) ─*─1 listings | book_requests
                 ├─1─* reports (reporter) → target: listing | request | profile
                 └─1─* moderation_actions (admin)
banned_emails (hash) · rate_limit_hits · events · storage_deletion_queue
```

### 4.2 Enum

| Enum | Nilai |
|---|---|
| `offer_type` | `jual`, `hibah`, `tukar` |
| `book_condition` | `seperti_baru`, `baik`, `layak`, `banyak_coretan` (definisi di D-05) |
| `listing_status` | `aktif`, `dipesan`, `selesai`, `kedaluwarsa` |
| `request_status` | `terbuka`, `terpenuhi`, `ditutup`, `kedaluwarsa` |
| `report_reason` | `bajakan`, `penipuan`, `palsu`, `nomor_salah`, `spam`, `tidak_pantas`, `lainnya` |
| `report_status` | `baru`, `ditindak`, `ditolak` |
| `user_role` | `user`, `admin` |
| `done_via` | `thriftbook`, `lainnya`, `tidak_dijawab` |

### 4.3 Tabel

**`study_programs`** — data master prodi, diisi tim (seed).

| Field | Tipe | Keterangan |
|---|---|---|
| id | `smallint` PK | |
| slug | `text` UNIQUE | `pend-informatika` |
| name | `text` | "Pendidikan Informatika" |
| short_name | `text` | "Pend. Informatika" (untuk chip) |
| faculty | `text` | "FT" |
| is_active | `bool` default true | |

**`courses`** — mata kuliah, tumbuh dari input pengguna (D-06).

| Field | Tipe | Keterangan |
|---|---|---|
| id | `bigint` identity PK | |
| name | `text` | Bentuk tampilan, misal "Basis Data" |
| name_norm | `text` UNIQUE | lowercase, spasi dirapikan, tanpa tanda baca, untuk dedup |
| created_by | `uuid` FK profiles, null on delete | |
| merged_into | `bigint` FK courses null | Admin bisa menggabungkan duplikat |

**`profiles`** — data publik pengguna.

| Field | Tipe | Keterangan |
|---|---|---|
| id | `uuid` PK, FK `auth.users.id` on delete cascade | |
| display_name | `text` 2–40 | Publik |
| study_program_id | `smallint` FK | Publik |
| cohort_year | `smallint` null | Publik; null = dosen/staf |
| is_staff | `bool` default false | Ditentukan dari domain email, bukan input pengguna |
| role | `user_role` default `user` | Hanya bisa diubah via SQL oleh pemilik proyek |
| banned_at | `timestamptz` null | |
| ban_reason | `text` null | Tidak publik |
| consented_at | `timestamptz` | |
| consent_version | `text` | misal `2026-10-v1` |
| created_at | `timestamptz` default now() | |

> Email **tidak** disalin ke `profiles`; email tetap di `auth.users` yang tidak bisa diakses klien. Prinsip minimisasi: kita tidak menyimpan NIM, foto profil, atau nama lengkap dari Google.

**`profile_contacts`** — data sensitif, dipisah dari `profiles` karena RLS bekerja per baris, bukan per kolom.

| Field | Tipe | Keterangan |
|---|---|---|
| profile_id | `uuid` PK FK profiles on delete cascade | |
| whatsapp_e164 | `text` CHECK `~ '^628[1-9][0-9]{7,10}$'` | |
| updated_at | `timestamptz` | |

**`listings`**

| Field | Tipe | Keterangan |
|---|---|---|
| id | `uuid` PK default `gen_random_uuid()` | UUID agar ID tidak bisa ditebak berurutan |
| owner_id | `uuid` FK profiles on delete cascade | |
| title | `text` 3–120 | |
| author | `text` null ≤ 80 | |
| course_id | `bigint` FK courses | |
| study_program_id | `smallint` FK | |
| semester | `smallint` null CHECK 1–8 | |
| condition | `book_condition` | |
| offer_type | `offer_type` | |
| price | `integer` null | CHECK: `(offer_type='jual') = (price is not null)` dan `price between 1000 and 1000000` |
| swap_wish | `text` null ≤ 200 | CHECK: wajib jika `tukar` |
| notes | `text` null ≤ 500 | |
| status | `listing_status` default `aktif` | |
| done_via | `done_via` null | |
| authenticity_confirmed | `bool` CHECK = true | |
| hidden_at | `timestamptz` null | Diisi admin/auto-hide |
| hidden_reason | `text` null | |
| search_text | `text` GENERATED | `lower(title || ' ' || coalesce(author,'') || ' ' || course_name_snapshot)` |
| course_name_snapshot | `text` | Disalin saat simpan agar generated column tidak butuh join |
| created_at, updated_at, bumped_at | `timestamptz` | |

**`listing_photos`**

| Field | Tipe | Keterangan |
|---|---|---|
| id | `uuid` PK | Sama dengan nama file |
| listing_id | `uuid` FK on delete cascade | |
| position | `smallint` 0–2 | UNIQUE (listing_id, position) |
| path_full | `text` | `listings/<uuid>.webp` |
| path_thumb | `text` | `listings/<uuid>_t.webp` |
| width, height | `smallint` | Untuk mencegah layout shift (NFR-04) |
| bytes_full, bytes_thumb | `integer` | Untuk memantau kuota |

**`book_requests`**

| Field | Tipe | Keterangan |
|---|---|---|
| id | `uuid` PK | |
| requester_id | `uuid` FK profiles cascade | |
| title | `text` 3–120 | |
| course_id | `bigint` FK | |
| study_program_id | `smallint` FK null | |
| semester | `smallint` null | |
| accepts | `offer_type[]` CHECK cardinality ≥ 1 | Dipetakan: `jual` = mau beli |
| max_budget | `integer` null | |
| notes | `text` null ≤ 300 | |
| status | `request_status` default `terbuka` | |
| fulfilled_via | `done_via` null | |
| expires_at | `timestamptz` | default now() + 30 hari |
| hidden_at, hidden_reason | | sama dengan listings |
| search_text | `text` generated | |
| created_at, updated_at | | |

**`contact_reveals`**

| Field | Tipe | Keterangan |
|---|---|---|
| id | `bigint` identity PK | |
| viewer_id | `uuid` FK profiles cascade | |
| listing_id | `uuid` null FK cascade | Salah satu dari dua kolom ini wajib terisi (CHECK) |
| request_id | `uuid` null FK cascade | |
| created_at | `timestamptz` | Dihapus > 90 hari (pg_cron) |

**`reports`**

| Field | Tipe | Keterangan |
|---|---|---|
| id | `bigint` identity PK | |
| reporter_id | `uuid` null FK profiles **set null** | Dianonimkan saat akun pelapor dihapus |
| target_listing_id / target_request_id / target_profile_id | `uuid` null | Tepat satu terisi (CHECK) |
| reason | `report_reason` | |
| note | `text` null ≤ 500 | |
| status | `report_status` default `baru` | |
| created_at, resolved_at | | |
| | | UNIQUE (reporter_id, target_listing_id, target_request_id, target_profile_id) |

**`moderation_actions`** — append-only.

| Field | Tipe | Keterangan |
|---|---|---|
| id | `bigint` identity PK | |
| admin_id | `uuid` FK profiles set null | |
| action | `text` | `hide_listing`, `unhide_listing`, `hide_request`, `ban_user`, `unban_user`, `dismiss_report`, `merge_course` |
| target_id | `uuid`/`text` | |
| reason | `text` ≥ 5 | |
| created_at | `timestamptz` | |

**`banned_emails`** — `email_sha256 text PK`, `created_at`. Hash dihitung dari email lowercase + pepper dari secret server (SEC-34).

**`rate_limit_hits`** — `key text` (misal `contact:<uid>`), `hit_at timestamptz`; indeks (key, hit_at). Dibersihkan setiap jam.

**`events`** — `id bigint`, `name text`, `user_id uuid null` (FK cascade), `props jsonb` (tanpa PII), `created_at`. Dibersihkan > 400 hari.

**`storage_deletion_queue`** — `path text`, `enqueued_at`. Diproses oleh job harian.

### 4.4 Indeks penting

| Indeks | Untuk |
|---|---|
| `CREATE EXTENSION pg_trgm;` lalu `GIN (search_text gin_trgm_ops)` di `listings` dan `book_requests` | FR-09 pencarian fuzzy + FR-13 kemiripan |
| `listings (status, created_at DESC) WHERE hidden_at IS NULL` (partial) | Beranda "Baru diposting", urut terbaru |
| `listings (study_program_id, status, created_at DESC) WHERE hidden_at IS NULL` | Filter prodi + hitung per prodi |
| `listings (status, price) WHERE offer_type = 'jual' AND hidden_at IS NULL` | Urut termurah / harga maks |
| `listings (owner_id, status)` | Listing saya, batas 40 listing aktif |
| `listings (course_id)` | FR-24 MK terbanyak |
| `book_requests (status, created_at DESC)` | Daftar Dicari |
| `courses USING GIN (name_norm gin_trgm_ops)` | Autocomplete MK |
| `contact_reveals (viewer_id, created_at)` | Rate limit 30/hari |
| `reports (status, created_at)` | Antrean admin |
| `rate_limit_hits (key, hit_at)` | Rate limit |
| `events (name, created_at)` | Query metrik |

Catatan: pada skala satu kampus (perkiraan < 10.000 listing), indeks trigram cukup; Postgres full-text search berbasis kamus tidak dipakai di MVP (lihat D-07).

### 4.5 Visibilitas listing (dipakai di RLS dan query)

Sebuah listing **terlihat publik** jika: `hidden_at IS NULL` **dan** `status IN ('aktif','dipesan','selesai')` **dan** pemiliknya `banned_at IS NULL`. Listing selesai tetap bisa dibuka lewat URL (AC-07.3), tetapi disaring dari pencarian oleh query, bukan oleh RLS.

Implementasikan sebagai view `public_listings` dengan `security_invoker = true` agar RLS tabel dasar tetap berlaku.

---

## 5. Struktur halaman, rute & aksi server

### 5.1 Navigasi

Bottom nav 5 item (mockup punya 4: Beranda, Cari, Jual, Akun). **Dicari** ditambahkan karena permintaan buku adalah fitur inti di slide 4, tetapi tidak punya pintu masuk di mockup (D-12). Urutan: Beranda · Cari · **Jual** (tombol tengah, kuning) · Dicari · Akun.

### 5.2 Rute

| Rute | Akses | Render | Isi |
|---|---|---|---|
| `/` | Publik | SSR + revalidate 60 dtk | Beranda (FR-08) |
| `/cari` | Publik | SSR dinamis | Pencarian & filter (FR-09, FR-24) |
| `/buku/[id]` | Publik (kecuali tersembunyi) | SSR | Detail listing (FR-10, FR-21) |
| `/jual` | Login + profil lengkap | Client form + server action | Posting baru (FR-04, FR-05) |
| `/buku/[id]/edit` | Pemilik | SSR + form | FR-06 |
| `/dicari` | Publik | SSR | Daftar Dicari (FR-12) |
| `/dicari/baru` | Login | form | Buat Dicari |
| `/dicari/[id]` | Publik | SSR | Detail Dicari + listing mirip (FR-13) |
| `/masuk` | Publik | — | Tombol Google + penjelasan kenapa harus email UM |
| `/auth/callback` | Publik | Route handler | Tukar kode OAuth → sesi |
| `/onboarding` | Login | form | FR-02, FR-20 |
| `/akun` | Login | SSR | FR-17 |
| `/akun/profil` | Login | form | Edit profil & WA |
| `/akun/data` | Login | — | Unduh data & hapus akun (FR-18) |
| `/diblokir` | Login (banned) | statis | AC-16.3 |
| `/admin`, `/admin/laporan/[id]`, `/admin/pengguna/[id]`, `/admin/riwayat` | Admin | SSR | FR-15, FR-16 |
| `/kebijakan-privasi`, `/syarat`, `/panduan-cod`, `/tentang` | Publik | statis | FR-20 |
| `/sitemap.xml`, `/robots.txt` | Publik | dinamis | NFR-20 |

### 5.3 Aksi server & endpoint

Konvensi: **SA** = Next.js Server Action (form), **RH** = Route Handler (`/api/...`). Semua aksi tulis: validasi skema Zod di server, cek sesi via `supabase.auth.getUser()` (bukan `getSession()`), lalu query memakai klien Supabase dengan JWT pengguna agar RLS berlaku. Klien `service_role` **hanya** dipakai untuk aksi bertanda ★.

| Aksi | Jenis | Auth | Rate limit | Ringkasan |
|---|---|---|---|---|
| `completeOnboarding` | SA | user | 10/jam | Simpan profil, kontak, persetujuan |
| `updateProfile` | SA | user | 20/jam | |
| `createListing` | SA | user, profil+WA | 10/24 jam, maks 40 aktif | FR-04 |
| `uploadListingPhoto` ★ | RH `POST /api/photos` | user | 30/jam | Validasi, re-encode, simpan (SEC-50). Mengembalikan `photo_id` sementara |
| `updateListing` | SA | pemilik (RLS) | 60/jam | |
| `setListingStatus` | SA | pemilik | 60/jam | FR-07 |
| `deleteListing` | SA | pemilik | 30/jam | Enqueue hapus foto |
| `revealListingContact` ★ | RH `POST /api/listings/[id]/contact` | user | 5/menit, 30 unik/24 jam | FR-11. Service role hanya untuk membaca `profile_contacts` milik pemilik listing |
| `revealRequestContact` ★ | RH `POST /api/requests/[id]/contact` | user | sama dengan atas (kuota digabung) | FR-12 |
| `createRequest` / `updateRequest` / `setRequestStatus` | SA | user | 5 terbuka, 10/24 jam | FR-12 |
| `searchListings` | Query di server component | publik | 60/menit per IP (SEC-31) | FR-09 |
| `suggestCourses` | RH `GET /api/courses?q=` | publik | 120/menit per IP | Autocomplete, maks 8 hasil |
| `createReport` | SA | user | 10/24 jam | FR-14 + auto-hide |
| `adminHideTarget` / `adminUnhide` / `adminDismissReport` | SA | admin (RLS + cek role) | — | FR-15 |
| `adminBanUser` ★ / `adminUnbanUser` | SA | admin | — | ★ untuk mencabut sesi via Admin API |
| `exportMyData` | RH `GET /api/me/export` | user | 3/24 jam | FR-18 |
| `deleteMyAccount` ★ | SA | user + konfirmasi | 3/24 jam | ★ untuk menghapus `auth.users` |
| `signOut` / `signOutEverywhere` | SA | user | — | FR-03 |

Job terjadwal (`pg_cron` di database, tanpa server tambahan):

| Job | Jadwal (WIB) | Tugas |
|---|---|---|
| `expire_listings` | 03.00 harian | FR-19 |
| `expire_requests` | 03.05 harian | AC-12.5 |
| `purge_contact_reveals` | 03.10 harian | Hapus > 90 hari |
| `purge_rate_limit_hits` | tiap jam | Hapus > 25 jam |
| `purge_events` | 03.20 Minggu | Hapus > 400 hari |

Penghapusan file storage tidak bisa dilakukan langsung dari `pg_cron` secara andal. Pakai Vercel Cron (1×/hari, ⚠️ cek batas cron di paket Hobby) yang memanggil `POST /api/cron/storage-cleanup` dengan header `Authorization: Bearer $CRON_SECRET`.

---

## 6. Kebutuhan non-fungsional

Profil uji acuan: **Lighthouse mobile** (emulasi Moto G Power, throttling "Slow 4G" bawaan Lighthouse), build produksi, cache kosong.

### 6.1 Performa

| ID | Kebutuhan | Cara uji |
|---|---|---|
| NFR-01 | LCP ≤ 2,5 dtk untuk `/`, `/cari`, `/buku/[id]` | Lighthouse mobile, median dari 3 run |
| NFR-02 | INP ≤ 200 ms, CLS ≤ 0,1 | Lighthouse + Chrome DevTools Performance |
| NFR-03 | JS yang dimuat pertama kali di `/` ≤ 150 KB (gzip) | Output `next build` / bundle analyzer |
| NFR-04 | Total transfer muat pertama `/` ≤ 700 KB, termasuk 6 thumbnail | Panel Network DevTools |
| NFR-05 | Thumbnail kartu ≤ 40 KB (WebP, 400 px sisi terpanjang); foto detail ≤ 300 KB (1280 px) | Dicek otomatis di `uploadListingPhoto`; ditolak jika melebihi setelah re-encode |
| NFR-06 | Skor Lighthouse Performance mobile ≥ 85 | Lighthouse CI di GitHub Actions per PR (gratis untuk repo publik) |
| NFR-07 | Respons server action/route p95 ≤ 500 ms (di luar upload foto) | Log durasi di server |
| NFR-08 | Upload 1 foto (sudah dikompres di klien) ≤ 5 dtk pada koneksi 1 Mbps unggah | Uji manual dengan throttling kustom |

Teknik wajib: font Poppins di-self-host via `next/font` (bobot 400, 600, 700 saja, subset latin, `display: swap`); gambar memakai atribut `width`/`height` + `loading="lazy"` kecuali gambar LCP; tidak ada library UI berat (misal MUI). Ikon diambil dari set SVG yang di-tree-shake (misal `lucide-react`).

### 6.2 Aksesibilitas (target WCAG 2.2 AA)

| ID | Kebutuhan | Cara uji |
|---|---|---|
| NFR-10 | Kontras teks ≥ 4,5:1 (teks besar ≥ 3:1). **Kuning tidak boleh dipakai sebagai warna teks di latar putih**; kuning hanya untuk latar dengan teks biru tua | Cek token warna di §9.1 dengan WebAIM Contrast Checker |
| NFR-11 | Target sentuh ≥ 44×44 px untuk tombol utama, ≥ 24×24 px untuk lainnya | Inspeksi manual |
| NFR-12 | Semua foto listing punya `alt` = judul buku + "foto ke-n"; ikon tanpa teks punya `aria-label` | axe DevTools: 0 pelanggaran serius/kritis |
| NFR-13 | Seluruh alur posting dan menghubungi penjual bisa diselesaikan hanya dengan keyboard; fokus terlihat jelas (outline 2 px) | Uji manual |
| NFR-14 | Status kondisi tidak hanya dibedakan lewat warna (selalu ada teks label) | Inspeksi |
| NFR-15 | Skor Lighthouse Accessibility ≥ 95 | Lighthouse CI |
| NFR-16 | Teks tetap terbaca jika ukuran font sistem diperbesar 200% tanpa scroll horizontal di lebar 320 px | Uji manual di Android |

### 6.3 SEO dasar

| ID | Kebutuhan |
|---|---|
| NFR-20 | `sitemap.xml` berisi beranda, halaman statis, dan semua listing aktif; diperbarui otomatis |
| NFR-21 | Setiap `/buku/[id]` punya `<title>` = "<Judul> — <Rp/Gratis/Tukar> · thriftbook.", meta description ≤ 160 karakter, canonical URL, dan Open Graph (FR-21) |
| NFR-22 | Listing tersembunyi atau kedaluwarsa memakai `noindex`; `/akun`, `/admin`, `/jual`, `/onboarding` di-disallow di `robots.txt` dan memakai `noindex` |
| NFR-23 | Konten listing dirender di server (bisa dibaca tanpa JS) |
| NFR-24 | Skor Lighthouse SEO ≥ 95 |

### 6.4 Keandalan & operasional

| ID | Kebutuhan |
|---|---|
| NFR-30 | Ketersediaan target "best effort" untuk layanan gratis; tidak ada SLA. Uptime dipantau dengan pemantau gratis (misal UptimeRobot paket gratis, ⚠️ cek ketentuan) yang mengecek `/api/health` tiap 5 menit dan mengirim email ke tim |
| NFR-31 | `/api/health` mengecek koneksi DB dengan query ringan, sehingga juga mencegah auto-pause Supabase (lihat R-02) |
| NFR-32 | Setiap error server tampil ke pengguna sebagai pesan ramah + kode referensi pendek (misal `ERR-7F3K`) yang juga muncul di log, tanpa stack trace |
| NFR-33 | Kompatibilitas: Chrome Android 2 versi terakhir, Safari iOS 2 versi terakhir, Samsung Internet terbaru; lebar 320–1440 px |
| NFR-34 | Bahasa UI: Indonesia. Format uang `Rp45.000` (`Intl.NumberFormat('id-ID')`), tanggal relatif ("3 hari lalu"), zona waktu WIB |

### 6.5 Keterpeliharaan (penting karena tim akan lulus)

| ID | Kebutuhan |
|---|---|
| NFR-40 | Semua perubahan skema dalam file migrasi SQL di repo (`supabase/migrations`), termasuk kebijakan RLS; tidak ada perubahan skema yang hanya dibuat lewat dashboard |
| NFR-41 | `README` menjelaskan cara menjalankan lokal dalam ≤ 10 langkah, daftar env var, dan cara mengganti pemilik akun layanan |
| NFR-42 | Akun Supabase, Vercel, Google Cloud (OAuth), dan GitHub dimiliki **akun tim bersama** (Gmail khusus proyek dengan 2FA, kode cadangan disimpan di password manager bersama), bukan email kampus pribadi. Email kampus bisa nonaktif setelah lulus (A-09) |
| NFR-43 | TypeScript `strict`, ESLint, dan test RLS (SEC-12) jalan di CI sebelum merge |

---

## 7. Keamanan & privasi

### 7.1 Threat model ringkas

**Aset**

| Aset | Kenapa berharga |
|---|---|
| A1 Nomor WhatsApp pengguna | Bisa dipakai untuk spam, penipuan, doxing |
| A2 Email kampus (identitas) | Bisa mengungkap nama + NIM (format email kampus sering memuat nama) |
| A3 Integritas listing | Listing palsu bisa dipakai untuk menipu |
| A4 Akun admin | Bisa menyembunyikan/memblokir siapa saja |
| A5 Kunci rahasia (service role key, OAuth secret, CRON_SECRET) | Melewati semua RLS |
| A6 Kuota layanan gratis | Jika habis, layanan mati untuk semua orang |
| A7 Reputasi tim/kampus | Kasus penipuan atau bajakan di platform berdampak ke tim |

**Aktor jahat**

| Aktor | Motif | Kemampuan |
|---|---|---|
| T1 Scraper / spammer | Mengumpulkan nomor mahasiswa untuk dijual atau di-spam (judi online, pinjol, investasi bodong) | Script, banyak request |
| T2 Penipu COD | Uang DP/transfer | Akun UM asli (mungkin akun pinjaman/curian), pandai bersosial |
| T3 Penjual bajakan | Menjual fotokopi/PDF | Akun asli |
| T4 Pengguna iseng/troll | Spam, konten tidak pantas, laporan palsu | Akun asli |
| T5 Penyerang aplikasi | Mengambil alih data | Memanggil API Supabase langsung dengan anon key (yang memang publik) |
| T6 Orang dalam / admin lalai | Kebocoran tak sengaja | Akses dashboard |

**Vektor serangan → mitigasi**

| # | Vektor | Aktor | Aset | Mitigasi (SEC) |
|---|---|---|---|---|
| V1 | Scraping nomor WA dari HTML/JSON halaman | T1 | A1 | SEC-20, SEC-21, SEC-22 |
| V2 | Membuat banyak akun untuk mengakali rate limit | T1, T4 | A1, A6 | SEC-01, SEC-02, SEC-31 |
| V3 | Memanggil REST Supabase langsung untuk mengubah listing orang lain atau membaca `profile_contacts` | T5 | A1, A3 | SEC-10…SEC-16 |
| V4 | Unggah file berbahaya (HTML/SVG berisi skrip, polyglot), atau foto berisi GPS rumah | T5 / tak sengaja | A1, A7 | SEC-50…SEC-56 |
| V5 | XSS lewat judul/catatan listing | T5 | A4 (sesi admin) | SEC-42, SEC-43 |
| V6 | Listing palsu → minta DP/transfer → kabur | T2 | A3, A7 | SEC-30, SEC-32, SEC-33, FR-14 |
| V7 | Listing fotokopi/PDF | T3 | A7 | SEC-40 |
| V8 | Bocornya service role key lewat repo/klien | T6 | A5 | SEC-70…SEC-73 |
| V9 | Spam request ke endpoint mahal (upload, search) | T1 | A6 | SEC-31, NFR-05 |
| V10 | Laporan palsu massal untuk menjatuhkan penjual | T4 | A3 | AC-14.2, AC-14.4, auto-hide hanya dari ≥ 3 pelapor berbeda, admin bisa memulihkan |
| V11 | Pengambilalihan akun admin | T5 | A4 | SEC-05, SEC-17 |

### 7.2 Autentikasi

**Domain email UM.** Penulis tidak menemukan dokumentasi resmi UM soal domain email mahasiswa. Format `@students.um.ac.id` dikonfirmasi dari akun mahasiswa anggota tim, sedangkan dosen/staf memakai `@um.ac.id`. Hasil penelusuran juga menemukan alamat staf di subdomain fakultas (pola `…@<fakultas>.um.ac.id`). **Konfirmasi daftar domain resmi ke UPT TIK UM** (Q-03) sebelum peluncuran.

| ID | Persyaratan |
|---|---|
| SEC-01 | Login **hanya** via Google OAuth (D-02). Setelah callback, akun diterima hanya jika `email_verified = true` dan domain email sama persis dengan salah satu nilai di `ALLOWED_EMAIL_DOMAINS`. Parameter `hd` di URL OAuth hanya untuk kenyamanan UI, **bukan** kontrol keamanan, karena bisa dimanipulasi klien |
| SEC-02 | Pembatasan domain diterapkan berlapis: (a) cek di `/auth/callback`; (b) trigger `BEFORE INSERT OR UPDATE OF email ON auth.users` yang menolak email di luar allowlist. Lapisan (b) menutup jalur pendaftaran langsung via API Auth. Jika Supabase menyediakan "Before User Created" auth hook (⚠️ cek di dokumentasi), boleh dipakai sebagai alternatif (b) |
| SEC-03 | Matikan semua provider lain di dashboard Supabase (email/password, magic link, phone, anonymous sign-in). Matikan perubahan email oleh pengguna |
| SEC-04 | Proteksi akun massal: domain UM membuat setiap akun = satu akun kampus asli. Tambahan: rate limit pendaftaran bawaan Supabase Auth dibiarkan aktif; akun baru (< 24 jam) dibatasi 3 listing dan 10 pembukaan kontak di hari pertama |
| SEC-05 | Akun admin wajib memakai akun Google dengan 2-Step Verification aktif. Role admin hanya bisa diberikan via migrasi SQL/SQL editor oleh pemilik proyek, tidak ada UI untuk menaikkan role |
| SEC-06 | Sesi memakai `@supabase/ssr`: token di cookie `Secure`, `SameSite=Lax`, `Path=/`. Middleware me-refresh sesi di setiap request. Otorisasi di server **selalu** memakai `auth.getUser()` (atau verifikasi JWT via `getClaims()` jika tersedia di versi SDK, ⚠️ cek), tidak pernah `getSession()`, karena data `getSession()` dari cookie bisa dipalsukan |
| SEC-07 | Masa berlaku access token JWT 1 jam (default Supabase); refresh token rotation + reuse detection aktif; inactivity timeout 30 hari, time-box sesi 90 hari (⚠️ cek apakah pengaturan ini tersedia di paket gratis; jika tidak, catat sebagai risiko yang diterima) |
| SEC-08 | `redirectTo` OAuth hanya boleh ke URL yang ada di allowlist Supabase (domain produksi + `localhost`). Parameter `next` di callback divalidasi: hanya path relatif yang diawali `/` dan bukan `//` (mencegah open redirect) |
| SEC-09 | Uji sejak minggu 1: apakah admin Google Workspace UM mengizinkan login ke aplikasi pihak ketiga (R-01). Jika diblokir, fallback = magic link email via SMTP gratis (D-08) |

### 7.3 Otorisasi: Row Level Security per tabel

Prinsip: **RLS aktif di semua tabel `public`, default deny**. Klien hanya memegang anon key + JWT pengguna. Helper SQL:

```sql
create function public.is_active_user() returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.banned_at is null)
$$;
create function public.is_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin' and p.banned_at is null)
$$;
```

| Tabel | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `study_programs` | semua (anon + auth) | — (hanya migrasi) | — | — |
| `courses` | semua | `is_active_user()` dan `created_by = auth.uid()` | admin (merge) | — |
| `profiles` | semua, **lewat view `public_profiles`** yang hanya membuka `id, display_name, study_program_id, cohort_year, is_staff`. Tabel dasar: hanya `id = auth.uid()` atau admin | `id = auth.uid()` | `id = auth.uid()`; kolom `role`, `banned_at`, `ban_reason`, `is_staff` dilindungi trigger (hanya admin/service role yang bisa mengubahnya) | — (lewat `deleteMyAccount` ★) |
| `profile_contacts` | **hanya `profile_id = auth.uid()`**. Tidak ada policy untuk orang lain. Pembukaan kontak dilakukan via route ★ | `profile_id = auth.uid()` | `profile_id = auth.uid()` | `profile_id = auth.uid()` |
| `listings` | (visibilitas §4.5) **atau** `owner_id = auth.uid()` **atau** `is_admin()` | `owner_id = auth.uid() and is_active_user()` | `owner_id = auth.uid() and is_active_user() and hidden_at is null`; kolom `hidden_at`, `hidden_reason`, `owner_id` dilindungi trigger. Admin: `is_admin()` | `owner_id = auth.uid()` atau `is_admin()` |
| `listing_photos` | jika listing induknya terlihat oleh pengguna (subquery ke `listings`) | — (hanya route ★ setelah validasi) | — | pemilik listing induk |
| `book_requests` | `hidden_at is null and status = 'terbuka'` + pemilik requester dibolehkan, atau `requester_id = auth.uid()`, atau admin | `requester_id = auth.uid() and is_active_user()` | pemilik (kolom moderasi dilindungi), admin | pemilik, admin |
| `contact_reveals` | `viewer_id = auth.uid()` (untuk ekspor data) | — (hanya route ★) | — | — |
| `reports` | `is_admin()` saja; pelapor **tidak** bisa membaca ulang laporan (mencegah enumerasi) | `reporter_id = auth.uid() and is_active_user()` | `is_admin()` (kolom `status`, `resolved_at`) | — |
| `moderation_actions` | `is_admin()` | `is_admin() and admin_id = auth.uid()` | **tidak ada** (append-only) | **tidak ada** |
| `banned_emails`, `rate_limit_hits`, `storage_deletion_queue` | tidak ada akses klien (RLS aktif tanpa policy) | — | — | — |
| `events` | `is_admin()` | via fungsi `log_event()` `security definer` yang dipanggil server | — | — |

| ID | Persyaratan |
|---|---|
| SEC-10 | Setiap migrasi yang membuat tabel baru wajib menyertakan `alter table … enable row level security` + policy. CI menjalankan query yang gagal jika ada tabel `public` dengan `relrowsecurity = false` |
| SEC-11 | Kolom yang tidak boleh diubah pengguna (`owner_id`, `role`, `banned_at`, `hidden_at`, `status` listing yang sudah `selesai`) dijaga trigger `BEFORE UPDATE`, karena RLS tidak membatasi per kolom. Alternatif: `REVOKE UPDATE` per kolom dari role `authenticated` |
| SEC-12 | Test RLS otomatis (pgTAP atau script Node yang login sebagai 2 user uji): user B gagal update/delete listing A; user B gagal `select` di `profile_contacts` milik A; anon gagal insert listing; user banned gagal insert; non-admin gagal membaca `reports` |
| SEC-13 | Fungsi `security definer` wajib `set search_path = ''` dan mereferensikan objek dengan nama schema lengkap |
| SEC-14 | Jalankan Supabase Security Advisor (database linter di dashboard) sebelum setiap rilis; temuan level ERROR wajib 0 |
| SEC-15 | Matikan akses GraphQL (`pg_graphql`) jika tidak dipakai, untuk memperkecil permukaan serangan (⚠️ cek cara menonaktifkannya di versi Supabase saat itu) |
| SEC-16 | Bucket storage `listing-photos`: **public read** (foto listing memang publik dan perlu di-cache CDN), **tanpa policy insert/update/delete untuk `authenticated`/`anon`**. Semua tulis lewat route ★ dengan service role |
| SEC-17 | Semua aksi admin dicek dua kali: di server (`is_admin()`) dan oleh RLS. Halaman `/admin` membalas 404 untuk non-admin |

### 7.4 Privasi nomor WhatsApp

**Masalah di mockup:** kartu buku menampilkan nomor WA lengkap (misal "0812-3456-7801") di daftar hasil. Artinya, satu kali scraping halaman `/cari` tanpa login sudah mengumpulkan seluruh nomor penjual. Ini aset paling sensitif di produk ini (A1): mahasiswa adalah target umum spam judi online, pinjol, dan penipuan lowongan.

**Opsi yang dipertimbangkan (D-04):**

| Opsi | Kelebihan | Kekurangan |
|---|---|---|
| a. Nomor tampil di kartu (seperti mockup) | 1 ketukan, paling cepat | Scraping trivial, tidak bisa di-rate-limit, tidak bisa ditarik kembali |
| b. Nomor tampil setelah login | Scraper butuh akun UM | Setelah login, semua nomor tetap ada di HTML → scraping massal dengan 1 akun |
| **c. Tombol WA → server membuat tautan wa.me per permintaan, login wajib, rate limit, dicatat** | Nomor tidak pernah ada di HTML/JSON listing; scraping dibatasi 30 nomor/akun/hari dan terlacak per akun; akun bisa diblokir | +1 langkah login bagi pencari baru; nomor tetap terlihat di WhatsApp setelah chat dibuka (tidak terhindarkan) |
| d. Relay chat / nomor samaran | Nomor tidak pernah terlihat | Butuh WhatsApp Business API (berbayar) atau chat in-app (di luar cakupan) |

**Keputusan: opsi c.**

| ID | Persyaratan |
|---|---|
| SEC-20 | Nomor WA tidak pernah dirender di HTML, RSC payload, JSON API listing, Open Graph, sitemap, maupun ekspor publik. Uji: `curl` halaman `/cari` dan `/buku/[id]` (login maupun tidak), lalu grep pola `62[0-9]{9,}` dan `08[0-9]{8,}` → 0 hasil |
| SEC-21 | Nomor hanya keluar dari `POST /api/.../contact` dalam bentuk URL `wa.me` untuk 1 listing, setelah: sesi valid, pengguna tidak diblokir, profil lengkap, listing terlihat & aktif, dan rate limit lolos (AC-11.4, AC-11.5) |
| SEC-22 | Endpoint kontak memakai `POST` (bukan `GET`) agar tidak ter-prefetch, tidak tersimpan di riwayat, dan tidak ter-cache. Header respons `Cache-Control: no-store` |
| SEC-23 | Pola anomali → otomatis tandai untuk admin: > 20 pembukaan kontak dalam 1 jam, atau > 80% kontak yang dibuka akun dalam 7 hari berasal dari prodi yang berbeda-beda tanpa satu pun Dicari/listing. Ini dikerjakan sebagai query di panel admin, bukan sistem otomatis yang rumit |
| SEC-24 | Penjual bisa memilih "Sembunyikan nomorku sementara" (semua listing tetap tampil, tombol WA nonaktif dengan teks "Penjual sedang tidak menerima chat") |
| SEC-25 | Di onboarding, tampilkan: "Nomormu hanya dikirim ke mahasiswa UM yang login dan mengetuk tombol chat, maksimal 30 orang per hari per akun. Pakai nomor yang memang kamu pakai buat jual-beli." |

### 7.5 Penipuan & penyalahgunaan

**Pola yang perlu diantisipasi** (berdasarkan pola umum marketplace COD, bukan data thriftbook; validasi lewat laporan setelah rilis):

1. Penjual meminta DP/transfer penuh "biar di-keep" lalu menghilang.
2. Penjual mengaku sedang di luar kota dan meminta transfer + ongkir, padahal transaksi seharusnya COD di kampus.
3. Listing memakai foto sampul dari internet, bukan foto buku sendiri.
4. Saat COD, buku yang diserahkan berbeda edisi/kondisi.
5. Pembeli mengirim "bukti transfer" palsu (jika penjual mau menerima transfer).
6. Akun asli yang dipinjam/diretas dipakai menipu.
7. Penawaran bajakan: "PDF-nya ada, 10rb" (permintaan PDF terlihat di menfess 02 Sep 25).

| ID | Persyaratan |
|---|---|
| SEC-30 | Halaman detail selalu menampilkan kotak "Tips COD aman": (1) ketemu di area ramai kampus pada jam kuliah, (2) cek buku dulu, baru bayar, (3) jangan transfer DP ke siapa pun. Halaman `/panduan-cod` menjelaskan pola 1–5 di atas dengan bahasa santai. Contoh lokasi COD dipilih tim setelah survei (Q-06), jangan dikarang |
| SEC-31 | Rate limit (berbasis tabel `rate_limit_hits`, fungsi SQL `check_rate_limit(key, max, window)`): lihat tabel §5.3. Untuk request anonim (search, autocomplete) kunci rate limit memakai IP dari header `x-forwarded-for` yang dipasang platform hosting (ambil nilai pertama yang dipercaya platform, ⚠️ cek header yang benar di Vercel) |
| SEC-32 | Setidaknya 1 foto wajib. Teks bantuan di form: "Foto buku kamu sendiri, ya. Foto dari internet bisa dilaporkan." Laporan alasan `palsu` diprioritaskan di antrean |
| SEC-33 | Template pesan WA tidak memuat kata "transfer"/"DP". Copy di tombol: "Chat penjual" bukan "Beli sekarang", agar tidak memberi kesan ada jaminan transaksi dari thriftbook |
| SEC-34 | Akun diblokir: `banned_at` terisi, sesi dicabut, konten disembunyikan; hash email (SHA-256 + pepper) dimasukkan ke `banned_emails` dan dicek oleh trigger pendaftaran (SEC-02) |
| SEC-35 | SLA moderasi: laporan `penipuan` dan `bajakan` ditinjau ≤ 24 jam pada hari kuliah; lainnya ≤ 72 jam. Admin yang bertugas dijadwalkan bergiliran (nama ditulis di README operasional, bukan di PRD) |
| SEC-36 | Kebijakan eskalasi: jika ada laporan penipuan dengan kerugian uang, admin menyimpan bukti (ID listing, tangkapan layar dari pelapor), memblokir akun, dan memberi tahu pelapor jalur resmi (kanal pengaduan kemahasiswaan UM / laporan polisi). thriftbook tidak menjadi mediator ganti rugi. Cantumkan di `/syarat` |

**Konten terlarang (SEC-40)**

Ini relevan karena ada permintaan PDF di data riset. UU No. 28 Tahun 2014 tentang Hak Cipta melarang penggandaan dan distribusi ciptaan tanpa izin untuk tujuan komersial. Rincian pasal dan batas "penggunaan wajar" untuk pendidikan perlu dicek oleh tim (Q-07); jangan mengutip pasal di `/syarat` sebelum dicek.

| ID | Persyaratan |
|---|---|
| SEC-40 | Dilarang di `/syarat` dan ditegakkan lewat moderasi: fotokopi/cetak ulang buku ber-hak cipta, file digital (PDF/e-book) dalam bentuk apa pun, kunci jawaban ujian, barang selain buku/modul. Form posting memuat pernyataan keaslian (AC-04.8). Kata kunci `pdf`, `ebook`, `e-book`, `fotokopi`, `fotocopy`, `print`, `softfile` di judul/catatan → listing tetap terbit, tetapi otomatis masuk antrean admin dengan label "cek bajakan" (bukan auto-blokir, karena "bukan fotokopi" juga mengandung kata itu) |
| SEC-41 | Diktat/modul buatan dosen: status hukum dan kebijakannya belum jelas (Q-07). Sampai ada keputusan, izinkan diktat yang dibeli resmi dari kampus/dosen dalam bentuk cetak asli |
| SEC-42 | Semua teks pengguna dirender sebagai teks (escaping bawaan React). **Dilarang** memakai `dangerouslySetInnerHTML` untuk konten pengguna; aturan ESLint `react/no-danger` = error |
| SEC-43 | Catatan dan judul tidak mendukung markdown/HTML. URL dalam catatan tidak di-autolink (mencegah phishing link) |

### 7.6 Unggahan file

Alur: klien mengompres → `POST /api/photos` (multipart) → server memvalidasi & me-re-encode → upload ke storage dengan service role → simpan baris `listing_photos` sementara (terikat ke user, kedaluwarsa 1 jam jika tidak dipakai listing).

| ID | Persyaratan |
|---|---|
| SEC-50 | Batas ukuran body request di server: 2 MB (sudah dikompres klien). Klien menolak file asli > 10 MB. Batas body Vercel Functions sekitar 4,5 MB (⚠️ cek), jadi 2 MB berada di bawahnya dengan aman |
| SEC-51 | Validasi tipe berdasarkan **magic bytes** (`file-type` atau `sharp().metadata()`), whitelist: JPEG, PNG, WebP. SVG, GIF, HEIC, dan PDF ditolak. Dimensi minimum 300×300 px, maksimum 8000×8000 px (tolak "decompression bomb") |
| SEC-52 | Server **selalu** me-re-encode dengan `sharp`: `.rotate()` (terapkan orientasi EXIF), resize ke maksimal 1280 px dan 400 px (thumb), output WebP (quality 75 / 70). `sharp` secara default tidak menyalin metadata ke output, sehingga EXIF termasuk GPS terbuang. Jangan panggil `.withMetadata()`. Uji AC-05.5 |
| SEC-53 | Nama file = UUID v4 acak + sufiks `_t` untuk thumb. Path tidak memuat user ID, nama asli, atau timestamp |
| SEC-54 | Bucket: public read, tanpa listing direktori, tanpa write untuk klien (SEC-16). Batasan MIME bucket di Supabase diatur `image/webp` saja sebagai lapisan kedua |
| SEC-55 | File yatim (foto yang diunggah tapi listing tidak pernah diterbitkan dalam 1 jam, atau listing dihapus) masuk `storage_deletion_queue` dan dihapus oleh job harian |
| SEC-56 | Respons gambar dari storage memakai `Content-Type: image/webp` dan `X-Content-Type-Options: nosniff` (⚠️ cek bahwa Supabase Storage mengirim header ini; jika tidak, tetap aman karena kontennya sudah di-re-encode) |

### 7.7 Proteksi aplikasi

| ID | Persyaratan |
|---|---|
| SEC-90 | **Validasi input di server** untuk setiap aksi memakai skema Zod yang sama dengan form (dibagi antar klien/server), ditambah constraint `CHECK` di database sebagai lapisan terakhir. Validasi klien hanya untuk UX |
| SEC-91 | **Injection:** semua query lewat Supabase client/PostgREST atau fungsi SQL berparameter. Tidak ada SQL yang dirangkai dari string. Input `q` pencarian di-escape untuk karakter `%`, `_`, dan `\` sebelum dipakai di `ILIKE` |
| SEC-92 | **CSRF:** Server Actions Next.js membandingkan header `Origin` dengan `Host` (bawaan). Route Handler `POST` memeriksa `Origin` ∈ allowlist secara manual. Cookie `SameSite=Lax` |
| SEC-93 | **Header keamanan** (diset di `middleware.ts` / `next.config`): `Content-Security-Policy` dengan nonce per request (`default-src 'self'; script-src 'self' 'nonce-…' 'strict-dynamic'; img-src 'self' data: https://<project>.supabase.co; connect-src 'self' https://<project>.supabase.co; frame-ancestors 'none'; base-uri 'self'; form-action 'self' https://accounts.google.com https://<project>.supabase.co`), `Strict-Transport-Security: max-age=31536000; includeSubDomains`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(self), geolocation=(), microphone=()`. Target: nilai A di securityheaders.com |
| SEC-94 | **Error handling:** pesan error ke klien tidak memuat stack trace, pesan SQL, atau nama tabel (NFR-32) |
| SEC-95 | **Dependensi:** Dependabot/`npm audit` di CI; dependensi high/critical tidak boleh di-merge tanpa alasan tertulis. Kunci versi via `package-lock.json` |

### 7.8 Secret & environment variable

| ID | Persyaratan |
|---|---|
| SEC-70 | Hanya `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` (atau publishable key, sesuai versi Supabase) yang boleh berawalan `NEXT_PUBLIC_`. `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, `EMAIL_HASH_PEPPER`, dan Google OAuth client secret **hanya** ada di env server Vercel dan Supabase |
| SEC-71 | Modul yang memakai service role diberi `import 'server-only'` agar build gagal jika terimpor ke komponen klien |
| SEC-72 | `.env*` masuk `.gitignore`; `.env.example` berisi nama variabel tanpa nilai. Aktifkan GitHub secret scanning + push protection (gratis untuk repo publik) |
| SEC-73 | Jika secret bocor: rotasi di Supabase/Google/Vercel ≤ 24 jam, redeploy, catat di log insiden. Langkahnya ditulis di README |

### 7.9 Data pribadi & UU PDP (UU No. 27 Tahun 2022)

thriftbook memproses data pribadi, sehingga tim bertindak sebagai **Pengendali Data Pribadi**. UU PDP berlaku penuh setelah masa transisi 2 tahun sejak diundangkan (Oktober 2022). Bagian ini adalah **kebutuhan produk, bukan nasihat hukum**. Mintalah dosen pengampu atau unit hukum kampus meninjau `/kebijakan-privasi` (Q-08).

**Inventaris data (minimisasi)**

| Data | Sumber | Tujuan | Wajib? | Visibilitas | Retensi |
|---|---|---|---|---|---|
| Email kampus | Google OAuth | Verifikasi sivitas UM, login | Ya | Tidak publik | Selama akun aktif |
| Nama dari Google | Google OAuth | Mengisi default nama tampilan | Tidak disimpan | — | Tidak disimpan |
| Nama tampilan | Pengguna | Ditampilkan di listing | Ya | Publik | Selama akun aktif |
| Prodi, angkatan | Pengguna | Konteks kepercayaan + filter | Prodi ya, angkatan opsional | Publik | Selama akun aktif |
| Nomor WhatsApp | Pengguna | Dihubungi pembeli/pemilik | Ya untuk posting | Terbatas (SEC-21) | Selama akun aktif |
| Foto buku | Pengguna | Listing | Ya | Publik | Sampai listing dihapus/30 hari setelah selesai (D-10) |
| Riwayat buka kontak | Sistem | Rate limit, investigasi penipuan | Otomatis | Pemilik data + admin | 90 hari |
| Laporan | Pengguna | Moderasi | — | Admin | 1 tahun, lalu dianonimkan |
| Event metrik | Sistem | Mengukur M-xx | Otomatis | Admin | 400 hari |
| Alamat IP | Platform hosting | Rate limit anonim, keamanan | Otomatis | Tidak disimpan di DB (hanya di log platform) | Sesuai retensi log platform |

Yang **tidak** dikumpulkan: NIM, foto profil, nomor KTP, lokasi, kontak telepon, cookie pelacak pihak ketiga.

| ID | Persyaratan |
|---|---|
| SEC-60 | Dasar pemrosesan: persetujuan eksplisit di onboarding (AC-20.1) untuk pemrosesan inti, plus kepentingan sah untuk keamanan (rate limit, log). Versi dokumen yang disetujui tersimpan |
| SEC-61 | Hak subjek data: akses & salinan (FR-18 unduh data), pembetulan (edit profil), penghapusan (FR-18 hapus akun), penarikan persetujuan (= hapus akun). Permintaan lain lewat email tim, ditanggapi ≤ 3×24 jam kerja |
| SEC-62 | Retensi sesuai tabel di atas, dijalankan oleh job terjadwal (§5.3), bukan manual |
| SEC-63 | Kegagalan pelindungan data (misal kebocoran nomor WA): tim memberi tahu pengguna terdampak, dan jika diwajibkan, lembaga terkait, paling lambat 3×24 jam (⚠️ cek ketentuan pasal kewajiban notifikasi di UU PDP dan aturan turunannya). Langkah-langkahnya ada di runbook insiden README |
| SEC-64 | Lokasi data: catat region proyek Supabase (pilih Singapura `ap-southeast-1` untuk latensi; ⚠️ cek ketersediaan region di paket gratis). Kebijakan privasi menyebut bahwa data disimpan di luar Indonesia oleh penyedia layanan (Supabase, Vercel, Google) |
| SEC-65 | Analitik tanpa cookie (D-13) sehingga tidak perlu banner cookie untuk pelacakan |
| SEC-66 | `/kebijakan-privasi` minimal memuat: identitas & kontak pengendali (tim), data yang dikumpulkan + tujuan + dasar (tabel di atas dalam bahasa awam), siapa yang bisa melihat nomor WA, pihak ketiga pemroses (Supabase, Vercel, Google), lokasi penyimpanan, retensi, hak pengguna + cara memakainya, kebijakan untuk akun yang diblokir (hash email), cara menghubungi tim, tanggal berlaku & riwayat versi |
| SEC-67 | `/syarat` minimal memuat: siapa yang boleh memakai, thriftbook hanya papan informasi (bukan pihak transaksi, tidak menjamin barang/pembayaran), barang terlarang (SEC-40), perilaku terlarang (spam, penipuan, memakai nomor orang lain), tindakan moderasi & banding, batasan tanggung jawab, perubahan syarat |

### 7.10 Pencadangan, pemulihan & logging

| ID | Persyaratan |
|---|---|
| SEC-80 | Paket gratis Supabase tidak menyediakan backup harian yang bisa diunduh (⚠️ cek; Point-in-Time Recovery adalah fitur berbayar). Karena itu: GitHub Actions terjadwal mingguan (Minggu 02.00 WIB) menjalankan `pg_dump` (schema + data, tanpa schema `auth` yang dikelola Supabase, kecuali tim memutuskan lain) → dienkripsi dengan `age` memakai public key tim → disimpan sebagai artifact Actions dengan retensi 30 hari (⚠️ cek batas retensi/ukuran artifact). Private key `age` hanya di password manager tim |
| SEC-81 | Foto tidak dicadangkan di MVP (keputusan sadar, D-10): jika storage hilang, listing tetap ada dan pemilik diminta mengunggah ulang foto. Risiko diterima karena biaya cadangan foto > nilainya di skala ini |
| SEC-82 | Uji restore 1× sebelum peluncuran dan 1× per semester: restore dump ke proyek Supabase kedua (gratis, maksimal 2 proyek aktif, ⚠️ cek), jalankan test RLS, catat durasi. Target RTO ≤ 4 jam, RPO ≤ 7 hari |
| SEC-83 | Logging aplikasi (`console` → log Vercel) memakai format JSON satu baris: `ts, level, route, user_id (UUID saja), action, duration_ms, ref_code`. **Dilarang** mencatat: email, nomor WA, isi `q` beserta user_id, token, cookie, header `Authorization`, isi body request |
| SEC-84 | Event keamanan yang wajib dicatat: login gagal karena domain, akses `/admin` oleh non-admin, rate limit terlampaui, aksi admin (sudah di `moderation_actions`), pembukaan kontak anomali (SEC-23) |
| SEC-85 | Retensi log runtime di Vercel Hobby sangat pendek (⚠️ cek). Event keamanan penting juga ditulis ke tabel `events` dengan `name = 'security.*'` agar bisa dilihat lebih lama |

### 7.11 Pemetaan ke OWASP

Pemetaan memakai **OWASP Top 10:2021** dan **ASVS 4.0.3 Level 1** (nomor bab). OWASP sudah merilis edisi lebih baru (Top 10:2025, ASVS 5.0) dengan penomoran berbeda; jika dosen/penguji meminta edisi baru, sesuaikan nomornya. Isi kontrolnya tetap sama.

| OWASP Top 10:2021 | Persyaratan thriftbook |
|---|---|
| A01 Broken Access Control | SEC-10…SEC-17, SEC-21, AC-06.2, AC-10.5 |
| A02 Cryptographic Failures | HTTPS + HSTS (SEC-93), hash email terblokir dengan pepper (SEC-34), backup terenkripsi (SEC-80) |
| A03 Injection (termasuk XSS) | SEC-91, SEC-42, SEC-43, SEC-93 (CSP) |
| A04 Insecure Design | Threat model §7.1, desain kontak WA (SEC-20…25), rate limit (SEC-31), batas listing (AC-04.6/7) |
| A05 Security Misconfiguration | SEC-03, SEC-14, SEC-15, SEC-16, SEC-54, SEC-93 |
| A06 Vulnerable & Outdated Components | SEC-95 |
| A07 Identification & Authentication Failures | SEC-01…SEC-09 |
| A08 Software & Data Integrity Failures | Lockfile, CI wajib lulus sebelum deploy, migrasi di repo (NFR-40), cron dilindungi `CRON_SECRET` |
| A09 Security Logging & Monitoring Failures | SEC-83…SEC-85, NFR-30 |
| A10 SSRF | Server tidak mengambil URL yang diberikan pengguna (tidak ada fitur "impor dari link"). Pertahankan begitu |

| ASVS 4.0.3 (L1) | Persyaratan thriftbook |
|---|---|
| V1 Arsitektur | Threat model §7.1, pemisahan klien/server (SEC-70, SEC-71) |
| V2 Autentikasi | Didelegasikan ke Google (tanpa password lokal) + SEC-01, SEC-02, SEC-05 |
| V3 Manajemen sesi | SEC-06, SEC-07, FR-03 |
| V4 Kontrol akses | SEC-10…SEC-17 |
| V5 Validasi, sanitasi, encoding | SEC-90, SEC-91, SEC-42, SEC-43 |
| V7 Error & logging | SEC-94, SEC-83, SEC-84 |
| V8 Perlindungan data | SEC-20, SEC-22 (`no-store`), §7.9 |
| V9 Komunikasi | HTTPS wajib, HSTS |
| V10 Kode berbahaya | Review dependensi, tanpa skrip pihak ketiga selain analitik (D-13) |
| V12 File & resource | SEC-50…SEC-56 |
| V13 API | SEC-92 (CSRF), rate limit, `POST` untuk aksi sensitif |
| V14 Konfigurasi | SEC-93, SEC-70…SEC-73, NFR-40 |

---

## 8. Tech stack

### 8.1 Kriteria

Urutan prioritas (dari brief): (1) waktu ke MVP tercepat untuk **1 developer** yang menguasai JavaScript/TypeScript, (2) Rp0 tanpa kartu kredit, (3) mudah dipelihara setelah tim lulus, (4) keamanan bawaan cukup (terutama otorisasi).

### 8.2 Perbandingan

| Komponen | **Opsi A: Next.js + Supabase + Vercel** | Opsi B: Next.js + Firebase | Opsi C: SvelteKit/Next di Cloudflare Workers + D1 + R2 |
|---|---|---|---|
| Frontend | Next.js (App Router), React, Tailwind | Next.js atau React SPA | SvelteKit atau Next.js (via OpenNext) |
| Backend | Server Actions + Route Handlers | Cloud Functions (butuh paket Blaze/kartu kredit, ⚠️ cek) atau tanpa backend | Workers |
| Database | Postgres (Supabase) | Firestore (NoSQL) | D1 (SQLite) |
| Auth | Supabase Auth (Google OAuth) | Firebase Auth (Google) | Tulis sendiri / library (misal better-auth) |
| Otorisasi | RLS Postgres (SQL, bisa diuji) | Security Rules Firestore | Ditulis manual di kode Worker |
| Gambar | Supabase Storage | Cloud Storage for Firebase: bucket baru dilaporkan mensyaratkan paket Blaze (⚠️ cek) | R2 (10 GB gratis, egress gratis) |
| Hosting | Vercel Hobby | Firebase Hosting / Vercel | Cloudflare Workers/Pages |
| Pencarian | `pg_trgm` di Postgres | Firestore tidak mendukung pencarian teks/fuzzy; butuh Algolia/Typesense (layanan tambahan) | FTS5 di SQLite |
| Analitik | Cloudflare Web Analytics atau Vercel Web Analytics + tabel `events` | Google Analytics for Firebase | Cloudflare Web Analytics |
| Kecepatan ke MVP | **Tercepat**: auth, DB, storage, RLS ada di satu dashboard; dokumentasi Next.js+Supabase melimpah | Cepat untuk CRUD, tetapi pencarian & filter kombinasi di Firestore butuh banyak composite index dan tidak bisa fuzzy | Paling lambat: auth & otorisasi harus dibangun sendiri |
| Risiko utama | Auto-pause proyek saat tidak aktif; kuota storage/egress kecil; ketentuan Hobby "non-komersial" | Butuh kartu kredit untuk storage/functions; pencarian lemah; vendor lock-in kuat | Beban keamanan auth ada di tim; D1 masih lebih jarang dipakai mahasiswa |
| Kemudahan diwariskan | SQL + Postgres = pengetahuan umum; skema & RLS di file migrasi | Data model NoSQL + rules sering membingungkan penerus | Kode auth kustom = utang perawatan |

### 8.3 Keputusan: Opsi A (D-01)

**Pilihan:** Next.js (App Router, TypeScript) + Tailwind CSS + Supabase (Postgres, Auth, Storage, `pg_cron`) + Vercel Hobby. Pencarian memakai `pg_trgm`. Analitik memakai Cloudflare Web Analytics (tanpa cookie) + tabel `events`.

**Alasan:**
- Satu developer JS/TS bisa mengerjakan seluruhnya dalam satu bahasa + SQL.
- Otorisasi per baris (RLS) adalah kontrol keamanan terpenting produk ini (V3). Dengan Postgres, kontrol ini bisa diuji otomatis dan didokumentasikan dalam migrasi.
- Filter kombinasi (prodi + semester + kondisi + tipe + harga + teks fuzzy) adalah query SQL biasa.
- Tidak butuh kartu kredit.

**Yang dikorbankan:**
- Kuota storage dan egress Supabase gratis kecil → strategi gambar ketat (D-09) dan rencana migrasi foto ke R2.
- Proyek gratis bisa auto-pause saat sepi (misal libur semester) → health check (NFR-31).
- Ketergantungan pada 2 vendor (Supabase, Vercel). Mitigasi: Next.js bisa dipindah ke Cloudflare via adapter OpenNext; Supabase bisa dipindah karena data ada di Postgres standar (`pg_dump`).
- Vercel Hobby ditujukan untuk penggunaan **pribadi non-komersial**. thriftbook adalah proyek mahasiswa tanpa pendapatan, tetapi pengguna bertransaksi jual-beli di dalamnya. Apakah ini termasuk "komersial" menurut Vercel belum jelas (Q-05). Rencana B: pindah hosting ke Cloudflare Workers.

### 8.4 Batas free tier & rencana jika tercapai

Semua angka di tabel ini **⚠️ wajib dicek** di halaman harga resmi pada minggu 1. Angka diambil dari halaman resmi atau artikel pihak ketiga 2026; beberapa sumber saling bertentangan.

| Layanan | Batas (perkiraan) | Kenapa berisiko untuk thriftbook | Pemantauan | Rencana jika tercapai |
|---|---|---|---|---|
| Supabase — database | 500 MB | Kecil risikonya: 10.000 listing × ~2 KB ≈ 20 MB | Dashboard usage, cek bulanan | Hapus `events` lama lebih cepat |
| Supabase — storage file | 1 GB (ada sumber yang menyebut 500 MB) | **Risiko terbesar.** Perkiraan per listing (rata-rata 2 foto × (≤ 300 KB + ≤ 40 KB)) ≈ 0,7 MB → kapasitas ~1.400 listing di skenario terburuk. Rata-rata nyata seharusnya lebih kecil karena WebP q75 biasanya 120–200 KB, tetapi ini harus diukur | Kolom `bytes_*` di `listing_photos` → angka "storage terpakai" di panel admin; alarm di 70% | (1) Hapus foto full dari listing `selesai` > 30 hari (sisakan thumb), (2) turunkan maksimal 1280 → 1024 px, (3) pindahkan penyimpanan foto ke **Cloudflare R2** (gratis 10 GB-bulan, 1 juta operasi Class A & 10 juta Class B per bulan, egress gratis; sumber: halaman harga resmi Cloudflare). Catatan: R2 mungkin meminta metode pembayaran saat aktivasi (⚠️ cek) |
| Supabase — egress/bandwidth | 5 GB/bulan (ada sumber yang menyebut 2 GB) | Setiap tampilan kartu = thumbnail ≤ 40 KB → 5 GB ≈ 125.000 tampilan thumbnail/bulan. Foto penuh hanya dimuat di detail | Dashboard usage | Cache header panjang (`Cache-Control: public, max-age=31536000, immutable`, aman karena nama file unik); pindah ke R2 (egress gratis) |
| Supabase — MAU auth | 50.000 | Tidak realistis tercapai di satu kampus | — | — |
| Supabase — auto-pause | Proyek gratis di-pause setelah ±7 hari tanpa aktivitas; data tetap ada, tapi harus di-restore manual | Libur semester → situs mati | NFR-30/31: health check 5 menit memicu query DB | Jika tetap ter-pause, restore dari dashboard (≤ beberapa menit). Jangan mengandalkan ping jika melanggar ketentuan Supabase (⚠️ cek fair use) |
| Supabase — jumlah proyek | 2 proyek aktif per organisasi | Butuh proyek staging + produksi = habis | — | Staging memakai Supabase CLI lokal (Docker) |
| Supabase — backup | Tidak ada backup yang bisa diunduh di paket gratis (⚠️ cek) | Kehilangan data | — | SEC-80 |
| Supabase — email bawaan | SMTP bawaan sangat dibatasi dan tidak untuk produksi | Relevan hanya jika fallback magic link dipakai | — | D-08: SMTP gratis pihak ketiga |
| Vercel Hobby — bandwidth | 100 GB/bulan, tidak bisa membeli tambahan (FAQ resmi) | Kecil, karena gambar dilayani dari Supabase, bukan dari Vercel | Dashboard Vercel | Pindah ke Cloudflare |
| Vercel Hobby — fungsi | Sumber bertentangan: 100 ribu–1 juta invocation/bulan; kuota CPU aktif ±4 jam (⚠️ cek) | SSR setiap halaman memakan invocation | Dashboard | Ubah beranda & detail ke ISR (revalidate 60 dtk) agar sebagian besar request dilayani dari cache |
| Vercel Hobby — Image Optimization | Ada kuota transformasi gambar (⚠️ cek) | `next/image` default akan memakai kuota ini | — | **Matikan** (`images.unoptimized = true`); gambar sudah dioptimasi saat upload |
| Vercel Hobby — ketentuan | Non-komersial; jika batas tercapai, deployment di-pause, bukan ditagih | Q-05 | — | Pindah ke Cloudflare Workers + OpenNext |
| Vercel Hobby — kolaborasi | 1 seat. Deploy dari commit kontributor lain di repo privat dilaporkan dibatasi (⚠️ cek) | Tim 4 orang, 1 developer | — | Repo publik (juga memudahkan penerus); hanya developer yang deploy |
| Google OAuth | Untuk scope dasar (`openid email profile`) tidak perlu verifikasi aplikasi Google penuh; layar consent menampilkan nama aplikasi (⚠️ cek kebijakan terbaru) | Kebijakan Workspace UM bisa memblokir aplikasi pihak ketiga | Uji minggu 1 | R-01 |
| Cloudflare Web Analytics | Gratis, tanpa cookie (⚠️ cek batas) | — | — | Tabel `events` tetap jadi sumber kebenaran untuk metrik produk |
| GitHub Actions | Gratis tanpa batas menit untuk repo publik (⚠️ cek) | Lighthouse CI + backup | — | — |

### 8.5 Strategi gambar (D-09)

Foto adalah beban storage dan bandwidth terbesar, jadi ditangani di dua tempat:

1. **Klien** (`browser-image-compression` atau canvas manual di Web Worker): resize sisi terpanjang ≤ 1600 px, encode ke WebP quality 0,8, target ≤ 500 KB. Tujuannya menghemat kuota pengguna saat upload di jaringan seluler. Langkah ini **tidak** dianggap kontrol keamanan, karena klien bisa dilewati.
2. **Server** (`sharp` di route `/api/photos`): validasi (SEC-51), `rotate()`, buat dua varian: `full` 1280 px WebP q75 (≤ 300 KB, tolak jika melebihi setelah q60) dan `thumb` 400 px WebP q70 (≤ 40 KB). Metadata dibuang (SEC-52).
3. **Penyajian:** URL storage publik + `Cache-Control: immutable` 1 tahun. Kartu memakai thumb, dan detail memakai full dengan `srcset` (thumb untuk layar kecil saat scroll galeri, full saat dibuka).
4. **Batas:** maksimal 3 foto per listing; rasio bebas, tetapi di kartu ditampilkan `object-fit: cover` dengan rasio 3:4 (bentuk sampul buku).
5. **Placeholder:** saat thumb belum termuat, tampil blok warna solid yang diturunkan dari hash judul (palet 5 warna dari mockup), dengan judul di dalamnya. Ini mempertahankan gaya mockup slide 2 tanpa memalsukan foto.
6. **Pembersihan:** SEC-55, dan foto full dari listing `selesai` > 30 hari dihapus (thumb dipertahankan untuk halaman "sudah tidak tersedia").

---

## 9. Prinsip desain

### 9.1 Token visual

| Token | Nilai awal | Pemakaian |
|---|---|---|
| `--navy-900` | `#1A0B7A` (dari latar slide; ⚠️ ambil hex pasti dari file desain) | Header, teks judul, tombol sekunder |
| `--navy-600` | sedikit lebih terang dari 900 | Banner beranda, chip aktif |
| `--yellow-400` | `#FDD94E` (dari slide; ⚠️ ambil hex pasti) | **Hanya latar**: tombol Jual, badge kondisi, highlight. Teks di atasnya selalu `--navy-900` |
| `--wa-green` | Hijau tombol WA di mockup | Hanya untuk tombol WhatsApp, agar artinya konsisten |
| `--ink` / `--muted` / `--line` / `--surface` | Netral abu kebiruan | Teks isi, meta, garis, latar kartu |
| `--danger` | Merah dengan kontras ≥ 4,5:1 | Error, tombol hapus |
| Font | Poppins 400 / 600 / 700 | 700 hanya untuk judul halaman & harga |
| Radius | 12 px kartu, 999 px chip & tombol | Sama dengan mockup |

Larangan: gradien ungu-biru, glassmorphism/blur latar, emoji sebagai ikon/dekorasi, ilustrasi 3D stok di dalam aplikasi (karakter 3D di slide 5 cukup untuk presentasi), bayangan tebal. Elemen dekoratif garis lengkung dari slide boleh dipakai **hanya** di halaman kosong/404 dan `/tentang`.

### 9.2 Hierarki kartu buku

Kartu adalah elemen yang paling sering dilihat. Urutan informasi ditentukan oleh pertanyaan yang ada di kepala pencari:

1. **Foto sampul** (3:4) — "ini buku yang kucari?" Badge kondisi di pojok kiri atas foto (latar kuning, teks navy), mengikuti mockup.
2. **Judul** — Poppins 600, 14–15 px, maksimal 2 baris lalu terpotong (ellipsis).
3. **Harga / "Gratis" / "Tukar"** — Poppins 700, navy. "Gratis" dan "Tukar" berbentuk pill outline agar terbedakan dari harga.
4. **Meta**: `Pend. Informatika · Sem 3` — 12 px, `--muted`.
5. **Waktu**: "2 hari lalu" — 12 px. Jika `dipesan`, diganti label "Dipesan".

Yang **dihapus** dari kartu mockup: tombol hijau berisi nomor WA. Alasannya ada di SEC-20, dan tanpa tombol itu kartu juga lebih pendek sehingga lebih banyak buku yang muat dalam satu layar. Seluruh kartu menjadi satu target sentuh menuju detail.

**Badge kondisi** (D-05): mockup memakai persen ("90% bagus"). Persen terlihat presisi padahal setiap penjual menilainya sendiri-sendiri, sehingga dua buku "80%" bisa sangat berbeda. MVP memakai 4 tingkat dengan definisi yang ditampilkan saat posting:

| Label | Definisi untuk penjual |
|---|---|
| Seperti baru | Tidak ada coretan/stabilo, sampul dan jilid mulus |
| Baik | Ada sedikit stabilo/catatan pensil (< 10 halaman), jilid kuat |
| Layak | Banyak stabilo/catatan, sampul lecek, tetapi semua halaman lengkap dan terbaca |
| Banyak coretan | Catatan di banyak halaman atau ada kerusakan kecil; sebutkan di catatan |

Halaman yang hilang/sobek wajib disebut di catatan.

### 9.3 Copy: nada mahasiswa yang santai tapi jelas

Aturan:
- Pakai "kamu" dan "aku". Hindari "Anda" dan hindari "kak/kakak" di UI sistem, karena pengguna bisa maba maupun dosen.
- Kalimat pendek, kata kerja di depan: "Jual bukumu", "Pasang Dicari", "Chat penjual".
- Pesan error harus menjawab tiga hal: apa yang salah, kenapa (jika berguna), dan apa yang harus dilakukan.
- Tidak ada slogan atau klaim ("platform terbaik", "revolusioner"). Tagline yang dipakai tetap dari mockup: **"Buku kuliah bekas, dari kakak tingkat."**
- Angka selalu konkret: "4 buku", bukan "beberapa buku".

Contoh:

| Situasi | ✗ Hindari | ✓ Pakai |
|---|---|---|
| Tombol utama detail | "Beli Sekarang!" | "Chat penjual via WhatsApp" |
| Email bukan UM | "Autentikasi gagal." | "Pakai akun Google kampus UM (…@students.um.ac.id atau …@um.ac.id), ya." |
| Upload gagal | "Terjadi kesalahan." | "Fotonya gagal keunggah. Cek sinyalmu, lalu coba lagi. (Kode: ERR-7F3K)" |
| Sukses posting | "Selamat! Listing Anda berhasil dibuat!" | "Bukumu sudah tayang. Jangan lupa tandai 'Selesai' kalau sudah laku." |
| Rate limit kontak | "Too many requests." | "Kamu sudah menghubungi 30 penjual hari ini. Lanjut besok, ya." |

### 9.4 State kosong & error

| Tempat | Copy | Aksi |
|---|---|---|
| Hasil cari kosong | "Belum ada '*basis data*' di sini." / "Pasang Dicari, biar yang punya bisa nemu kamu." | [Pasang Dicari] [Hapus filter] |
| Beranda tanpa listing | "Raknya masih kosong." / "Punya buku semester lalu? Jadi yang pertama." | [Jual bukumu] |
| Prodi tanpa listing | "Belum ada buku dari Pend. Fisika." | [Lihat semua prodi] [Pasang Dicari] |
| Listing saya kosong | "Kamu belum jual apa-apa." | [Jual bukumu] |
| Dicari kosong | "Belum ada yang lagi nyari buku." | [Pasang Dicari] |
| 404 | "Bukunya nggak ketemu. Mungkin sudah dihapus pemiliknya." | [Ke beranda] |
| Offline | "Kamu lagi offline. Halaman ini butuh internet." | [Coba lagi] |
| Error server | "Ada yang error di sisi kami, bukan salahmu. Coba lagi sebentar. Kode: ERR-xxxx" | [Coba lagi] |
| Akun diblokir | "Akunmu diblokir karena melanggar Syarat Penggunaan. Kalau menurutmu ini keliru, email kami di …" | [Baca Syarat] |

State kosong tidak memakai ilustrasi besar; cukup teks + 1–2 tombol + (opsional) dekorasi garis lengkung dari identitas slide.

### 9.5 Tata letak responsif

- Mobile (< 640 px): mengikuti mockup, grid 2 kolom kartu, bottom nav 5 item.
- Tablet/desktop (≥ 1024 px): bottom nav pindah menjadi top nav; grid 4–5 kolom; detail listing dua kolom (galeri kiri, info + tombol kanan). Lebar konten maksimal 1200 px.
- Istilah "website mading" di slide 2 diterjemahkan sebagai **papan katalog yang bisa diakses web dari HP**, bukan papan fisik atau tampilan desktop-first (D-11).

---

## 10. Rencana rilis

### 10.1 Kapasitas

- 1 developer, **8 minggu**, perkiraan 12 jam/minggu → ±96 jam kerja efektif (A-07). Jika kapasitas nyata lebih kecil, potong semua item **Should** terlebih dahulu.
- 3 anggota non-developer: desain UI di Figma (minggu 1–3), data master prodi & konten kebijakan (minggu 2–5), seeding listing awal (minggu 6–7), moderator (mulai minggu 7), fasilitator uji coba (minggu 7–8).

### 10.2 Milestone mingguan

| Minggu | Developer | Non-developer | Gerbang keluar (wajib terpenuhi sebelum lanjut) |
|---|---|---|---|
| **1** — Fondasi & go/no-go auth | Repo + Next.js + Tailwind + Supabase CLI; deploy "hello" ke Vercel; Google OAuth + cek domain (SEC-01/02); **uji login dengan 3 akun students.um.ac.id dan 1 akun um.ac.id**; cek ulang semua angka ⚠️ di §8.4 | Desain komponen kartu, detail, form posting di Figma berdasarkan §9; kirim email ke UPT TIK (Q-03) | Login UM berhasil **atau** fallback magic link (D-08) diputuskan |
| **2** — Skema & posting | Migrasi skema §4 + RLS + test RLS di CI (SEC-10, SEC-12); onboarding (FR-02); `/api/photos` dengan sharp (FR-05); form posting (FR-04) | Kumpulkan daftar prodi resmi UM dari situs um.ac.id → seed `study_programs`; draf `/syarat` & `/kebijakan-privasi` | Satu listing bisa dibuat dari HP sungguhan; AC-05.5 (EXIF hilang) lulus |
| **3** — Telusuri | Beranda (FR-08), pencarian & filter + indeks trigram (FR-09), detail (FR-10), kartu sesuai §9.2 | Isi 30 listing uji (data dummy) untuk tes performa | AC-09.1…09.9 lulus; Lighthouse ≥ 85 di `/cari` |
| **4** — Kontak & siklus listing | Kontak WA + rate limit (FR-11, SEC-20…25); edit/hapus/status (FR-06, FR-07); Akun & Listing saya (FR-17) | Tulis `/panduan-cod`; survei 3–5 titik COD aman (Q-06) | SEC-20 (grep nomor = 0) lulus |
| **5** — Dicari & lapor | Dicari (FR-12); laporan + auto-hide (FR-14); event metrik (FR-23) | Finalisasi kebijakan privasi & syarat | Semua **Must** fitur pengguna selesai |
| **6** — Moderasi & keamanan | Panel admin + blokir (FR-15, FR-16); unduh data & hapus akun (FR-18); header keamanan + CSP (SEC-93); halaman statis (FR-20); backup mingguan (SEC-80) + **uji restore** | Rekrut 6–8 peserta uji coba (§13); siapkan skrip uji | securityheaders.com nilai A; restore berhasil; Supabase Security Advisor 0 ERROR |
| **7** — Uji coba & seeding | Perbaiki bug; Should jika ada waktu (FR-13, FR-19, FR-21, FR-24); a11y pass (NFR-10…16) | **Uji usability putaran 1** (§13.2); ajak 10–20 kakak tingkat dari prodi anggota tim untuk memposting buku asli (target ≥ 40 listing nyata sebelum peluncuran) | Semua temuan "kritis" dari uji coba diperbaiki |
| **8** — Peluncuran terbatas | Perbaikan hasil uji; query metrik §11 di panel admin; README & runbook (NFR-41) | Peluncuran ke 2–3 prodi dulu (grup angkatan + IG himpunan), lalu kirim menfess; moderator mulai bertugas harian | Definisi selesai MVP (§10.4) terpenuhi |

Urutan kerja disusun agar **risiko terbesar diuji paling awal** (login Google UM di minggu 1, privasi nomor di minggu 4) dan agar setiap minggu menghasilkan sesuatu yang bisa didemokan.

### 10.3 Yang dipotong pertama jika terlambat

1. FR-22 PWA → 2. FR-24 chip MK → 3. FR-21 Open Graph → 4. FR-19 kedaluwarsa (lakukan manual lewat SQL) → 5. FR-13 pencocokan. Item **Must** dan semua SEC tidak boleh dipotong; jika Must terancam, mundurkan peluncuran.

### 10.4 Definisi "selesai" MVP

MVP dianggap selesai jika **semua** poin berikut benar:

- [ ] Semua FR berprioritas Must lolos acceptance criteria-nya, diuji oleh **anggota tim selain developer** memakai dokumen ini.
- [ ] Test RLS (SEC-12) dan cek RLS aktif (SEC-10) lulus di CI.
- [ ] SEC-20: tidak ada nomor WA di HTML/JSON publik (grep).
- [ ] AC-05.5: foto hasil upload bebas EXIF/GPS.
- [ ] Lighthouse mobile: Performance ≥ 85, Accessibility ≥ 95, SEO ≥ 95 di `/`, `/cari`, `/buku/[id]`.
- [ ] Header keamanan nilai A; Supabase Security Advisor 0 ERROR.
- [ ] Backup mingguan berjalan dan restore pernah berhasil diuji.
- [ ] `/kebijakan-privasi`, `/syarat`, `/panduan-cod` tayang dan sudah dibaca minimal 1 dosen/pihak di luar tim (Q-08).
- [ ] Uji usability putaran 1 selesai dan temuan kritis diperbaiki.
- [ ] ≥ 40 listing nyata (bukan dummy) aktif saat peluncuran ke publik.
- [ ] 2 admin aktif dengan 2FA; README & runbook insiden ada di repo.
- [ ] Semua angka ⚠️ di §8.4 sudah dicek dan diperbarui di dokumen ini.

---

## 11. Metrik keberhasilan

### 11.1 Definisi

| ID | Metrik | Definisi persis | Target 4 minggu setelah peluncuran (tebakan awal, kalibrasi di minggu ke-2) |
|---|---|---|---|
| M-01 | Pengguna teraktivasi | Akun yang menyelesaikan onboarding **dan** melakukan ≥ 1 aksi inti (posting listing, pasang Dicari, atau membuka kontak) dalam 7 hari sejak daftar | ≥ 150 akun; rasio aktivasi ≥ 50% dari pendaftar |
| M-02 | Listing aktif | Listing `status IN ('aktif','dipesan')`, tidak tersembunyi, dihitung tiap Senin 00.00 | ≥ 100 |
| M-03 | Rasio listing yang dihubungi | % listing yang dibuat dalam periode dan mendapat ≥ 1 `contact_revealed` dalam 14 hari | ≥ 40% |
| M-04 | Rasio listing tersalurkan | % listing berumur ≥ 14 hari yang ditandai `selesai` dengan `done_via = 'thriftbook'` | ≥ 20% |
| M-05 | Rasio permintaan terpenuhi | % Dicari yang dibuat dalam periode dan berstatus `terpenuhi` dalam 30 hari (terpisah: `fulfilled_via = 'thriftbook'`) | ≥ 15% |
| M-06 | Waktu sampai kontak pertama | Median jam dari `listing_created` ke `contact_revealed` pertama | ≤ 72 jam |
| M-07 | Pencarian tanpa hasil | % event `search_performed` dengan `result_count = 0` | Dipantau; daftar `q` teratas yang tanpa hasil menjadi bahan ajakan seeding |
| M-08 | Kesehatan moderasi | Laporan `penipuan`/`bajakan` yang ditindak ≤ 24 jam pada hari kuliah | ≥ 90% |
| M-09 | Sebaran prodi | Jumlah prodi dengan ≥ 5 listing aktif | ≥ 8 |

**Metrik pengaman** (jika memburuk, hentikan promosi dan perbaiki dulu): jumlah laporan `penipuan` per 100 listing, jumlah akun diblokir, dan penggunaan storage (%).

Kenapa tidak memakai jumlah transaksi atau GMV: transaksi terjadi di luar sistem (WA + COD), jadi tidak terukur. `done_via` adalah proksi yang dilaporkan sendiri oleh pengguna dan cenderung bias. Gunakan untuk melihat tren, bukan sebagai angka mutlak.

### 11.2 Cara mengukur tanpa tool berbayar

- **Sumber kebenaran:** tabel `events`, `listings`, `book_requests`, `contact_reveals` di Supabase.
- **Query** disimpan sebagai SQL view (`metrics_weekly`) di migrasi, dan ditampilkan di panel admin (AC-15.6). Contoh M-03:

```sql
select date_trunc('week', l.created_at) as minggu,
       count(*) as listing_baru,
       count(*) filter (where exists (
         select 1 from contact_reveals c
         where c.listing_id = l.id and c.created_at < l.created_at + interval '14 days'
       )) * 100.0 / nullif(count(*),0) as pct_dihubungi
from listings l
where l.created_at < now() - interval '14 days'
group by 1 order by 1 desc;
```

- **Trafik umum** (kunjungan, halaman populer, sumber rujukan seperti x.com atau instagram.com): Cloudflare Web Analytics (snippet JS tanpa cookie). Tambahkan parameter `?ref=menfess`, `?ref=ig-<prodi>` di tautan promosi agar sumbernya terbaca.
- **Ritme:** Senin pagi, satu anggota tim menyalin angka mingguan ke spreadsheet bersama (Google Sheets) agar tren terlihat walaupun data lama dibersihkan.
- **Kualitatif:** pertanyaan 1-klik di AC-07.2 / AC-12.4, plus formulir umpan balik (Google Form) di footer.

---

## 12. Risiko, asumsi & pertanyaan terbuka

### 12.1 Fakta dari dokumen tim (slide)

| ID | Fakta | Sumber |
|---|---|---|
| F-01 | Pengguna sasaran: mahasiswa UM, lintas angkatan & jurusan; "inklusif bagi seluruh sivitas akademika" | Slide 2 |
| F-02 | Masalah: kesulitan mendapatkan buku murah + pemilik tidak punya wadah | Slide 3 (Define) |
| F-03 | Riset berasal dari unggahan menfess UM di X; 5 contoh unggahan ditampilkan | Slide 3 (Empathize) |
| F-04 | Fitur: listing (foto, judul, kondisi, status jual/hibah/tukar), cari & filter (judul, MK, kondisi, harga/hibah), permintaan buku, kontak WhatsApp, COD di area kampus | Slide 4 |
| F-05 | Mockup mobile: beranda (banner, cari, per prodi, baru diposting), halaman cari (chip prodi, "sering dicari", grid kartu), bottom nav 4 item, badge kondisi persen, tombol WA berisi nomor | Slide 2 & 4 |
| F-06 | Mockup bisa berubah sesuai masukan; data di mockup hanya contoh | Slide 4 |
| F-07 | Tahap Tes: mahasiswa mencoba mencari buku berdasarkan MK/semester, melihat detail & kondisi, memposting buku untuk dijual/dihibahkan, lalu memberi tanggapan soal kemudahan, kejelasan, dan fitur | Slide 5 |
| F-08 | Tim 4 orang; 1 orang ngoding; JS/TS; target 8 minggu | Jawaban klarifikasi |

### 12.2 Asumsi penulis

| ID | Asumsi | Dampak jika salah | Cara memvalidasi |
|---|---|---|---|
| A-01 | Akun `@students.um.ac.id` adalah akun Google Workspace yang bisa dipakai untuk "Sign in with Google" di aplikasi pihak ketiga | Login utama gagal → fallback magic link (D-08), +3–5 hari kerja | Uji di minggu 1 (SEC-09) |
| A-02 | Dosen/staf memakai `@um.ac.id`; mungkin ada subdomain fakultas | Sebagian dosen tidak bisa login | Q-03 |
| A-03 | Sebagian besar transaksi bernilai kecil (puluhan ribu rupiah, sesuai contoh "serba 15k" dan harga di mockup) | Jika nilai besar, risiko penipuan & kebutuhan fitur kepercayaan naik | Data harga listing 4 minggu pertama |
| A-04 | Mahasiswa nyaman memberikan nomor WA ke sesama mahasiswa UM yang login | Jika tidak, posting turun | Uji coba §13 (pertanyaan khusus) |
| A-05 | Volume ≤ 10.000 listing dalam 2 tahun | Jika jauh lebih besar, perlu pencarian berbasis full-text + storage berbayar | M-02 |
| A-06 | "Website mading" berarti katalog digital yang dibuka dari HP, bukan papan fisik | Jika maksudnya juga mading fisik (misal QR poster di kampus), tambahkan poster sebagai kanal promosi, bukan fitur | Konfirmasi dengan tim |
| A-07 | Developer punya ±12 jam/minggu | Jika < 8 jam, potong semua Should dan geser peluncuran 2 minggu | Catat jam aktual tiap minggu |
| A-08 | "Tukar" tidak butuh mekanisme pencocokan otomatis; cukup teks "ingin ditukar dengan" | Jika tukar menjadi populer, perlu fitur khusus | Proporsi listing `tukar` |
| A-09 | Email kampus bisa dinonaktifkan setelah lulus | Pemilik akun layanan kehilangan akses → NFR-42 | Tanya UPT TIK |
| A-10 | Mata kuliah bisa lintas prodi (contoh: "Belajar dan Pembelajaran" dicari dari beberapa konteks) sehingga MK tidak dimodelkan sebagai anak dari prodi | Jika MK selalu spesifik per prodi, filter jadi sedikit kurang presisi | Data `courses` setelah 4 minggu |

### 12.3 Inkonsistensi di dokumen tim & keputusan

| # | Inkonsistensi | Keputusan |
|---|---|---|
| I-1 | "Website mading informasi" vs mockup aplikasi mobile | Web mobile-first responsif, PWA sebagai Could (D-11, A-06) |
| I-2 | Banner mockup "jual · beli · hibah" vs fitur "jual, hibah, tukar" | Banner diganti "jual · hibah · tukar" (AC-08.5) |
| I-3 | Permintaan buku adalah fitur inti, tetapi tidak ada di bottom nav mockup | Tambah tab "Dicari" (D-12) |
| I-4 | Ikon lonceng notifikasi di mockup, tetapi notifikasi tidak disebut di daftar fitur | Lonceng dihapus dari MVP; diganti FR-13 (D-08) |
| I-5 | Kartu mockup memakai sampul warna-warni dengan judul, sedangkan fitur listing menyebut foto | Foto wajib; sampul warna hanya sebagai placeholder saat memuat (§8.5) |
| I-6 | Badge "90% bagus" di mockup | Skala 4 tingkat berlabel (D-05) |
| I-7 | Nomor WA tampil di kartu | Disembunyikan di balik tombol + login (D-04) |
| I-8 | "Sering dicari anak Pend. Informatika" butuh data pencarian yang belum ada | Label "Mata kuliah terbanyak" sampai data cukup (FR-24) |
| I-9 | Slide 2 menyebut "sivitas akademika", jawaban klarifikasi "bebas" | MVP: mahasiswa + dosen/staf dengan email UM; alumni & umum ditunda (D-03) |

### 12.4 Risiko

| ID | Risiko | Kemungkinan | Dampak | Mitigasi | Pemilik |
|---|---|---|---|---|---|
| R-01 | Workspace UM memblokir login aplikasi pihak ketiga | Sedang | Tinggi | Uji minggu 1; fallback magic link + SMTP gratis | Dev |
| R-02 | Supabase auto-pause saat libur | Tinggi | Sedang | NFR-30/31; runbook restore | Dev |
| R-03 | Cold start: pencari datang, listing sedikit, lalu tidak kembali | **Tinggi** | **Tinggi** | Seeding ≥ 40 listing nyata sebelum peluncuran; peluncuran bertahap per prodi; Dicari menangkap permintaan yang belum terpenuhi | Non-dev |
| R-04 | Storage gratis penuh | Sedang | Sedang | §8.4–8.5, alarm 70%, rencana R2 | Dev |
| R-05 | Kasus penipuan pertama terjadi dan viral di menfess | Sedang | Tinggi | SEC-30…36; respons publik disiapkan; tanggung jawab dibatasi di `/syarat` | Admin |
| R-06 | Listing bajakan/PDF | Sedang (ada sinyal di riset) | Sedang | SEC-40/41 | Admin |
| R-07 | Moderator tidak aktif (sibuk kuliah/UAS) | Tinggi | Sedang | Jadwal giliran; auto-hide 3 laporan; SLA realistis | Tim |
| R-08 | Developer tunggal sakit/sibuk → proyek berhenti | Sedang | Tinggi | Repo publik, migrasi + README, akun layanan milik tim (NFR-42) | Tim |
| R-09 | Ketentuan Vercel Hobby (non-komersial) dianggap dilanggar | Rendah–sedang | Sedang | Q-05; rencana pindah ke Cloudflare | Dev |
| R-10 | Perubahan kuota/harga layanan gratis | Sedang | Sedang | Cek ulang angka ⚠️ tiap semester | Dev |
| R-11 | Nomor WA yang dimasukkan milik orang lain | Rendah | Sedang | Laporan `nomor_salah`; tombol "Tes nomor ini"; blokir | Admin |
| R-12 | Masa ramai pencarian buku hanya di awal semester (asumsi) | Tinggi | Sedang | Jadwalkan peluncuran/promosi dekat awal semester; ukur M-02 per semester, bukan per minggu | Tim |

### 12.5 Pertanyaan terbuka

| ID | Pertanyaan | Kenapa penting | Cara menjawab | Batas waktu |
|---|---|---|---|---|
| Q-01 | Seberapa besar volume jual/cari buku bekas di UM per semester? | Menentukan target metrik | Hitung unggahan menfess yang relevan selama 1 semester (cari kata kunci "buku", "preloved", "PL", "hibah" di akun menfess, catat manual di spreadsheet); survei singkat ke 2–3 grup angkatan | Minggu 3 |
| Q-02 | Apakah mahasiswa lebih suka nomor WA atau DM Instagram/X? | Memvalidasi WhatsApp sebagai kanal | Pertanyaan di uji coba §13 | Minggu 7 |
| Q-03 | Apa saja domain email resmi mahasiswa, dosen, dan staf UM (termasuk subdomain fakultas)? Apakah akun nonaktif setelah lulus? | SEC-01/02, A-09 | Email/kunjungi UPT TIK UM | Minggu 1 |
| Q-04 | Apakah alumni perlu bisa menghibahkan buku? | Sumber suplai potensial | Wawancara 3–5 alumni di uji coba | Setelah MVP |
| Q-05 | Apakah thriftbook termasuk "non-komersial" menurut ketentuan Vercel Hobby? | Kepatuhan hosting | Baca Fair Use Guidelines Vercel; jika ragu, tanya support atau pakai Cloudflare | Minggu 1 |
| Q-06 | Lokasi COD aman mana yang direkomendasikan di kampus? | `/panduan-cod` | Survei tim + tanya di uji coba | Minggu 4 |
| Q-07 | Bagaimana status diktat/modul buatan dosen dan apa batas penggunaan wajar menurut UU Hak Cipta? | SEC-40/41 | Tanya dosen pengampu / unit hukum UM | Minggu 5 |
| Q-08 | Siapa yang bisa meninjau kebijakan privasi & syarat (dosen, unit hukum)? | Kepatuhan UU PDP | Tanya dosen pengampu Manajemen Inovasi | Minggu 5 |
| Q-09 | Apakah proyek ini perlu izin/afiliasi resmi dari kampus untuk memakai nama "UM"? | Risiko reputasi/merek | Tanya bagian kemahasiswaan | Sebelum peluncuran |

---

## 13. Rencana uji coba (tahap Tes)

Selaras dengan slide 5: mahasiswa mencoba mencari buku berdasarkan MK/semester, melihat detail & kondisi, dan memposting buku, lalu memberi tanggapan soal kemudahan, kejelasan informasi, dan fitur.

### 13.1 Tujuan

1. Memvalidasi H1 & H2 (waktu posting, waktu menemukan buku).
2. Menemukan titik bingung di alur utama sebelum peluncuran.
3. Menguji A-04 (kenyamanan memberikan nomor WA) dan Q-02.
4. Menguji apakah label kondisi 4 tingkat (D-05) dipahami sama oleh penjual dan pembeli.

### 13.2 Putaran 1 — Usability moderated (minggu 7)

- **Peserta:** 6–8 mahasiswa UM, campuran: ≥ 3 maba/semester 1–2 (pencari), ≥ 3 semester 5+ yang punya buku bekas (pemilik), dari ≥ 3 prodi berbeda, dan **bukan** teman dekat anggota tim agar jawabannya tidak sungkan. Rekrut lewat grup angkatan; insentif opsional (misal jajanan, non-uang jika tanpa anggaran).
- **Lingkungan:** HP peserta sendiri, situs staging dengan ≥ 30 listing. Satu fasilitator, satu pencatat. Durasi 20–25 menit.
- **Persetujuan:** peserta membaca dan menyetujui lembar persetujuan singkat (tujuan, data yang dicatat, tidak direkam wajah, boleh berhenti kapan saja). Gunakan akun uji, bukan nomor WA asli peserta, kecuali mereka mau.

**Tugas** (dibacakan tanpa menyebut nama tombol):

| # | Tugas | Sukses jika | Diukur |
|---|---|---|---|
| T1 | "Kamu butuh buku untuk MK Basis Data. Cari yang paling murah." | Sampai di detail listing termurah MK tersebut | Berhasil/gagal, waktu (target ≤ 60 dtk), jumlah salah ketuk |
| T2 | "Cari buku apa saja untuk semester 3 di prodimu yang gratis." | Memakai filter semester + tipe hibah | Berhasil/gagal, waktu |
| T3 | "Buku ini kondisinya bagaimana? Kamu mau beli?" (di detail) | Bisa menjelaskan arti label kondisi dengan benar | Pemahaman (benar/salah) |
| T4 | "Hubungi penjualnya." | Sampai WA terbuka (termasuk login) | Berhasil/gagal, waktu, komentar soal login |
| T5 | "Posting satu buku yang kamu punya (boleh foto buku apa saja di sekitar)." | Listing terbit | Waktu (target ≤ 3 menit), field yang bikin ragu |
| T6 | "Bukunya sudah laku. Tandai." | Status selesai | Berhasil/gagal |
| T7 | "Kamu cari buku yang belum ada di sini. Apa yang akan kamu lakukan?" | Menemukan "Pasang Dicari" tanpa bantuan | Berhasil/gagal |

**Setelah tiap tugas:** Single Ease Question (1–7): "Seberapa mudah tugas ini?"

**Wawancara penutup (5 menit):**
1. Kalau mau jual buku, kamu lebih pilih di sini atau menfess? Kenapa?
2. Nyaman nggak nomor WA-mu bisa dibuka mahasiswa UM yang login? Kalau nggak, maunya gimana?
3. Info apa yang kurang di halaman detail buku?
4. Ada yang membingungkan atau mengganggu?
5. Kalau besok situs ini sudah jadi, kamu bakal pakai? Untuk apa?

**Pencatatan:** satu baris per peserta per tugas di spreadsheet (berhasil, waktu, SEQ, catatan kutipan). Temuan diberi tingkat: **Kritis** (tugas gagal), **Sedang** (berhasil tapi ragu/salah ketuk > 2), **Kecil** (komentar kosmetik).

**Kriteria lulus putaran 1:** T1, T4, T5 berhasil oleh ≥ 80% peserta; median waktu T5 ≤ 3 menit; tidak ada temuan Kritis yang belum diperbaiki sebelum peluncuran.

### 13.3 Putaran 2 — Pilot terbatas (minggu 8 + 2 minggu setelahnya)

- Peluncuran ke 2–3 prodi (prodi anggota tim lebih dulu karena seeding paling mudah di sana).
- Pantau M-01…M-09 setiap minggu (§11.2).
- Hubungi 5 penjual yang menandai `selesai` dan 5 pencari yang membuka kontak tetapi tidak memasang Dicari, lewat formulir singkat (opt-in): apa yang terjadi setelah chat WA?
- **Keputusan setelah 2 minggu pilot:** lanjut promosi ke menfess seluruh kampus jika M-02 ≥ 60 dan tidak ada laporan penipuan yang terkonfirmasi; jika tidak, perbaiki dulu berdasarkan temuan.

### 13.4 Etika & data uji coba

- Data uji (nama, kutipan) disimpan di folder tim dengan akses terbatas, dianonimkan (P1, P2, …) di laporan presentasi, dan dihapus setelah mata kuliah selesai.
- Akun & listing uji dihapus dari produksi sebelum peluncuran publik.

---

## 14. Ringkasan keputusan (1 halaman)

| ID | Keputusan | Opsi lain | Alasan | Harga yang dibayar |
|---|---|---|---|---|
| **D-01** | Stack: Next.js + Supabase (Postgres, Auth, Storage, RLS, pg_cron) + Vercel Hobby; pencarian `pg_trgm` | Firebase; Cloudflare Workers + D1 + R2 | Tercepat untuk 1 dev JS/TS; RLS bisa diuji; filter kombinasi = SQL; Rp0 tanpa kartu kredit | Kuota storage/egress kecil, auto-pause, ketentuan non-komersial Vercel; 2 vendor |
| **D-02** | Login hanya Google OAuth dengan allowlist domain persis | Email + password; magic link | Tanpa password lokal, email sudah terverifikasi Google, tanpa SMTP | Bergantung kebijakan Workspace UM (R-01) |
| **D-03** | Pengguna MVP: `students.um.ac.id` + `um.ac.id` | Siapa saja; hanya mahasiswa | "Sivitas akademika" di slide 2; domain kampus = mekanisme anti akun massal paling murah | Alumni dan pihak luar belum bisa ikut |
| **D-04** | Nomor WA disembunyikan; tombol → `wa.me` dibuat server, login wajib, 30 kontak/hari, dicatat | Nomor di kartu (mockup); nomor terlihat setelah login; relay | Mencegah scraping massal nomor mahasiswa | +1 langkah login bagi pencari baru; berbeda dari mockup |
| **D-05** | Kondisi 4 tingkat berlabel + definisi | Persen (mockup); bintang | Persen terlihat presisi padahal subjektif | Perlu edukasi singkat di form |
| **D-06** | Mata kuliah = teks bebas + autocomplete, dinormalisasi, bisa digabung admin | Daftar MK resmi per prodi | Tidak ada data MK resmi siap pakai; MK bisa lintas prodi | Bisa terjadi duplikat ejaan; admin perlu merapikan |
| **D-07** | Pencarian `pg_trgm` (fuzzy) di judul+penulis+MK | Postgres full-text; Algolia/Typesense | Cukup untuk < 10 ribu listing, toleran salah ketik, tanpa layanan tambahan | Tidak paham sinonim/stemming bahasa Indonesia |
| **D-08** | Tanpa notifikasi di MVP; fallback login magic link via SMTP gratis hanya jika Google gagal | Email/push notifikasi | Hemat waktu dan biaya; FR-13 sebagai pengganti | Pencari harus mengecek ulang sendiri |
| **D-09** | Gambar: kompres di klien → re-encode `sharp` di server ke WebP 1280/400 px, tanpa metadata, maksimal 3 foto | Upload langsung ke storage dari klien | Hemat storage & kuota pengguna; EXIF/GPS pasti terbuang; validasi tidak bisa dilewati | CPU fungsi server; batas body request |
| **D-10** | Foto tidak dicadangkan; DB di-backup mingguan terenkripsi via GitHub Actions | Backup berbayar (PITR) | Rp0; foto bisa diunggah ulang | RPO 7 hari; foto bisa hilang |
| **D-11** | Web mobile-first responsif, PWA sebagai Could | App native; desktop-first "mading" | Mockup mobile; satu codebase | Tanpa push notification native |
| **D-12** | Bottom nav 5 item: Beranda · Cari · Jual · Dicari · Akun | 4 item seperti mockup | Dicari adalah fitur inti tanpa pintu masuk | Nav sedikit lebih padat |
| **D-13** | Metrik dari tabel `events` + Cloudflare Web Analytics tanpa cookie | Google Analytics | Tanpa banner cookie, data di tangan sendiri, Rp0 | Dashboard dibuat sendiri (SQL) |

**Tiga hal yang paling menentukan berhasil-tidaknya MVP:**
1. **Login Google UM berhasil di minggu 1** (R-01). Kalau gagal, seluruh jadwal bergeser.
2. **Suplai buku sebelum peluncuran** (R-03): minimal 40 listing nyata, peluncuran bertahap per prodi.
3. **Nomor WA mahasiswa tidak bocor** (SEC-20…25). Satu insiden kebocoran nomor lebih merusak kepercayaan daripada fitur apa pun yang belum ada.

---

*Sumber angka layanan pihak ketiga (dicek 11 Oktober 2026; tetap verifikasi di situs resmi): halaman harga Cloudflare R2 (developers.cloudflare.com/r2/pricing), FAQ harga Vercel (vercel.com/pricing), serta beberapa artikel pihak ketiga tentang paket gratis Supabase yang angkanya saling bertentangan, sehingga semuanya ditandai ⚠️.*
