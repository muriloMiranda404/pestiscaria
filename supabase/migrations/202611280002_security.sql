-- Cotas de requisições compartilhadas entre instâncias e armazenamento da galeria.
create table if not exists public.rate_limit_buckets (
  key text primary key check (length(key) between 1 and 180),
  hits integer not null check (hits > 0),
  expires_at timestamptz not null
);
create index if not exists rate_limit_buckets_expiry on public.rate_limit_buckets (expires_at);
alter table public.rate_limit_buckets enable row level security;
revoke all on public.rate_limit_buckets from anon, authenticated;

create or replace function public.consume_rate_limit(p_key text, p_limit integer, p_window integer)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  current_hits integer;
  current_time timestamptz := clock_timestamp();
begin
  if coalesce(auth.role(), '') <> 'service_role' and not public.is_admin() then
    raise insufficient_privilege;
  end if;
  if length(p_key) not between 1 and 180 or p_limit not between 1 and 100000 or p_window not between 1 and 86400 then
    raise exception 'Invalid quota' using errcode = '22023';
  end if;
  delete from public.rate_limit_buckets where expires_at < current_time - interval '1 day';
  insert into public.rate_limit_buckets as bucket(key, hits, expires_at)
    values (p_key, 1, current_time + make_interval(secs => p_window))
  on conflict (key) do update set
    hits = case when bucket.expires_at <= current_time then 1 else least(bucket.hits + 1, 100001) end,
    expires_at = case when bucket.expires_at <= current_time then current_time + make_interval(secs => p_window) else bucket.expires_at end
  returning hits into current_hits;
  return current_hits <= p_limit;
end;
$$;
revoke all on function public.consume_rate_limit(text,integer,integer) from public;
grant execute on function public.consume_rate_limit(text,integer,integer) to authenticated, service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('restaurant-media', 'restaurant-media', true, 8388608, array['image/webp'])
on conflict (id) do update set public = true, file_size_limit = 8388608, allowed_mime_types = array['image/webp'];

create policy "Public restaurant images" on storage.objects for select to anon, authenticated
using (bucket_id = 'restaurant-media');
create policy "Admin image upload" on storage.objects for insert to authenticated
with check (bucket_id = 'restaurant-media' and public.is_admin() and name ~ '^[a-f0-9]{8}-([a-f0-9]{4}-){3}[a-f0-9]{12}\.webp$');
create policy "Admin image removal" on storage.objects for delete to authenticated
using (bucket_id = 'restaurant-media' and public.is_admin());
