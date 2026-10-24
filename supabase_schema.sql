-- ==============================================================================
-- SPORTS COURT BOOKING APPLICATION SCHEMA & LIVE DATABASE SEED
-- Tables: profiles, courts, bookings, payments
-- ==============================================================================

-- 1. PROFILES TABLE
create table if not exists public.profiles (
    id uuid primary key default gen_random_uuid(),
    first_name text,
    full_name text,
    email text unique,
    phone text,
    role text default 'customer' check (role in ('customer', 'admin')),
    created_at timestamptz default now() not null
);

-- Ensure columns exist if table was already created
alter table if exists public.profiles add column if not exists first_name text;
alter table if exists public.profiles add column if not exists full_name text;
alter table if exists public.profiles add column if not exists email text;
alter table if exists public.profiles add column if not exists phone text;
alter table if exists public.profiles add column if not exists role text default 'customer';

-- 2. COURTS TABLE
create table if not exists public.courts (
    id text primary key default gen_random_uuid()::text,
    name text not null,
    description text,
    is_indoor boolean default true not null,
    hourly_rate numeric(10, 2) default 25.00 not null,
    status text default 'Active' check (status in ('Active', 'Maintenance', 'Deactivated')) not null,
    is_active boolean default true not null,
    created_at timestamptz default now() not null
);

-- Ensure columns exist if table was already created
alter table if exists public.courts add column if not exists is_indoor boolean default true;
alter table if exists public.courts add column if not exists hourly_rate numeric(10, 2) default 25.00;
alter table if exists public.courts add column if not exists status text default 'Active';
alter table if exists public.courts add column if not exists is_active boolean default true;

-- 3. BOOKINGS TABLE
create table if not exists public.bookings (
    id text primary key default gen_random_uuid()::text,
    court_id text not null references public.courts(id) on delete cascade,
    customer_id uuid references public.profiles(id) on delete set null,
    user_id uuid references public.profiles(id) on delete set null,
    booking_date date default current_date not null,
    start_time text not null, -- Format "HH:MM", e.g. "09:00"
    end_time text not null,   -- Format "HH:MM", e.g. "10:00"
    total_price numeric(10, 2) default 25.00 not null,
    payment_status text default 'pending' check (payment_status in ('pending', 'succeeded', 'failed', 'refunded')) not null,
    status text default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'completed')) not null,
    cancelled_reason text,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

-- Ensure columns exist if table was already created
alter table if exists public.bookings add column if not exists customer_id uuid references public.profiles(id) on delete set null;
alter table if exists public.bookings add column if not exists user_id uuid references public.profiles(id) on delete set null;
alter table if exists public.bookings add column if not exists booking_date date default current_date;
alter table if exists public.bookings add column if not exists start_time text;
alter table if exists public.bookings add column if not exists end_time text;
alter table if exists public.bookings add column if not exists total_price numeric(10, 2) default 25.00;
alter table if exists public.bookings add column if not exists payment_status text default 'pending';
alter table if exists public.bookings add column if not exists status text default 'pending';
alter table if exists public.bookings add column if not exists cancelled_reason text;

-- 4. PAYMENTS TABLE
create table if not exists public.payments (
    id text primary key default gen_random_uuid()::text,
    booking_id text references public.bookings(id) on delete cascade,
    stripe_checkout_session_id text,
    amount numeric(10, 2) not null default 0.00,
    currency text not null default 'PHP',
    status text not null default 'pending' check (status in ('pending', 'succeeded', 'failed', 'refunded')),
    method text default 'GCash',
    created_at timestamptz default now() not null
);

-- Indexes for performance
create index if not exists idx_bookings_date on public.bookings (booking_date);
create index if not exists idx_bookings_court on public.bookings (court_id);
create index if not exists idx_bookings_customer on public.bookings (customer_id);
create index if not exists idx_courts_status on public.courts (status);
create index if not exists idx_payments_booking on public.payments (booking_id);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.courts enable row level security;
alter table public.bookings enable row level security;
alter table if exists public.payments enable row level security;

