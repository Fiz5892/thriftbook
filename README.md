# thriftbook.

Jual, hibah, dan tukar buku kuliah bekas antar sivitas Universitas Negeri Malang.
Spesifikasi lengkap: [docs/PRD-thriftbook.md](docs/PRD-thriftbook.md).

## Status fitur (terhadap PRD §3)

Semua fitur Must, Should, dan Could di PRD sudah diimplementasikan. Kolom "Diuji" menyebut
bukti yang ada; yang tertulis "belum" memang belum pernah dijalankan.

| ID | Fitur | Diuji |
|---|---|---|
| FR-01 | Login Google UM + cek domain persis | Logika + trigger DB diuji. **Alur OAuth Google asli belum** |
| FR-02 | Onboarding (profil, WA, persetujuan) | Browser (e2e) |
| FR-03 | Keluar, keluar dari semua perangkat | Keluar diuji; "semua perangkat" belum |
| FR-04/05 | Posting, foto (kompres klien, re-encode server, EXIF dibuang), draf `localStorage`, jadikan sampul | Browser (e2e) |
| FR-06/07 | Edit, hapus (konfirmasi), dipesan, selesai + jawaban "lewat thriftbook?", aktifkan lagi | Browser (e2e) |
| FR-08/09/10 | Beranda, cari (filter, semester, harga maks, termurah, relevan, **toleran salah ketik**), detail | Browser (e2e) |
| FR-11 | Kontak WhatsApp (server membentuk wa.me, rate limit, tercatat) | Browser + DB |
| FR-12/13 | Dicari + pencocokan dengan listing | Browser (e2e) |
| FR-14 | Lapor, auto-hide 3 pelapor (trigger DB + fallback aplikasi) | Browser + DB |
| FR-15/16 | Panel moderasi, blokir/buka blokir, riwayat append-only, anomali kontak | Browser (e2e) |
| FR-17/18 | Akun, unduh data, hapus akun (cascade + foto) | Browser (e2e) |
| FR-19 | Kedaluwarsa otomatis (cron HTTP) | Endpoint diuji; **jadwal Vercel belum** (butuh deploy) |
| FR-20 | Syarat, Privasi, Panduan COD, Tentang | **Draf**, belum ditinjau pihak hukum |
| FR-21 | Open Graph, sitemap, robots, tombol Bagikan | Diuji |
| FR-22 | PWA (manifest, ikon, service worker offline) | Manifest ter-build; **instal & service worker di produksi belum diuji** |
| FR-23 | Event metrik (termasuk `search_performed` tanpa identitas) | Browser + DB |
| FR-24 | Chip "Mata kuliah terbanyak" | Kode ada; tidak punya tes otomatis |

## Hasil pengukuran (build produksi setelah restyle, Lighthouse mobile, median 3 run)

Diukur dari `localhost` ke database Supabase, tanpa CDN, jadi **TTFB cenderung pesimistis**
(±600 ms, dominan oleh perjalanan ke database). Ukur ulang setelah deploy di region dekat database.

| Halaman | Performa | Aksesibilitas | SEO | Best practices | LCP | TBT | Transfer |
|---|---|---|---|---|---|---|---|
| Landing (tamu) | 86 | 100 | 100 | 100 | 3,09 dtk | 354 ms | 270 KB |
| Cari | 92 | 100 | 100 | 100 | 3,28 dtk | 98 ms | 287 KB |
| Dicari | 95 | 100 | 100 | 100 | 2,79 dtk | 77 ms | 270 KB |
| Detail buku | 89 | 100 | 100 | 100 | 3,41 dtk | 164 ms | 296 KB |

| Target PRD | Hasil |
|---|---|
| NFR-06 performa ≥ 85 | **Tercapai** (86–95) |
| NFR-15 aksesibilitas ≥ 95, NFR-24 SEO ≥ 95 | **Tercapai** (100, 100) |
| NFR-04 transfer muat pertama ≤ 700 KB | **Tercapai** (≤ 300 KB) |
| NFR-02 CLS ≤ 0,1 | **Tercapai** (0) |
| **NFR-01 LCP ≤ 2,5 dtk** | **Belum tercapai** (2,8–3,4 dtk). Restyle menambah ±55 KB (huruf display Unbounded) |
| axe WCAG 2.2 AA, 16 halaman | 0 temuan, kecuali 1 *target-size* di /jual yang muncul karena bottom nav sticky menutupi radio pada posisi scroll audit. Uji fokus keyboard: 21 kontrol di /jual tidak pernah tertutup saat difokus (`scroll-padding`) |

## Tampilan

- Sistem desain di `src/app/globals.css`: kertas krem, garis tinta 2px, bayangan keras, aksen pastel
  (mint, pink, lilac, oranye) di atas identitas biru tua + kuning. Kelas: `card`, `btn` (`btn-yellow`,
  `btn-ink`, `btn-outline`, `btn-wa`, `btn-danger`, `btn-sm`), `chip`, `input`, `badge`, `notice`,
  `alert-danger`, `option`. Pakai kelas ini, jangan menulis ulang gaya tombol per halaman.
