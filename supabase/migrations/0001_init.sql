-- thriftbook. — skema awal + RLS
-- Rujukan: docs/PRD-thriftbook.md §4 (model data) dan §7.3 (RLS)
-- STATUS: belum dijalankan terhadap database sungguhan. Jalankan di proyek Supabase
-- baru, lalu jalankan test RLS (SEC-12) sebelum dipakai.

create extension if not exists pg_trgm with schema extensions;
create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------- enum
create type public.offer_type     as enum ('jual', 'hibah', 'tukar');
create type public.book_condition as enum ('seperti_baru', 'baik', 'layak', 'banyak_coretan');
create type public.listing_status as enum ('aktif', 'dipesan', 'selesai', 'kedaluwarsa');
create type public.request_status as enum ('terbuka', 'terpenuhi', 'ditutup', 'kedaluwarsa');
create type public.report_reason  as enum ('bajakan', 'penipuan', 'palsu', 'nomor_salah', 'spam', 'tidak_pantas', 'lainnya');
create type public.report_status  as enum ('baru', 'ditindak', 'ditolak');
create type public.user_role      as enum ('user', 'admin');
create type public.done_via       as enum ('thriftbook', 'lainnya', 'tidak_dijawab');

-- ---------------------------------------------------------------- master
create table public.study_programs (
  id          smallint generated always as identity primary key,
  slug        text not null unique,
  name        text not null,
  short_name  text not null,
  faculty     text,
  is_active   boolean not null default true
);

create table public.profiles (
  id               uuid primary key references auth.users (id) on delete cascade,
  display_name     text not null check (char_length(display_name) between 2 and 40),
  study_program_id smallint references public.study_programs (id),
  cohort_year      smallint check (cohort_year between 2015 and 2100),
  is_staff         boolean not null default false,
  role             public.user_role not null default 'user',
  banned_at        timestamptz,
  ban_reason       text,
  consented_at     timestamptz,
  consent_version  text,
  created_at       timestamptz not null default now()
);

-- Dipisah dari profiles karena RLS bekerja per baris, bukan per kolom.
create table public.profile_contacts (
  profile_id    uuid primary key references public.profiles (id) on delete cascade,
  whatsapp_e164 text not null check (whatsapp_e164 ~ '^628[1-9][0-9]{7,10}$'),
  hidden        boolean not null default false,  -- SEC-24
  updated_at    timestamptz not null default now()
);

create table public.courses (
  id          bigint generated always as identity primary key,
  name        text not null check (char_length(name) between 2 and 80),
  name_norm   text generated always as (
                btrim(regexp_replace(lower(name), '[^a-z0-9]+', ' ', 'g'))
              ) stored,
  created_by  uuid references public.profiles (id) on delete set null,
  merged_into bigint references public.courses (id),
  created_at  timestamptz not null default now(),
  unique (name_norm)
);

-- ---------------------------------------------------------------- listing
create table public.listings (
  id                     uuid primary key default gen_random_uuid(),
  owner_id               uuid not null references public.profiles (id) on delete cascade,
  title                  text not null check (char_length(title) between 3 and 120),
  author                 text check (char_length(author) <= 80),
  course_id              bigint not null references public.courses (id),
  course_name_snapshot   text not null default '',
  study_program_id       smallint not null references public.study_programs (id),
  semester               smallint check (semester between 1 and 8),
  condition              public.book_condition not null,
  offer_type             public.offer_type not null,
  price                  integer,
  swap_wish              text check (char_length(swap_wish) between 3 and 200),
  notes                  text check (char_length(notes) <= 500),
  status                 public.listing_status not null default 'aktif',
  done_via               public.done_via,
  authenticity_confirmed boolean not null check (authenticity_confirmed),
  hidden_at              timestamptz,
  hidden_reason          text,
  search_text            text generated always as (
                           lower(title || ' ' || coalesce(author, '') || ' ' || course_name_snapshot)
                         ) stored,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  bumped_at              timestamptz not null default now(),
  constraint price_matches_type check (
    (offer_type = 'jual') = (price is not null)
  ),
  constraint price_range check (price is null or price between 1000 and 1000000),
  constraint swap_wish_required check (
    offer_type <> 'tukar' or swap_wish is not null
  )
);

