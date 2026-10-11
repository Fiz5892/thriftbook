-- Perbaikan: auto-hide setelah 3 laporan (AC-14.3) tidak pernah bekerja.
--
-- Penyebab: trigger autohide_on_reports meng-UPDATE listings.hidden_at, lalu trigger
-- protect_listing_columns (BEFORE UPDATE) melihat pemanggilnya bukan admin/service_role dan
-- mengembalikan hidden_at ke nilai lama. Ditemukan lewat uji end-to-end.
--
-- Perbaikan: UPDATE yang dilakukan oleh trigger lain berjalan pada kedalaman trigger > 1,
-- sedangkan UPDATE langsung dari pengguna selalu kedalaman 1. Jadi proteksi kolom tetap
-- berlaku penuh untuk pengguna, tetapi tidak menghalangi trigger sistem.
--
-- Aplikasi punya fallback di server action createReport, jadi fitur tetap berjalan sebelum
-- migrasi ini dijalankan; migrasi ini menutup jalur insert laporan langsung via REST.

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
  return new;
end $$;

create or replace function public.protect_request_columns() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if pg_trigger_depth() > 1 then
    return new;
  end if;
  if auth.role() = 'service_role' or public.is_admin() then
    return new;
  end if;
  new.requester_id := old.requester_id;
  new.hidden_at := old.hidden_at;
  new.hidden_reason := old.hidden_reason;
  return new;
end $$;

-- Hitung juga laporan untuk Dicari (sebelumnya hanya listing)
create or replace function public.autohide_on_reports() returns trigger
language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  if new.target_listing_id is not null then
    select count(distinct reporter_id) into n from public.reports
      where target_listing_id = new.target_listing_id and status = 'baru' and reporter_id is not null;
    if n >= 3 then
      update public.listings
        set hidden_at = coalesce(hidden_at, now()),
            hidden_reason = coalesce(hidden_reason, 'auto_3_reports')
        where id = new.target_listing_id;
    end if;
  elsif new.target_request_id is not null then
    select count(distinct reporter_id) into n from public.reports
      where target_request_id = new.target_request_id and status = 'baru' and reporter_id is not null;
    if n >= 3 then
      update public.book_requests
        set hidden_at = coalesce(hidden_at, now()),
            hidden_reason = coalesce(hidden_reason, 'auto_3_reports')
        where id = new.target_request_id;
    end if;
  end if;
  return new;
end $$;
