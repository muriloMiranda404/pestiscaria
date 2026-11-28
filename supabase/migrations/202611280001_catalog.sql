-- Lucrécio. Apply through Supabase migrations or the privileged SQL editor.
begin;
create extension if not exists pgcrypto;
create type public.publication_status as enum ('draft','published','archived');
create type public.reservation_state as enum ('pending','confirmed','declined','cancelled','completed');

create table public.admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.admin_profiles enable row level security;
create policy own_admin_profile on public.admin_profiles for select to authenticated using (id=auth.uid());
create function public.is_admin() returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.admin_profiles where id=auth.uid());
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon,authenticated,service_role;

create function public.valid_photo(photo jsonb) returns boolean language sql immutable set search_path='' as $$
  select photo is null or (
    jsonb_typeof(photo)='object' and jsonb_typeof(photo->'src')='string' and jsonb_typeof(photo->'alt')='string'
    and length(photo->>'src') between 1 and 700 and length(btrim(photo->>'alt')) between 1 and 240
    and jsonb_typeof(photo->'illustrative')='boolean'
    and (photo->>'src') ~ '^(https://[^[:space:]<>]+|/images/[a-zA-Z0-9/_-]+[.](avif|webp|jpeg|jpg|png)|/api/media/[a-f0-9-]{36}[.]webp)$'
  );
$$;

create function public.valid_settings(config jsonb) returns boolean language plpgsql immutable set search_path='' as $$
declare key text; value jsonb; entry jsonb;
begin
  if config is null or jsonb_typeof(config)<>'object' then return false; end if;
  if config='{}'::jsonb then return true; end if;
  foreach key in array array['whatsapp_confirmed','show_cnpj','orders_enabled','reservations_enabled','analytics_enabled','pickup_enabled','delivery_enabled','maintenance'] loop
    if jsonb_typeof(config->key) is distinct from 'boolean' then return false; end if;
  end loop;
  foreach key in array array['name','logo','primary_color','accent_color','phone','whatsapp','instagram','street','district','city','state','postal_code','reference','maps_url','about','announcement','seo_title','seo_description','cnpj'] loop
    if jsonb_typeof(config->key) is distinct from 'string' or length(config->>key)>6000 then return false; end if;
  end loop;
  if length(btrim(config->>'name')) not between 1 and 150 or config->>'primary_color' !~ '^#[a-fA-F0-9]{6}$' or config->>'accent_color' !~ '^#[a-fA-F0-9]{6}$' then return false; end if;
  if (config->>'whatsapp_confirmed')::boolean and length(config->>'whatsapp')<10 then return false; end if;
  if (config->>'orders_enabled')::boolean and not (config->>'whatsapp_confirmed')::boolean then return false; end if;
  if config->>'instagram'<>'' and config->>'instagram' !~ '^https://(www[.])?instagram[.]com(/|$)' then return false; end if;
  if config->>'maps_url'<>'' and config->>'maps_url' !~ '^https://(maps[.]app[.]goo[.]gl/|maps[.]google[.]com/|(www[.])?google[.]com([.]br)?/maps)' then return false; end if;
  foreach key in array array['hours','special_hours'] loop
    value=config->key;
    if jsonb_typeof(value) is distinct from 'array' or jsonb_array_length(value)>370 then return false; end if;
    for entry in select * from jsonb_array_elements(value) loop
      if jsonb_typeof(entry)<>'object' or jsonb_typeof(entry->'opens') is distinct from 'string' or jsonb_typeof(entry->'closes') is distinct from 'string' then return false; end if;
      if key='hours' then
        if (entry->>'day') !~ '^[0-6]$' or entry->>'opens' !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' or entry->>'closes' !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' or entry->>'opens'=entry->>'closes' then return false; end if;
      else
        if entry->>'date' !~ '^\d{4}-\d{2}-\d{2}$' or jsonb_typeof(entry->'label') is distinct from 'string' then return false; end if;
        if entry->>'opens'<>'' or entry->>'closes'<>'' then
          if entry->>'opens' !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' or entry->>'closes' !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' or entry->>'opens'=entry->>'closes' then return false; end if;
        end if;
      end if;
    end loop;
  end loop;
  return true;
exception when others then return false;
end;
$$;

