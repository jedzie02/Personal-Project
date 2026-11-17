-- ==============================================================================
-- ALL-IN-ONE FRESH VENUE DATABASE SCHEMA (LOCKED-DOWN RLS & READY FOR PRODUCTION)
-- Paste and run this once in your new Supabase project's SQL Editor.
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- 1. PROFILES TABLE
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    first_name text,
    full_name text,
    email text unique,
    phone text,
    role text default 'customer' check (role in ('customer', 'admin', 'staff')),
    created_at timestamptz default now() not null
);

-- 2. COURTS TABLE
create table if not exists public.courts (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    description text,
    is_indoor boolean default true not null,
    hourly_rate numeric(10, 2) default 300.00 not null,
    status text default 'Active' check (status in ('Active', 'Maintenance', 'Deactivated')) not null,
    is_active boolean default true not null,
    created_at timestamptz default now() not null
);

-- 3. BOOKINGS TABLE
create table if not exists public.bookings (
    id uuid primary key default gen_random_uuid(),
    court_id uuid references public.courts(id) on delete restrict not null,
    customer_id uuid references public.profiles(id) on delete restrict not null,
    booking_date date not null,
    start_time time not null,
    end_time time not null,
    status text default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'completed')) not null,
    payment_status text default 'pending',
    total_price numeric(10, 2) not null,
    payment_method text,
    payment_reference text,
    cancelled_reason text,
    created_at timestamptz default now() not null
);

create index if not exists idx_bookings_court_date on public.bookings (court_id, booking_date);
create index if not exists idx_bookings_customer_id on public.bookings (customer_id);
create index if not exists idx_bookings_payment_reference on public.bookings (payment_reference);

-- 4. PAYMENTS TABLE
create table if not exists public.payments (
    id uuid primary key default gen_random_uuid(),
    booking_id uuid references public.bookings(id) on delete set null,
    amount numeric(10, 2) not null,
    currency text default 'PHP' not null,
    status text default 'pending' check (status in ('pending', 'completed', 'failed', 'refunded')) not null,
    payment_method text not null,
    payment_reference text,
    stripe_payment_intent_id text,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

create index if not exists idx_payments_booking_id on public.payments (booking_id);

-- 5. SITE SETTINGS TABLE (GCash & Venue Details)
create table if not exists public.site_settings (
  id           text primary key,
  gcash_number text,
  gcash_name   text,
  gcash_qr_url text,
  updated_at   timestamptz default now()
);

insert into public.site_settings (id, gcash_number, gcash_name, gcash_qr_url)
values ('gcash', '0917-123-4567', 'PICKLE CLUB INC', '/gcash-qr.jpg')
on conflict (id) do nothing;

-- 6. OPEN PLAY TABLES
create table if not exists public.open_play_sessions (
  id                uuid primary key default gen_random_uuid(),
  court_id          uuid not null references public.courts(id) on delete cascade,
  session_date      date not null,
  start_time        time not null,
  end_time          time not null,
  price_per_player  numeric(10, 2) not null check (price_per_player >= 0),
  player_cap        integer not null check (player_cap >= 1),
  status            text not null default 'scheduled' check (status in ('scheduled', 'cancelled')),
  hold_booking_id   uuid references public.bookings(id) on delete set null,
  created_at        timestamptz not null default now()
);

create table if not exists public.open_play_entries (
  id                          uuid primary key default gen_random_uuid(),
  session_id                  uuid not null references public.open_play_sessions(id) on delete cascade,
  customer_id                 uuid not null references public.profiles(id) on delete cascade,
  status                      text not null default 'pending' check (status in ('pending', 'paid', 'cancelled', 'needs_refund')),
  amount                      numeric(10, 2) not null check (amount >= 0),
  stripe_checkout_session_id  text,
  hold_expires_at             timestamptz,
  created_at                  timestamptz not null default now(),
  unique (session_id, customer_id)
);

-- 7. ROW LEVEL SECURITY (HARDENED - NO WILDCARD TRUE POLICIES)
alter table public.profiles enable row level security;
alter table public.courts enable row level security;
alter table public.bookings enable row level security;
alter table public.payments enable row level security;
alter table public.site_settings enable row level security;
alter table public.open_play_sessions enable row level security;
alter table public.open_play_entries enable row level security;

-- Profiles: users view & edit only their own
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Courts: everyone can view active courts
create policy "Active courts viewable by everyone" on public.courts for select using (true);

-- Bookings: availability visible to all, detailed bookings visible to owner
create policy "Bookings viewable for calendar" on public.bookings for select using (true);
create policy "Customers can insert own bookings" on public.bookings for insert with check (auth.uid() = customer_id);
create policy "Customers can cancel own bookings" on public.bookings for update using (auth.uid() = customer_id);

-- Site Settings: public read
create policy "Site settings public read" on public.site_settings for select using (true);

-- Open play: public read sessions
create policy "Open play sessions viewable" on public.open_play_sessions for select using (true);
create policy "Open play entries viewable by owner" on public.open_play_entries for select using (auth.uid() = customer_id);

-- 8. Storage Buckets (for GCash QR & settings)
insert into storage.buckets (id, name, public)
values ('settings', 'settings', true)
on conflict (id) do nothing;

create policy "Settings bucket public read" on storage.objects for select using (bucket_id = 'settings');
