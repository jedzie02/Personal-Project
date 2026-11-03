-- ==============================================================================
-- OPEN PLAY SESSIONS & ENTRIES MIGRATION
-- ==============================================================================

-- 1. open_play_sessions table
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

create index if not exists idx_open_play_sessions_date_status
  on public.open_play_sessions (session_date, status);

-- 2. open_play_entries table
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

create index if not exists idx_open_play_entries_session
  on public.open_play_entries (session_id, status);

create index if not exists idx_open_play_entries_stripe_session
  on public.open_play_entries (stripe_checkout_session_id);

-- 3. Row Level Security
alter table public.open_play_sessions enable row level security;
alter table public.open_play_entries enable row level security;

drop policy if exists "open_play_sessions_select" on public.open_play_sessions;
create policy "open_play_sessions_select" on public.open_play_sessions
  for select using (true);

drop policy if exists "open_play_sessions_insert" on public.open_play_sessions;
create policy "open_play_sessions_insert" on public.open_play_sessions
  for insert with check (true);

drop policy if exists "open_play_sessions_update" on public.open_play_sessions;
create policy "open_play_sessions_update" on public.open_play_sessions
  for update using (true);

drop policy if exists "open_play_sessions_delete" on public.open_play_sessions;
create policy "open_play_sessions_delete" on public.open_play_sessions
  for delete using (true);

drop policy if exists "open_play_entries_select_own" on public.open_play_entries;
drop policy if exists "open_play_entries_select" on public.open_play_entries;
create policy "open_play_entries_select" on public.open_play_entries
  for select using (true);

drop policy if exists "open_play_entries_insert" on public.open_play_entries;
create policy "open_play_entries_insert" on public.open_play_entries
  for insert with check (true);

drop policy if exists "open_play_entries_update" on public.open_play_entries;
create policy "open_play_entries_update" on public.open_play_entries
  for update using (true);

drop policy if exists "open_play_entries_delete" on public.open_play_entries;
create policy "open_play_entries_delete" on public.open_play_entries
  for delete using (true);

-- 4. Atomic spot-claim function (prevents last-spot race conditions)
create or replace function public.claim_open_play_spot(
  p_session_id uuid,
  p_customer_id uuid,
  p_hold_minutes integer default 30
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session record;
  v_existing record;
  v_active_count integer;
  v_entry_id uuid;
  v_now timestamptz := now();
  v_today_manila date := (v_now at time zone 'Asia/Manila')::date;
  v_hour_manila integer := extract(hour from (v_now at time zone 'Asia/Manila'))::integer;
  v_start_hour integer;
begin
  -- Lock the session row so concurrent callers queue on the same session
  select *
    into v_session
    from public.open_play_sessions
   where id = p_session_id
   for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Open play session not found.');
  end if;

  if v_session.status <> 'scheduled' then
    return jsonb_build_object('ok', false, 'error', 'This open play session has been cancelled.');
  end if;

  v_start_hour := extract(hour from v_session.start_time)::integer;
  if v_session.session_date < v_today_manila
     or (v_session.session_date = v_today_manila and v_start_hour < v_hour_manila) then
    return jsonb_build_object('ok', false, 'error', 'This open play session has already started.');
  end if;

  -- Check if this customer already has a paid entry
  select *
    into v_existing
    from public.open_play_entries
   where session_id = p_session_id
     and customer_id = p_customer_id;

  if found and v_existing.status = 'paid' then
    return jsonb_build_object('ok', false, 'error', 'You already joined this session.');
  end if;

  -- Count paid entries + unexpired pending entries excluding this customer's own row
  select count(*)::integer
    into v_active_count
    from public.open_play_entries
   where session_id = p_session_id
     and customer_id <> p_customer_id
     and (
       status = 'paid'
       or (status = 'pending' and hold_expires_at is not null and hold_expires_at > v_now)
     );

  if v_active_count >= v_session.player_cap then
    return jsonb_build_object('ok', false, 'error', 'Session is full.');
  end if;

  -- Upsert customer's entry as pending with fresh 30-minute hold
  insert into public.open_play_entries (
    session_id,
    customer_id,
    status,
    amount,
    stripe_checkout_session_id,
    hold_expires_at
  )
  values (
    p_session_id,
    p_customer_id,
    'pending',
    v_session.price_per_player,
    null,
    v_now + make_interval(mins => p_hold_minutes)
  )
  on conflict (session_id, customer_id)
  do update set
    status = 'pending',
    amount = excluded.amount,
    stripe_checkout_session_id = null,
    hold_expires_at = excluded.hold_expires_at
  returning id into v_entry_id;

  return jsonb_build_object(
    'ok', true,
    'entry_id', v_entry_id,
    'amount', v_session.price_per_player
  );
end;
$$;

grant execute on function public.claim_open_play_spot(uuid, uuid, integer) to anon, authenticated, service_role;

-- 5. Clean up any orphaned "Open Play hold" booking from prior failed attempt
delete from public.bookings
 where payment_method = 'Open Play hold'
   and id not in (
     select hold_booking_id
       from public.open_play_sessions
      where hold_booking_id is not null
   );

-- 6. Reload PostgREST schema cache immediately
notify pgrst, 'reload schema';
