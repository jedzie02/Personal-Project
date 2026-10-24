-- ==============================================================================
-- LIVE SEED SCRIPT FOR SUPABASE SQL EDITOR
-- Run this directly in your Supabase SQL Editor to seed live reference data!
-- ==============================================================================

-- 1. Ensure columns exist on public.courts
alter table if exists public.courts add column if not exists is_indoor boolean default true;
alter table if exists public.courts add column if not exists hourly_rate numeric(10, 2) default 25.00;
alter table if exists public.courts add column if not exists status text default 'Active';
alter table if exists public.courts add column if not exists is_active boolean default true;

-- 2. Update existing courts to have rich metadata matching mock references
update public.courts set 
  description = coalesce(description, 'Indoor court with tournament-grade surface and spectator seating.'),
  is_indoor = true,
  hourly_rate = 25.00,
  status = 'Active',
  is_active = true
where name ilike '%court 1%';

update public.courts set 
  description = coalesce(description, 'Outdoor court featuring acrylic surface and high perimeter fencing.'),
  is_indoor = false,
  hourly_rate = 20.00,
  status = 'Active',
  is_active = true
where name ilike '%court 2%';

update public.courts set 
  description = coalesce(description, 'Indoor court with premium cushioning and climate control.'),
  is_indoor = true,
  hourly_rate = 30.00,
  status = 'Maintenance',
  is_active = true
where name ilike '%court 3%';

update public.courts set 
  description = coalesce(description, 'Outdoor court equipped with LED floodlights for evening play.'),
  is_indoor = false,
  hourly_rate = 22.00,
  status = 'Active',
  is_active = true
where name ilike '%court 4%';

-- 3. Profiles
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

-- 4. Live Bookings
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

-- 5. Payments Table (if exists)
insert into public.payments (id, booking_id, amount, currency, status, method, created_at)
values
    ('pay-live-001', 'bk-live-001', 25.00, 'PHP', 'succeeded', 'GCash', now() - interval '2 hours'),
    ('pay-live-002', 'bk-live-002', 20.00, 'PHP', 'pending', 'Credit Card', now() - interval '1 hour'),
    ('pay-live-003', 'bk-live-003', 25.00, 'PHP', 'succeeded', 'GCash', now() - interval '30 minutes'),
    ('pay-live-004', 'bk-live-004', 22.00, 'PHP', 'succeeded', 'Cash', now() - interval '10 minutes')
on conflict (id) do nothing;