create table public.listing_photos (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid references public.listings (id) on delete cascade,
  owner_id    uuid not null references public.profiles (id) on delete cascade,
  position    smallint not null default 0 check (position between 0 and 2),
  path_full   text not null,
  path_thumb  text not null,
  width       smallint,
  height      smallint,
  bytes_full  integer,
  bytes_thumb integer,
  created_at  timestamptz not null default now()
);
-- listing_id boleh null sementara (foto diunggah sebelum listing terbit, SEC-55)
create unique index listing_photos_pos_uniq on public.listing_photos (listing_id, position)
  where listing_id is not null;

create table public.book_requests (
  id               uuid primary key default gen_random_uuid(),
  requester_id     uuid not null references public.profiles (id) on delete cascade,
  title            text not null check (char_length(title) between 3 and 120),
  course_id        bigint not null references public.courses (id),
  course_name_snapshot text not null default '',
  study_program_id smallint references public.study_programs (id),
  semester         smallint check (semester between 1 and 8),
  accepts          public.offer_type[] not null check (cardinality(accepts) >= 1),
  max_budget       integer check (max_budget is null or max_budget between 1000 and 1000000),
  notes            text check (char_length(notes) <= 300),
  status           public.request_status not null default 'terbuka',
  fulfilled_via    public.done_via,
  expires_at       timestamptz not null default now() + interval '30 days',
  hidden_at        timestamptz,
  hidden_reason    text,
  search_text      text generated always as (
                     lower(title || ' ' || course_name_snapshot)
                   ) stored,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ---------------------------------------------------------------- jejak & moderasi
create table public.contact_reveals (
  id         bigint generated always as identity primary key,
  viewer_id  uuid not null references public.profiles (id) on delete cascade,
  listing_id uuid references public.listings (id) on delete cascade,
  request_id uuid references public.book_requests (id) on delete cascade,
  created_at timestamptz not null default now(),
  check ((listing_id is not null) <> (request_id is not null))
);

create table public.reports (
  id                bigint generated always as identity primary key,
  reporter_id       uuid references public.profiles (id) on delete set null,
  target_listing_id uuid references public.listings (id) on delete cascade,
  target_request_id uuid references public.book_requests (id) on delete cascade,
  target_profile_id uuid references public.profiles (id) on delete cascade,
  reason            public.report_reason not null,
  note              text check (char_length(note) <= 500),
  status            public.report_status not null default 'baru',
  created_at        timestamptz not null default now(),
  resolved_at       timestamptz,
  check (num_nonnulls(target_listing_id, target_request_id, target_profile_id) = 1)
);
-- UNIQUE biasa tidak bekerja dengan kolom NULL, jadi pakai indeks parsial per jenis target.
create unique index reports_once_listing on public.reports (reporter_id, target_listing_id) where target_listing_id is not null;
create unique index reports_once_request on public.reports (reporter_id, target_request_id) where target_request_id is not null;
create unique index reports_once_profile on public.reports (reporter_id, target_profile_id) where target_profile_id is not null;

create table public.moderation_actions (
  id         bigint generated always as identity primary key,
  admin_id   uuid references public.profiles (id) on delete set null,
  action     text not null,
  target_id  text not null,
  reason     text not null check (char_length(reason) >= 5),
  created_at timestamptz not null default now()
);

create table public.banned_emails (
  email_sha256 text primary key,
  created_at   timestamptz not null default now()
);

create table public.rate_limit_hits (
  key    text not null,
  hit_at timestamptz not null default now()
);

create table public.events (
  id         bigint generated always as identity primary key,
  name       text not null,
  user_id    uuid references public.profiles (id) on delete cascade,
  props      jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.storage_deletion_queue (
  path        text primary key,
  enqueued_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- indeks (PRD §4.4)
create index listings_trgm       on public.listings      using gin (search_text extensions.gin_trgm_ops);
create index requests_trgm       on public.book_requests using gin (search_text extensions.gin_trgm_ops);
create index courses_trgm        on public.courses       using gin (name_norm extensions.gin_trgm_ops);
create index listings_recent     on public.listings (status, created_at desc) where hidden_at is null;
create index listings_by_prodi   on public.listings (study_program_id, status, created_at desc) where hidden_at is null;
create index listings_cheapest   on public.listings (status, price) where offer_type = 'jual' and hidden_at is null;
create index listings_by_owner   on public.listings (owner_id, status);
create index listings_by_course  on public.listings (course_id);
create index requests_recent     on public.book_requests (status, created_at desc);
create index reveals_by_viewer   on public.contact_reveals (viewer_id, created_at);
create index reports_queue       on public.reports (status, created_at);
create index rate_hits           on public.rate_limit_hits (key, hit_at);
create index events_by_name      on public.events (name, created_at);

-- ---------------------------------------------------------------- fungsi bantu
create function public.is_active_user() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.banned_at is null)
$$;

create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin' and p.banned_at is null
  )
$$;

create function public.is_user_banned(uid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select p.banned_at is not null from public.profiles p where p.id = uid), true)
$$;