create table public.restaurant_settings (
  id integer primary key default 1 check (id=1),
  config jsonb not null default '{}'::jsonb check(public.valid_settings(config)),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
insert into public.restaurant_settings(id) values(1);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check(length(btrim(name)) between 1 and 120),
  slug text not null unique check(length(slug)<=100 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  status public.publication_status not null default 'draft', position integer not null default 0 check(position between 0 and 1000000),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null check(length(btrim(name)) between 1 and 160),
  slug text not null unique check(length(slug)<=100 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  category_id uuid not null references public.categories(id) on delete restrict,
  description text not null default '' check(length(description)<=4000), image jsonb check(public.valid_photo(image)),
  price_cents integer check(price_cents between 0 and 99999999),
  ingredients text not null default '' check(length(ingredients)<=2000), allergens text not null default '' check(length(allergens)<=2000),
  serves text not null default '' check(length(serves)<=120), available boolean not null default true, featured boolean not null default false,
  status public.publication_status not null default 'draft', position integer not null default 0 check(position between 0 and 1000000),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.menu_item_images (
  id uuid primary key default gen_random_uuid(), menu_item_id uuid not null references public.menu_items(id) on delete cascade,
  photo jsonb not null check(public.valid_photo(photo)), position integer not null default 0 check(position>=0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(menu_item_id,position)
);
create table public.menu_item_variants (
  id uuid primary key default gen_random_uuid(), menu_item_id uuid not null references public.menu_items(id) on delete cascade,
  name text not null check(length(btrim(name)) between 1 and 100), price_cents integer not null check(price_cents between 0 and 99999999),
  position integer not null default 0 check(position>=0), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(menu_item_id,position)
);
create table public.menu_item_addons (
  id uuid primary key default gen_random_uuid(), menu_item_id uuid not null references public.menu_items(id) on delete cascade,
  name text not null check(length(btrim(name)) between 1 and 100), price_cents integer not null check(price_cents between 0 and 99999999),
  position integer not null default 0 check(position>=0), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(menu_item_id,position)
);
create table public.events (
  id uuid primary key default gen_random_uuid(), title text not null check(length(btrim(title)) between 1 and 160),
  slug text not null unique check(length(slug)<=100 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text not null default '' check(length(description)<=6000), image jsonb check(public.valid_photo(image)),
  starts_at timestamptz not null, ends_at timestamptz, artist text not null default '' check(length(artist)<=200),
  fee_cents integer check(fee_cents between 0 and 99999999), notes text not null default '' check(length(notes)<=2000),
  featured boolean not null default false, status public.publication_status not null default 'draft', position integer not null default 0 check(position between 0 and 1000000),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check(ends_at is null or ends_at>starts_at)
);
create table public.promotions (
  id uuid primary key default gen_random_uuid(), title text not null check(length(btrim(title)) between 1 and 160),
  product_id uuid not null references public.menu_items(id) on delete restrict,
  price_cents integer not null check(price_cents between 0 and 99999999), starts_at timestamptz not null, ends_at timestamptz not null,
  image jsonb check(public.valid_photo(image)), featured boolean not null default false,
  status public.publication_status not null default 'draft', position integer not null default 0 check(position between 0 and 1000000),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check(ends_at>starts_at)
);
create table public.gallery_images (
  id uuid primary key default gen_random_uuid(), image jsonb not null check(public.valid_photo(image)),
  category text not null check(length(btrim(category)) between 1 and 100), instagram_url text not null default '' check(instagram_url='' or instagram_url ~ '^https://(www[.])?instagram[.]com/'),
  status public.publication_status not null default 'draft', position integer not null default 0 check(position between 0 and 1000000),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.qr_codes (
  id uuid primary key default gen_random_uuid(), label text not null check(length(btrim(label)) between 1 and 80),
  table_code text not null default '' check(table_code ~ '^[a-zA-Z0-9_-]{0,32}$'), template text not null check(template in ('classico','terracota')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.analytics_events (
  id uuid primary key default gen_random_uuid(), kind text not null check(kind in ('menu','product','category','contact','directions','qr','reservation')),
  subject text not null default '' check(length(subject)<=100), campaign text not null default '' check(length(campaign)<=80),
  created_at timestamptz not null default now()
);
create table public.reservation_requests (
  id uuid primary key default gen_random_uuid(), date date not null, time time not null, people integer not null check(people between 1 and 100),
  name text not null check(length(btrim(name)) between 1 and 100), phone text not null check(length(phone) between 10 and 24),
  notes text not null default '' check(length(notes)<=500), status public.reservation_state not null default 'pending',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
-- Requests forwarded to WhatsApp remain client-side until an acceptance workflow exists.
-- No customer/order data are silently collected by this first version.
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(), actor_id uuid references auth.users(id) on delete set null,
  table_name text not null, record_id text not null, operation text not null,
  changed_fields text[] not null default '{}', created_at timestamptz not null default now()
);

create index categories_public_order on public.categories(status,position);
create index menu_items_category_order on public.menu_items(category_id,status,position);
create index events_published_date on public.events(status,starts_at);
create index promotions_period on public.promotions(status,starts_at,ends_at);
create index promotions_product on public.promotions(product_id);
create index gallery_public_order on public.gallery_images(status,position);
create index metrics_period_kind on public.analytics_events(created_at,kind);
create index reservations_period on public.reservation_requests(created_at);
create index reservation_date on public.reservation_requests(date,status);
create index audit_period on public.audit_logs(created_at);

create function public.touch_updated_at() returns trigger language plpgsql set search_path='' as $$
begin new.updated_at=now(); return new; end;
$$;
create function public.audit_change() returns trigger language plpgsql security definer set search_path='' as $$
declare previous jsonb; current_row jsonb; fields text[];
begin
  previous=case when tg_op='INSERT' then '{}'::jsonb else to_jsonb(old) end;
  current_row=case when tg_op='DELETE' then '{}'::jsonb else to_jsonb(new) end;
  select coalesce(array_agg(key),array[]::text[]) into fields from jsonb_object_keys(previous || current_row) as key
    where previous->key is distinct from current_row->key and key<>'updated_at';
  insert into public.audit_logs(actor_id,table_name,record_id,operation,changed_fields)
    values(auth.uid(),tg_table_name,coalesce(current_row->>'id',previous->>'id'),tg_op,fields);
  return case when tg_op='DELETE' then old else new end;
end;
$$;

do $$ declare name text; begin
  foreach name in array array['admin_profiles','restaurant_settings','categories','menu_items','menu_item_images','menu_item_variants','menu_item_addons','events','promotions','gallery_images','qr_codes','reservation_requests'] loop
    execute format('create trigger touch_timestamp before update on public.%I for each row execute function public.touch_updated_at()',name);
    execute format('create trigger log_change after insert or update or delete on public.%I for each row execute function public.audit_change()',name);
  end loop;
  foreach name in array array['restaurant_settings','categories','menu_items','menu_item_images','menu_item_variants','menu_item_addons','events','promotions','gallery_images','qr_codes','reservation_requests'] loop
    execute format('alter table public.%I enable row level security',name);
    execute format('create policy admin_manage on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())',name);
  end loop;
end $$;
alter table public.analytics_events enable row level security;
alter table public.audit_logs enable row level security;
create policy admin_metrics on public.analytics_events for select to authenticated using(public.is_admin());
create policy admin_audit on public.audit_logs for select to authenticated using(public.is_admin());
create policy public_categories on public.categories for select to anon,authenticated using(status='published');
create policy public_menu on public.menu_items for select to anon,authenticated using(status='published' and exists(select 1 from public.categories c where c.id=category_id and c.status='published'));
create policy public_images on public.menu_item_images for select to anon,authenticated using(exists(select 1 from public.menu_items m where m.id=menu_item_id and m.status='published'));
create policy public_variants on public.menu_item_variants for select to anon,authenticated using(exists(select 1 from public.menu_items m where m.id=menu_item_id and m.status='published'));
create policy public_addons on public.menu_item_addons for select to anon,authenticated using(exists(select 1 from public.menu_items m where m.id=menu_item_id and m.status='published'));
create policy public_events on public.events for select to anon,authenticated using(status='published');
create policy public_promotions on public.promotions for select to anon,authenticated using(status='published' and starts_at<=now() and ends_at>now() and exists(select 1 from public.menu_items m where m.id=product_id and m.status='published'));
create policy public_gallery on public.gallery_images for select to anon,authenticated using(status='published');

create function public.public_restaurant_settings() returns jsonb language sql stable security definer set search_path='' as $$
  select config || jsonb_build_object(
    'cnpj',case when config->>'show_cnpj'='true' then coalesce(config->>'cnpj','') else '' end,
    'whatsapp',case when config->>'whatsapp_confirmed'='true' then coalesce(config->>'whatsapp','') else '' end
  ) from public.restaurant_settings where id=1;
$$;
revoke all on function public.public_restaurant_settings() from public;
grant execute on function public.public_restaurant_settings() to anon,authenticated,service_role;

create function public.save_menu_item(p_id uuid,p_data jsonb) returns uuid language plpgsql security invoker set search_path='' as $$
declare existing jsonb; merged jsonb; saved public.menu_items; item_id uuid; option_name text; entries jsonb;
begin
  if not public.is_admin() then raise exception using errcode='42501',message='Admin required'; end if;
  if jsonb_typeof(p_data)<>'object' then raise exception using errcode='PT422',message='Invalid data'; end if;
  item_id=coalesce(p_id,gen_random_uuid());
  if p_id is not null then
    select to_jsonb(m) into existing from public.menu_items m where id=p_id for update;
    if existing is null then raise exception using errcode='PT404',message='Not found'; end if;
  else
    existing=jsonb_build_object('id',item_id,'description','','ingredients','','allergens','','serves','','available',true,'featured',false,'status','draft','position',0,'created_at',now(),'updated_at',now());
  end if;
  merged=existing || (p_data - array['id','created_at','updated_at','images','variants','addons']);
  select * into saved from jsonb_populate_record(null::public.menu_items,merged);
  if p_id is null then insert into public.menu_items select saved.*;
  else update public.menu_items set name=saved.name,slug=saved.slug,category_id=saved.category_id,description=saved.description,image=saved.image,
    price_cents=saved.price_cents,ingredients=saved.ingredients,allergens=saved.allergens,serves=saved.serves,available=saved.available,
    featured=saved.featured,status=saved.status,position=saved.position where id=item_id; end if;
  if p_data ? 'images' then
    entries=p_data->'images';
    if jsonb_typeof(entries)<>'array' or jsonb_array_length(entries)>20 then raise exception using errcode='PT422',message='Invalid images'; end if;
    delete from public.menu_item_images where menu_item_id=item_id;
    insert into public.menu_item_images(menu_item_id,photo,position) select item_id,value,ordinality-1 from jsonb_array_elements(entries) with ordinality;
  end if;
  foreach option_name in array array['variants','addons'] loop
    if p_data ? option_name then
      entries=p_data->option_name;
      if jsonb_typeof(entries)<>'array' or jsonb_array_length(entries)>50 then raise exception using errcode='PT422',message='Invalid options'; end if;
      execute format('delete from public.menu_item_%I where menu_item_id=$1',option_name) using item_id;
      execute format('insert into public.menu_item_%I(menu_item_id,name,price_cents,position) select $1,value->>''name'',(value->>''price_cents'')::integer,ordinality-1 from jsonb_array_elements($2) with ordinality',option_name) using item_id,entries;
    end if;
  end loop;
  return item_id;
end;
$$;
revoke all on function public.save_menu_item(uuid,jsonb) from public;
grant execute on function public.save_menu_item(uuid,jsonb) to authenticated;

create function public.append_metric(p_data jsonb) returns void language plpgsql security definer set search_path='' as $$
begin
  if not exists(select 1 from public.restaurant_settings where id=1 and config->>'analytics_enabled'='true') then return; end if;
  if jsonb_typeof(p_data)<>'object' or length(coalesce(p_data->>'subject',''))>100 or length(coalesce(p_data->>'campaign',''))>80 then raise exception using errcode='PT422',message='Invalid metric'; end if;
  insert into public.analytics_events(kind,subject,campaign) values(p_data->>'kind',coalesce(p_data->>'subject',''),coalesce(p_data->>'campaign',''));
end;
$$;
create function public.request_reservation(p_data jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare saved_id uuid;
begin
  if not exists(select 1 from public.restaurant_settings where id=1 and config->>'reservations_enabled'='true') then raise exception using errcode='PT403',message='Reservations disabled'; end if;
  if (p_data->>'date')::date < (now() at time zone 'America/Sao_Paulo')::date then raise exception using errcode='PT422',message='Past date'; end if;
  insert into public.reservation_requests(date,time,people,name,phone,notes) values((p_data->>'date')::date,(p_data->>'time')::time,(p_data->>'people')::integer,p_data->>'name',p_data->>'phone',coalesce(p_data->>'notes','')) returning id into saved_id;
  return saved_id;
end;
$$;
create function public.purge_expired_data() returns void language plpgsql security definer set search_path='' as $$
begin
  delete from public.reservation_requests where created_at<now()-interval '90 days';
  delete from public.analytics_events where created_at<now()-interval '90 days';
  delete from public.audit_logs where created_at<now()-interval '365 days';
end;
$$;
revoke all on function public.append_metric(jsonb),public.request_reservation(jsonb),public.purge_expired_data() from public,anon,authenticated;
grant execute on function public.append_metric(jsonb),public.request_reservation(jsonb),public.purge_expired_data() to service_role;
revoke all on function public.audit_change(),public.touch_updated_at() from public;

grant usage on schema public to anon,authenticated,service_role;
grant select on public.categories,public.menu_items,public.menu_item_images,public.menu_item_variants,public.menu_item_addons,public.events,public.promotions,public.gallery_images to anon;
grant select on public.admin_profiles,public.analytics_events,public.audit_logs to authenticated;
grant select,insert,update,delete on public.restaurant_settings,public.categories,public.menu_items,public.menu_item_images,public.menu_item_variants,public.menu_item_addons,public.events,public.promotions,public.gallery_images,public.qr_codes,public.reservation_requests to authenticated;
grant all on all tables in schema public to service_role;
commit;