-- Drop prior restrictive policies to avoid conflicts
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
drop policy if exists "Allow profile read for all" on public.profiles;
drop policy if exists "Allow profile insert for all" on public.profiles;
drop policy if exists "Allow profile update for all" on public.profiles;

drop policy if exists "Courts are viewable by everyone" on public.courts;
drop policy if exists "Allow insert on courts for all" on public.courts;
drop policy if exists "Allow update on courts for all" on public.courts;

drop policy if exists "Bookings are viewable by everyone" on public.bookings;
drop policy if exists "Allow insert on bookings for all" on public.bookings;
drop policy if exists "Allow update on bookings for all" on public.bookings;

drop policy if exists "Payments are viewable by everyone" on public.payments;
drop policy if exists "Allow insert on payments for all" on public.payments;
drop policy if exists "Allow update on payments for all" on public.payments;

-- Permissive Development & Production Policies
create policy "Allow profile read for all" on public.profiles for select using (true);
create policy "Allow profile insert for all" on public.profiles for insert with check (true);
create policy "Allow profile update for all" on public.profiles for update using (true);

create policy "Courts are viewable by everyone" on public.courts for select using (true);
create policy "Allow insert on courts for all" on public.courts for insert with check (true);
create policy "Allow update on courts for all" on public.courts for update using (true);

create policy "Bookings are viewable by everyone" on public.bookings for select using (true);
create policy "Allow insert on bookings for all" on public.bookings for insert with check (true);
create policy "Allow update on bookings for all" on public.bookings for update using (true);
create policy "Allow delete on bookings for all" on public.bookings for delete using (true);

create policy "Payments are viewable by everyone" on public.payments for select using (true);
create policy "Allow insert on payments for all" on public.payments for insert with check (true);
create policy "Allow update on payments for all" on public.payments for update using (true);

-- ==============================================================================
-- LIVE REFERENCE SEED DATA
-- Populates real profiles, courts, live reservations, and payments
-- ==============================================================================

-- 1. Real Profiles
insert into public.profiles (id, first_name, full_name, email, phone, role)
values
    ('11111111-1111-1111-1111-111111111111', 'Maria', 'Maria Santos', 'maria@example.com', '+63 917 111 2233', 'customer'),
    ('22222222-2222-2222-2222-222222222222', 'Juan', 'Juan Dela Cruz', 'juan@example.com', '+63 918 222 3344', 'customer'),
    ('33333333-3333-3333-3333-333333333333', 'Ana', 'Ana Reyes', 'ana@example.com', '+63 919 333 4455', 'customer'),
    ('44444444-4444-4444-4444-444444444444', 'Ben', 'Ben Torres', 'ben@example.com', '+63 920 444 5566', 'customer'),
    ('55555555-5555-5555-5555-555555555555', 'Lia', 'Lia Gomez', 'lia@example.com', '+63 921 555 6677', 'customer'),
    ('66666666-6666-6666-6666-666666666666', 'Alex', 'Alex Johnson', 'alex.johnson@example.com', '+63 917 234 5678', 'customer'),
    ('77777777-7777-7777-7777-777777777777', 'Admin', 'Court Administrator', 'admin@pickle.com', '+63 900 000 0000', 'admin')
on conflict (id) do update set
    full_name = excluded.full_name,
    email = excluded.email,
    phone = excluded.phone,
    role = excluded.role;

-- 2. Update existing courts to have rich metadata matching mock references
update public.courts set 
  description = coalesce(description, 'Indoor court with tournament-grade surface and spectator seating.'),
  is_indoor = true,
  hourly_rate = 25.00,
  status = 'Active'
where name ilike '%court 1%';

update public.courts set 
  description = coalesce(description, 'Outdoor court featuring acrylic surface and high perimeter fencing.'),
  is_indoor = false,
  hourly_rate = 20.00,
  status = 'Active'
where name ilike '%court 2%';

update public.courts set 
  description = coalesce(description, 'Indoor court with premium cushioning and climate control.'),
  is_indoor = true,
  hourly_rate = 30.00,
  status = 'Maintenance'