- Huruf: Unbounded untuk judul (`h1`, `h2`, `.font-display`), Poppins untuk teks.
- Maskot **Tibo** (`src/components/mascot.tsx`): SVG murni dengan ekspresi `happy`, `wave`, `search`,
  `oops`, `cheer`. Dipakai di landing, beranda, masuk, state kosong, 404, dan error.
- Navigasi: header atas di desktop; bottom nav hanya di layar < 768px.
- Landing page (`/` untuk tamu). Pengguna yang sudah masuk melihat beranda katalog di `/`.
- Motion (`src/components/motion.tsx`): jejak garis yang tergambar mengikuti scroll dengan maskot
  berjalan di atasnya, pita teks yang bergerak sesuai scroll, parallax hero, dan "pop-in" saat elemen
  masuk layar. Semua transform diset lewat CSSOM (aman untuk CSP tanpa `unsafe-inline`) dan mati
  otomatis bila pengguna memilih *reduce motion*.

## Perintah

```bash
npm install
cp .env.example .env        # isi nilainya; NEXT_PUBLIC_SUPABASE_URL = https://<ref>.supabase.co (tanpa /rest/v1)
npm run dev                 # http://localhost:3000
npm test                    # unit test: domain email, WA, skema, bajakan, fuzzy
npm run test:rls            # 24 test RLS terhadap DB nyata (membuat pengguna uji lalu menghapusnya)
npm run typecheck && npm run lint
```

## Migrasi database (jalankan berurutan di SQL Editor Supabase)

1. `0001_init.sql`: skema, RLS, trigger, RPC kontak WA
2. `0002_log_event.sql`: pencatatan metrik
3. `0003_fix_autohide.sql`: perbaikan bug auto-hide 3 laporan (trigger proteksi kolom membatalkannya).
   Aplikasi punya fallback di kode, tetapi jalankan migrasi ini agar jalur insert langsung ikut ter-hide.

## Yang harus dikerjakan manusia

1. **Uji login Google UM sungguhan di browser.** Seluruh jalur sesudah login sudah diuji otomatis
   dengan sesi yang diterbitkan service role. Yang belum: layar OAuth Google itu sendiri, termasuk
   apakah Workspace UM mengizinkan aplikasi pihak ketiga (PRD R-01).
2. Jadikan dirimu admin (sengaja tanpa UI, SEC-05):
   ```sql
   update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'EMAIL_KAMU');
   ```
   Aktifkan 2-Step Verification di akun Google itu.
3. Konfirmasi domain email resmi ke UPT TIK UM (Q-03). Daftar domain ada di dua tempat dan harus
   diubah bersamaan: `ALLOWED_EMAIL_DOMAINS` (env) dan fungsi `is_allowed_email` di migrasi.
4. Isi `study_programs` dengan daftar prodi resmi UM (migrasi hanya berisi 4 prodi dari mockup).
5. Tinjau `/syarat` dan `/kebijakan-privasi` dengan dosen pengampu (Q-08). Isi
   `NEXT_PUBLIC_CONTACT_EMAIL` dan survei titik COD untuk `/panduan-cod` (Q-06).
6. Deploy ke Vercel: isi semua env di `.env.example`, pastikan `CRON_SECRET` terisi, pilih region
   dekat database, lalu jalankan `npm run build` sekali sebelum deploy.
7. Setelah deploy: cek headers di securityheaders.com (target nilai A), instal PWA di HP, dan
   pastikan cron harian berjalan (log Vercel).
8. Backup mingguan: ikuti `.github/workflows/backup.yml` (secret `SUPABASE_DB_URL`, `AGE_PUBLIC_KEY`),
   lalu **uji restore sekali** (SEC-82). Jalankan juga Security Advisor di dashboard Supabase (SEC-14).
9. Rotasi password atau kredensial apa pun yang pernah ditempel di chat atau file.

## Catatan teknis

- Next.js 16 memakai `src/proxy.ts` (bukan `middleware.ts`). Baca `AGENTS.md` sebelum mengubah
  konvensi framework.
- `cacheComponents` dimatikan: CSP bernonce membutuhkan render dinamis, jadi seluruh halaman
  dirender per request. Dampaknya ke kuota fungsi Vercel dibahas di PRD §8.4.
- Kontak WA untuk listing lewat fungsi SQL `reveal_listing_contact` (atomik). Untuk Dicari lewat
  route server dengan service role dan aturan yang sama (SEC-21).
- Provider email/password Supabase **harus mati** (SEC-03). Tes dan skrip uji membuat sesi lewat
  magic link yang diterbitkan service role, tanpa mengirim email.
- Blokir = `profiles.banned_at` + ban di level Supabase Auth + hash email HMAC di `banned_emails`
  (mencegah daftar ulang). Jangan ganti `EMAIL_HASH_PEPPER` setelah ada akun diblokir.
- Pencarian: `ILIKE` per kata (indeks trigram); jika kosong, cadangan fuzzy di server
  (`src/lib/fuzzy.ts`) atas maksimal 1000 listing aktif. Jika listing aktif jauh melampaui itu,
  pindahkan ke fungsi `pg_trgm` di database.
- Foto tidak bisa diganti di halaman edit (hapus lalu posting ulang). Keputusan MVP.
- Jangan pernah memakai awalan `NEXT_PUBLIC_` untuk secret (SEC-70).
