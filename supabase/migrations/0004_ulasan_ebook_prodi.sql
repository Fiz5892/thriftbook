-- Fitur baru: (1) ulasan + rating, (2) e-book PDF, (3) prodi tambahan + "Lainnya" (isian bebas).
-- Rujukan: alur penggunaan thriftbook (diagram "Fitur baru").
-- Jalankan di SQL Editor Supabase SETELAH 0001–0003. Aman dijalankan sekali.

-- ================================================================ 1. PRODI
-- Daftar di bawah HARUS dicocokkan dengan sumber resmi UM sebelum rilis (lihat catatan seed di 0001).
insert into public.study_programs (slug, name, short_name) values
  ('pend-matematika',      'Pendidikan Matematika',            'Pend. Matematika'),
  ('pend-fisika',          'Pendidikan Fisika',                'Pend. Fisika'),
  ('pend-kimia',           'Pendidikan Kimia',                 'Pend. Kimia'),
  ('pend-biologi',         'Pendidikan Biologi',               'Pend. Biologi'),
  ('pend-bahasa-indonesia','Pendidikan Bahasa dan Sastra Indonesia', 'Pend. B. Indonesia'),
  ('pend-bahasa-inggris',  'Pendidikan Bahasa Inggris',        'Pend. B. Inggris'),
  ('pend-ekonomi',         'Pendidikan Ekonomi',               'Pend. Ekonomi'),
  ('pend-akuntansi',       'Pendidikan Akuntansi',             'Pend. Akuntansi'),
  ('paud',                 'Pendidikan Guru PAUD',             'PG-PAUD'),
  ('manajemen',            'Manajemen',                        'Manajemen'),
  ('akuntansi',            'Akuntansi',                        'Akuntansi'),
  ('teknik-informatika',   'Teknik Informatika',               'Teknik Informatika'),
  ('sistem-informasi',     'Sistem Informasi',                 'Sistem Informasi'),
  ('teknik-elektro',       'Teknik Elektro',                   'Teknik Elektro'),
  ('psikologi',            'Psikologi',                        'Psikologi'),
  ('hukum',                'Hukum',                            'Hukum'),
  ('ilmu-komunikasi',      'Ilmu Komunikasi',                  'Ilmu Komunikasi'),
  ('sastra-inggris',       'Sastra Inggris',                   'Sastra Inggris'),
  -- "Lainnya": pengguna mengisi nama prodinya sendiri (listings.study_program_other)
  ('lainnya',              'Lainnya',                          'Lainnya')
on conflict (slug) do nothing;

alter table public.listings
  add column if not exists study_program_other text
    check (study_program_other is null or char_length(study_program_other) between 2 and 60);

-- Isian bebas wajib bila prodi = Lainnya, dan dikosongkan bila bukan.
create or replace function public.normalize_program_other() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_slug text;
begin
  select s.slug into v_slug from public.study_programs s where s.id = new.study_program_id;
  if v_slug = 'lainnya' then
    new.study_program_other := nullif(btrim(coalesce(new.study_program_other, '')), '');
    if new.study_program_other is null then
      raise exception 'Isi nama prodi untuk pilihan Lainnya' using errcode = '23514';
    end if;
  else
    new.study_program_other := null;
  end if;
  return new;
end $$;
drop trigger if exists listings_program_other on public.listings;
create trigger listings_program_other before insert or update of study_program_id, study_program_other
  on public.listings for each row execute function public.normalize_program_other();

-- ================================================================ 2. E-BOOK PDF
do $$ begin
  create type public.book_format as enum ('fisik', 'ebook');
exception when duplicate_object then null; end $$;

alter table public.listings
  add column if not exists format      public.book_format not null default 'fisik',
  add column if not exists ebook_path  text,
  add column if not exists ebook_bytes integer check (ebook_bytes is null or ebook_bytes between 1 and 26214400);

-- E-book tidak punya "kondisi" dan tidak bisa ditukar.
alter table public.listings alter column condition drop not null;
alter table public.listings drop constraint if exists format_fields;
alter table public.listings add constraint format_fields check (
  (format = 'fisik' and condition is not null and ebook_path is null and ebook_bytes is null)
  or
  (format = 'ebook' and condition is null and ebook_path is not null and offer_type <> 'tukar')
);

-- Foto sampul e-book opsional: listing_photos sudah mengizinkan 0 foto per listing.

-- Bucket PRIVAT untuk file PDF. Tidak ada policy storage: hanya service_role (server) yang bisa
-- membaca/menulis, dan pembaca mendapat tautan bertanda tangan berumur pendek.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ebooks', 'ebooks', false, 26214400, array['application/pdf'])
on conflict (id) do update
  set public = false, file_size_limit = 26214400, allowed_mime_types = array['application/pdf'];

