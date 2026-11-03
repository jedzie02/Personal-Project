-- ==============================================================================
-- GCASH SETTINGS & STORAGE BUCKET MIGRATION
-- ==============================================================================

-- 1. Create site_settings table
create table if not exists public.site_settings (
  id           text primary key,
  gcash_number text,
  gcash_name   text,
  gcash_qr_url text,
  updated_at   timestamptz default now()
);

-- 2. Seed initial row for gcash
insert into public.site_settings (id, gcash_number, gcash_name, gcash_qr_url)
values ('gcash', '0917-123-4567', 'PICKLE CLUB INC / J*** D.', '/gcash-qr.jpg')
on conflict (id) do nothing;

-- 3. Row Level Security: public read, allow insert/update
alter table public.site_settings enable row level security;

drop policy if exists "site_settings_read" on public.site_settings;
create policy "site_settings_read" on public.site_settings
  for select using (true);

drop policy if exists "site_settings_insert" on public.site_settings;
create policy "site_settings_insert" on public.site_settings
  for insert with check (true);

drop policy if exists "site_settings_update" on public.site_settings;
create policy "site_settings_update" on public.site_settings
  for update using (true);

-- 4. Storage Bucket for Settings / GCash QR
insert into storage.buckets (id, name, public)
values ('settings', 'settings', true)
on conflict (id) do nothing;

-- 5. Storage RLS: Public read, insert, update for 'settings' bucket
drop policy if exists "settings_objects_read" on storage.objects;
create policy "settings_objects_read" on storage.objects
  for select using (bucket_id = 'settings');

drop policy if exists "settings_objects_admin_insert" on storage.objects;
create policy "settings_objects_admin_insert" on storage.objects
  for insert with check (bucket_id = 'settings');

drop policy if exists "settings_objects_admin_update" on storage.objects;
create policy "settings_objects_admin_update" on storage.objects
  for update using (bucket_id = 'settings');