where name ilike '%court 3%';

update public.courts set 
  description = coalesce(description, 'Outdoor court equipped with LED floodlights for evening play.'),
  is_indoor = false,
  hourly_rate = 22.00,
  status = 'Active'
where name ilike '%court 4%';

-- 3. Live Bookings (Current & Upcoming Reservations)
-- Inserts real reservations tied to the actual courts in the database
insert into public.bookings (id, court_id, customer_id, user_id, booking_date, start_time, end_time, total_price, payment_status, status)
select
    'bk-live-001',
    c.id,
    '11111111-1111-1111-1111-111111111111'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    current_date,
    '09:00',
    '10:00',
    25.00,
    'succeeded',
    'confirmed'
from public.courts c where c.name ilike '%court 1%' limit 1
on conflict (id) do nothing;

insert into public.bookings (id, court_id, customer_id, user_id, booking_date, start_time, end_time, total_price, payment_status, status)
select
    'bk-live-002',
    c.id,
    '22222222-2222-2222-2222-222222222222'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid,
    current_date,
    '10:00',
    '11:00',
    20.00,
    'pending',
    'pending'
from public.courts c where c.name ilike '%court 2%' limit 1
on conflict (id) do nothing;

insert into public.bookings (id, court_id, customer_id, user_id, booking_date, start_time, end_time, total_price, payment_status, status)
select
    'bk-live-003',
    c.id,
    '33333333-3333-3333-3333-333333333333'::uuid,
    '33333333-3333-3333-3333-333333333333'::uuid,
    current_date + interval '1 day',
    '14:00',
    '15:00',
    25.00,
    'succeeded',
    'confirmed'
from public.courts c where c.name ilike '%court 1%' limit 1
on conflict (id) do nothing;

insert into public.bookings (id, court_id, customer_id, user_id, booking_date, start_time, end_time, total_price, payment_status, status)
select
    'bk-live-004',
    c.id,
    '44444444-4444-4444-4444-444444444444'::uuid,
    '44444444-4444-4444-4444-444444444444'::uuid,
    current_date + interval '1 day',
    '16:00',
    '17:00',
    22.00,
    'succeeded',
    'confirmed'
from public.courts c where c.name ilike '%court 4%' limit 1
on conflict (id) do nothing;

insert into public.bookings (id, court_id, customer_id, user_id, booking_date, start_time, end_time, total_price, payment_status, status)
select
    'bk-live-005',
    c.id,
    '55555555-5555-5555-5555-555555555555'::uuid,
    '55555555-5555-5555-5555-555555555555'::uuid,
    current_date + interval '2 days',
    '18:00',
    '19:00',
    20.00,
    'pending',
    'pending'
from public.courts c where c.name ilike '%court 2%' limit 1
on conflict (id) do nothing;

insert into public.bookings (id, court_id, customer_id, user_id, booking_date, start_time, end_time, total_price, payment_status, status)
select
    'bk-live-006',
    c.id,
    '66666666-6666-6666-6666-666666666666'::uuid,
    '66666666-6666-6666-6666-666666666666'::uuid,
    current_date,
    '11:00',
    '12:00',
    25.00,
    'succeeded',
    'confirmed'
from public.courts c where c.name ilike '%court 1%' limit 1
on conflict (id) do nothing;

-- 4. Real Payments
insert into public.payments (id, booking_id, amount, currency, status, method, created_at)
values
    ('pay-live-001', 'bk-live-001', 25.00, 'PHP', 'succeeded', 'GCash', now() - interval '2 hours'),
    ('pay-live-002', 'bk-live-002', 20.00, 'PHP', 'pending', 'Credit Card', now() - interval '1 hour'),
    ('pay-live-003', 'bk-live-003', 25.00, 'PHP', 'succeeded', 'GCash', now() - interval '30 minutes'),
    ('pay-live-004', 'bk-live-004', 22.00, 'PHP', 'succeeded', 'Cash', now() - interval '10 minutes')
on conflict (id) do nothing;