-- Allowlist domain di sisi database (SEC-02 lapisan 2). SAMA dengan ALLOWED_EMAIL_DOMAINS
-- di env; ubah keduanya bersamaan. Cocok persis, bukan endsWith.
create function public.is_allowed_email(addr text) returns boolean
language sql immutable set search_path = '' as $$
  select lower(split_part(addr, '@', 2)) = any (array['students.um.ac.id', 'um.ac.id'])
     and addr like '_%@_%'
$$;

create function public.enforce_email_domain() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_allowed_email(new.email) then
    raise exception 'Email di luar domain yang diizinkan' using errcode = '42501';
  end if;
  return new;
end $$;

create trigger auth_users_domain_check
  before insert or update of email on auth.users
  for each row execute function public.enforce_email_domain();
-- Catatan: pengecekan banned_emails (SEC-34) dilakukan di /auth/callback karena
-- pepper hash hanya ada di server aplikasi, bukan di database.

-- ---------------------------------------------------------------- trigger integritas
create function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;

create trigger listings_touch before update on public.listings
  for each row execute function public.touch_updated_at();
create trigger requests_touch before update on public.book_requests
  for each row execute function public.touch_updated_at();

-- Salin nama MK ke listing/permintaan (untuk kolom search_text generated)
create function public.snapshot_course_name() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  select c.name into new.course_name_snapshot from public.courses c where c.id = new.course_id;
  return new;
end $$;
create trigger listings_course_snapshot before insert or update of course_id on public.listings
  for each row execute function public.snapshot_course_name();
create trigger requests_course_snapshot before insert or update of course_id on public.book_requests
  for each row execute function public.snapshot_course_name();

-- profiles: role/ban/is_staff tidak boleh disentuh pengguna biasa (SEC-11)
create function public.protect_profile_columns() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_email text;
begin
  if tg_op = 'INSERT' then
    select email into v_email from auth.users where id = new.id;
    new.role := 'user';
    new.banned_at := null;
    new.ban_reason := null;
    new.is_staff := lower(split_part(coalesce(v_email, ''), '@', 2)) = 'um.ac.id';
    return new;
  end if;
  if auth.role() = 'service_role' or public.is_admin() then
    return new;
  end if;
  new.role := old.role;
  new.banned_at := old.banned_at;
  new.ban_reason := old.ban_reason;
  new.is_staff := old.is_staff;
  return new;
end $$;
create trigger profiles_protect before insert or update on public.profiles
  for each row execute function public.protect_profile_columns();

-- listings/book_requests: pemilik tidak boleh ubah kolom moderasi atau pemilik
create function public.protect_listing_columns() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.role() = 'service_role' or public.is_admin() then
    return new;
  end if;
  if old.status = 'selesai' and new.status <> 'selesai' then
    raise exception 'Listing yang sudah selesai tidak bisa diaktifkan lagi' using errcode = '42501';
  end if;
  new.owner_id := old.owner_id;
  new.hidden_at := old.hidden_at;
  new.hidden_reason := old.hidden_reason;
  return new;
end $$;
create trigger listings_protect before update on public.listings
  for each row execute function public.protect_listing_columns();

create function public.protect_request_columns() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.role() = 'service_role' or public.is_admin() then
    return new;
  end if;
  new.requester_id := old.requester_id;
  new.hidden_at := old.hidden_at;
  new.hidden_reason := old.hidden_reason;
  return new;
end $$;
create trigger requests_protect before update on public.book_requests
  for each row execute function public.protect_request_columns();

-- Batas listing per pengguna (AC-04.6, AC-04.7) + batas akun baru (SEC-04)
create function public.enforce_listing_quota() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_day int; v_open int; v_age interval;
begin
  select count(*) into v_day from public.listings
    where owner_id = new.owner_id and created_at > now() - interval '24 hours';
  select count(*) into v_open from public.listings
    where owner_id = new.owner_id and status in ('aktif', 'dipesan');
  select now() - u.created_at into v_age from auth.users u where u.id = new.owner_id;

  if v_age < interval '24 hours' and v_day >= 3 then
    raise exception 'Akun baru dibatasi 3 listing di hari pertama' using errcode = '54000';
  end if;
  if v_day >= 10 then
    raise exception 'Batas 10 listing per hari' using errcode = '54000';
  end if;
  if v_open >= 40 then
    raise exception 'Batas 40 listing aktif' using errcode = '54000';
  end if;
  return new;
