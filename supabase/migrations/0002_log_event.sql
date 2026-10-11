-- Pencatatan event metrik (FR-23). Klien tidak punya policy INSERT di tabel events,
-- jadi penulisan lewat fungsi ini. Nama event dibatasi whitelist agar tidak bisa dipakai
-- untuk mengotori data metrik.
create function public.log_event(p_name text, p_props jsonb default '{}'::jsonb)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  if p_name not in (
    'signup_completed', 'listing_created', 'listing_status_changed',
    'request_created', 'request_status_changed', 'report_created'
  ) then
    raise exception 'event tidak dikenal' using errcode = '22023';
  end if;
  insert into public.events (name, user_id, props)
  values (p_name, auth.uid(), coalesce(p_props, '{}'::jsonb));
end $$;

revoke execute on function public.log_event(text, jsonb) from public, anon;
grant  execute on function public.log_event(text, jsonb) to authenticated;