-- Unggahan PDF yang belum dipakai listing (dibersihkan cron bila > 2 jam).
create table if not exists public.ebook_uploads (
  path       text primary key,
  owner_id   uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.ebook_uploads enable row level security;
revoke all on public.ebook_uploads from anon, authenticated;

-- Hak baca e-book ("checkout"): satu baris per pembeli per e-book.
create table if not exists public.ebook_orders (
  id         uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  buyer_id   uuid not null references public.profiles (id) on delete cascade,
  status     text not null default 'lunas' check (status in ('menunggu', 'lunas')),
  created_at timestamptz not null default now(),
  unique (listing_id, buyer_id)
);
create index if not exists ebook_orders_by_buyer on public.ebook_orders (buyer_id);
alter table public.ebook_orders enable row level security;
revoke insert, update, delete on public.ebook_orders from anon, authenticated;
drop policy if exists orders_read_self on public.ebook_orders;
create policy orders_read_self on public.ebook_orders for select to authenticated
  using (buyer_id = auth.uid());

-- E-book baru SELALU menunggu tinjauan file + hak cipta (alur: "Tim memeriksa file dan hak cipta").
-- Admin menyetujuinya dengan "Tampilkan lagi" di panel moderasi.
create or replace function public.hold_new_ebook() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.format = 'ebook' and not (auth.role() = 'service_role' or public.is_admin()) then
    new.hidden_at := now();
    new.hidden_reason := 'menunggu_tinjauan_ebook';
  end if;
  return new;
end $$;
drop trigger if exists listings_hold_ebook on public.listings;
create trigger listings_hold_ebook before insert on public.listings
  for each row execute function public.hold_new_ebook();

-- Pemilik tidak boleh mengganti format atau file setelah disetujui (itu melewati tinjauan).
create or replace function public.protect_listing_columns() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if pg_trigger_depth() > 1 then
    return new;
  end if;
  if auth.role() = 'service_role' or public.is_admin() then
    return new;
  end if;
  if old.status = 'selesai' and new.status <> 'selesai' then
    raise exception 'Listing yang sudah selesai tidak bisa diaktifkan lagi' using errcode = '42501';
  end if;
  new.owner_id := old.owner_id;
  new.hidden_at := old.hidden_at;
  new.hidden_reason := old.hidden_reason;
  new.format := old.format;
  new.ebook_path := old.ebook_path;
  new.ebook_bytes := old.ebook_bytes;
  return new;
end $$;

-- ================================================================ 3. ULASAN + RATING
create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid not null references public.listings (id) on delete cascade,
  reviewer_id uuid not null references public.profiles (id) on delete cascade,
  rating      smallint not null check (rating between 1 and 5),
  comment     text check (comment is null or char_length(comment) between 3 and 500),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (listing_id, reviewer_id)
);
create index if not exists reviews_by_listing on public.reviews (listing_id, created_at desc);

drop trigger if exists reviews_touch on public.reviews;
create trigger reviews_touch before update on public.reviews
  for each row execute function public.touch_updated_at();

-- Siapa boleh mengulas: bukan pemilik.
--   fisik  → HANYA yang BELUM membuka kontak WhatsApp penjual (yang sudah lanjut ke WhatsApp
--            tidak membuat ulasan di sini)
--   e-book → sudah checkout (ebook_orders berstatus lunas)
create or replace function public.can_review_listing(p_listing uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.is_active_user() and exists (
    select 1 from public.listings l
    where l.id = p_listing
      and l.owner_id <> auth.uid()
      and l.hidden_at is null
      and (
        (l.format = 'ebook' and exists (
          select 1 from public.ebook_orders o
          where o.listing_id = l.id and o.buyer_id = auth.uid() and o.status = 'lunas'))
        or
        (l.format = 'fisik' and not exists (
          select 1 from public.contact_reveals c
          where c.listing_id = l.id and c.viewer_id = auth.uid()))
      )
  )
$$;
revoke execute on function public.can_review_listing(uuid) from public, anon;
grant  execute on function public.can_review_listing(uuid) to authenticated;

alter table public.reviews enable row level security;

-- Terbaca bila listing induknya terbaca (RLS listings berlaku di subquery)
create policy reviews_read on public.reviews for select using (
  exists (select 1 from public.listings l where l.id = listing_id)
);
create policy reviews_insert on public.reviews for insert to authenticated
  with check (reviewer_id = auth.uid() and public.can_review_listing(listing_id));
create policy reviews_update_own on public.reviews for update to authenticated
  using (reviewer_id = auth.uid() and public.is_active_user())
  with check (reviewer_id = auth.uid() and public.can_review_listing(listing_id));
create policy reviews_delete on public.reviews for delete to authenticated
  using (reviewer_id = auth.uid() or public.is_admin());