end $$;
create trigger listings_quota before insert on public.listings
  for each row execute function public.enforce_listing_quota();

-- Auto-hide setelah 3 pelapor berbeda (AC-14.3)
create function public.autohide_on_reports() returns trigger
language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  if new.target_listing_id is not null then
    select count(distinct reporter_id) into n from public.reports
      where target_listing_id = new.target_listing_id and status = 'baru';
    if n >= 3 then
      update public.listings
        set hidden_at = coalesce(hidden_at, now()), hidden_reason = coalesce(hidden_reason, 'auto_3_reports')
        where id = new.target_listing_id;
    end if;
  end if;
  return new;
end $$;
create trigger reports_autohide after insert on public.reports
  for each row execute function public.autohide_on_reports();

-- ---------------------------------------------------------------- RPC: buka kontak WA
-- Semua aturan SEC-21 ada di sini, satu transaksi, tanpa service_role.
create function public.reveal_listing_contact(p_listing_id uuid)
returns table (title text, whatsapp text)
language plpgsql security definer set search_path = '' as $$
declare
  v_uid     uuid := auth.uid();
  v_owner   uuid;
  v_title   text;
  v_wa      text;
  v_hidden  boolean;
  v_minute  int;
  v_unique  int;
  v_seen    boolean;
  v_age     interval;
begin
  if v_uid is null then
    raise exception 'unauthenticated' using errcode = '28000';
  end if;
  if not public.is_active_user() then
    raise exception 'banned' using errcode = '42501';
  end if;

  select l.owner_id, l.title into v_owner, v_title
    from public.listings l
    where l.id = p_listing_id and l.status = 'aktif' and l.hidden_at is null;
  if v_owner is null or public.is_user_banned(v_owner) then
    raise exception 'unavailable' using errcode = 'P0002';
  end if;
  if v_owner = v_uid then
    raise exception 'own_listing' using errcode = '22023';
  end if;

  select count(*) into v_minute from public.contact_reveals
    where viewer_id = v_uid and created_at > now() - interval '1 minute';
  if v_minute >= 5 then
    raise exception 'rate_limited' using errcode = '54000';
  end if;

  select exists (
    select 1 from public.contact_reveals
    where viewer_id = v_uid and listing_id = p_listing_id
      and created_at > now() - interval '24 hours'
  ) into v_seen;

  if not v_seen then
    select count(distinct coalesce(listing_id::text, request_id::text)) into v_unique
      from public.contact_reveals
      where viewer_id = v_uid and created_at > now() - interval '24 hours';
    select now() - u.created_at into v_age from auth.users u where u.id = v_uid;
    if v_unique >= 30 or (v_age < interval '24 hours' and v_unique >= 10) then
      raise exception 'daily_limit' using errcode = '54000';
    end if;
  end if;

  select pc.whatsapp_e164, pc.hidden into v_wa, v_hidden
    from public.profile_contacts pc where pc.profile_id = v_owner;
  if v_wa is null or v_hidden then
    raise exception 'unavailable' using errcode = 'P0002';
  end if;

  insert into public.contact_reveals (viewer_id, listing_id) values (v_uid, p_listing_id);
  insert into public.events (name, user_id, props)
    values ('contact_revealed', v_uid, jsonb_build_object('listing_id', p_listing_id));

  return query select v_title, v_wa;
end $$;

revoke execute on function public.reveal_listing_contact(uuid) from public, anon;
grant  execute on function public.reveal_listing_contact(uuid) to authenticated;

-- ---------------------------------------------------------------- view publik
-- Berjalan sebagai pemilik view (bypass RLS tabel dasar) — sengaja, hanya kolom aman.
create view public.public_profiles as
  select p.id, p.display_name, p.study_program_id, p.cohort_year, p.is_staff
  from public.profiles p
  where p.banned_at is null;
grant select on public.public_profiles to anon, authenticated;

-- ---------------------------------------------------------------- RLS
alter table public.study_programs        enable row level security;
alter table public.profiles              enable row level security;
alter table public.profile_contacts      enable row level security;
alter table public.courses               enable row level security;
alter table public.listings              enable row level security;
alter table public.listing_photos        enable row level security;
alter table public.book_requests         enable row level security;
alter table public.contact_reveals       enable row level security;
alter table public.reports               enable row level security;
alter table public.moderation_actions    enable row level security;
alter table public.banned_emails         enable row level security;
alter table public.rate_limit_hits       enable row level security;
alter table public.events                enable row level security;
alter table public.storage_deletion_queue enable row level security;

-- Tabel yang tidak boleh disentuh klien sama sekali
revoke all on public.banned_emails, public.rate_limit_hits, public.storage_deletion_queue
  from anon, authenticated;
revoke all on public.profile_contacts from anon;

-- study_programs
create policy study_programs_read on public.study_programs for select using (true);

-- profiles (tabel dasar: hanya diri sendiri + admin; publik lewat public_profiles)
create policy profiles_read_self  on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());
create policy profiles_insert_self on public.profiles for insert to authenticated
  with check (id = auth.uid());
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- profile_contacts: hanya pemilik. Orang lain lewat reveal_listing_contact().
create policy contacts_self_all on public.profile_contacts for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid() and public.is_active_user());

-- courses
create policy courses_read   on public.courses for select using (true);
create policy courses_insert on public.courses for insert to authenticated
  with check (created_by = auth.uid() and public.is_active_user());
create policy courses_admin_update on public.courses for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- listings
create policy listings_read on public.listings for select using (
  (
    hidden_at is null
    and status in ('aktif', 'dipesan', 'selesai')
    and not public.is_user_banned(owner_id)
  )
  or owner_id = auth.uid()
  or public.is_admin()
);
create policy listings_insert on public.listings for insert to authenticated
  with check (owner_id = auth.uid() and public.is_active_user());
create policy listings_update_owner on public.listings for update to authenticated
  using (owner_id = auth.uid() and public.is_active_user() and hidden_at is null)
  with check (owner_id = auth.uid());
create policy listings_update_admin on public.listings for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy listings_delete on public.listings for delete to authenticated
  using (owner_id = auth.uid() or public.is_admin());

-- listing_photos: baca jika listing induknya terbaca; tulis hanya lewat route server (service_role)
create policy photos_read on public.listing_photos for select using (
  (listing_id is not null and exists (select 1 from public.listings l where l.id = listing_id))
  or owner_id = auth.uid()
);
create policy photos_delete_owner on public.listing_photos for delete to authenticated
  using (owner_id = auth.uid());

-- book_requests
create policy requests_read on public.book_requests for select using (
  (hidden_at is null and status = 'terbuka' and not public.is_user_banned(requester_id))
  or requester_id = auth.uid()
  or public.is_admin()
);
create policy requests_insert on public.book_requests for insert to authenticated
  with check (requester_id = auth.uid() and public.is_active_user());
create policy requests_update on public.book_requests for update to authenticated
  using ((requester_id = auth.uid() and public.is_active_user()) or public.is_admin())
  with check (requester_id = auth.uid() or public.is_admin());
create policy requests_delete on public.book_requests for delete to authenticated
  using (requester_id = auth.uid() or public.is_admin());

-- contact_reveals: pengguna hanya bisa membaca miliknya (untuk ekspor); tulis lewat RPC
create policy reveals_read_self on public.contact_reveals for select to authenticated
  using (viewer_id = auth.uid());

-- reports: pelapor hanya boleh menulis (tidak bisa membaca ulang), admin membaca/mengubah
create policy reports_insert on public.reports for insert to authenticated
  with check (reporter_id = auth.uid() and public.is_active_user());
create policy reports_admin_read on public.reports for select to authenticated
  using (public.is_admin());
create policy reports_admin_update on public.reports for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- moderation_actions: append-only (tidak ada policy update/delete)
create policy modlog_read   on public.moderation_actions for select to authenticated
  using (public.is_admin());
create policy modlog_insert on public.moderation_actions for insert to authenticated
  with check (public.is_admin() and admin_id = auth.uid());

-- events: hanya admin yang membaca; penulisan lewat fungsi security definer / service_role
create policy events_admin_read on public.events for select to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------- seed
-- HANYA 4 prodi yang tampil di mockup slide. Daftar lengkap harus diambil dari
-- sumber resmi UM (tugas non-developer, PRD minggu 2) — jangan dikarang.
insert into public.study_programs (slug, name, short_name) values
  -- Nama = singkatan dari mockup; ganti dengan nama resmi saat daftar lengkap tersedia.
  ('pend-informatika', 'Pend. Informatika', 'Pend. Informatika'),
  ('tek-pendidikan',   'Tek. Pendidikan',   'Tek. Pendidikan'),
  ('seni-pertunjukan', 'Seni Pertunjukan',  'Seni Pertunjukan'),
  ('pgsd',             'PGSD',              'PGSD');
