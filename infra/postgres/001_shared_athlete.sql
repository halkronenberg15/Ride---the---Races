-- Supabase shared athlete cloud foundation for Ride the Races + Mission France.

create table if not exists public.athlete_profiles (
  athlete_id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text not null default 'Rider',
  ftp_watts integer,
  weight_kg numeric(6,2),
  preferred_units text not null default 'imperial' check (preferred_units in ('imperial','metric')),
  profile_version integer not null default 1,
  updated_at timestamptz not null default now()
);

create table if not exists public.athlete_events (
  event_id uuid primary key,
  athlete_id uuid not null references public.athlete_profiles(athlete_id) on delete cascade,
  event_type text not null,
  schema_version integer not null,
  occurred_at timestamptz not null,
  producer text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists athlete_events_athlete_created_idx
  on public.athlete_events(athlete_id,created_at,event_id);

create table if not exists public.rides (
  ride_id uuid primary key,
  athlete_id uuid not null references public.athlete_profiles(athlete_id) on delete cascade,
  source text not null,
  started_at timestamptz not null,
  completed_at timestamptz not null,
  duration_seconds integer not null check (duration_seconds >= 0),
  distance_meters numeric,
  elevation_meters numeric,
  average_power_watts numeric,
  normalized_power_watts numeric,
  average_heart_rate_bpm numeric,
  average_cadence_rpm numeric,
  energy_kj numeric,
  calories numeric,
  ftp_watts integer,
  workout_id text,
  assignment_id text,
  race_id text,
  stage_number integer,
  notes text,
  record_version integer not null default 1,
  updated_at timestamptz not null default now()
);

create index if not exists rides_athlete_completed_idx
  on public.rides(athlete_id,completed_at desc);

create table if not exists public.processed_events (
  consumer text not null,
  event_id uuid not null references public.athlete_events(event_id) on delete cascade,
  athlete_id uuid not null references public.athlete_profiles(athlete_id) on delete cascade,
  processed_at timestamptz not null default now(),
  primary key (consumer,event_id)
);

create index if not exists processed_events_athlete_idx
  on public.processed_events(athlete_id);
create index if not exists processed_events_event_idx
  on public.processed_events(event_id);

create table if not exists public.sync_cursors (
  athlete_id uuid not null references public.athlete_profiles(athlete_id) on delete cascade,
  device_id text not null,
  consumer text not null,
  cursor text,
  updated_at timestamptz not null default now(),
  primary key (athlete_id,device_id,consumer)
);

create or replace function public.handle_new_rider()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.athlete_profiles (user_id, display_name)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'display_name',''), nullif(split_part(new.email,'@',1),''), 'Rider')
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_rider() from public;
revoke all on function public.handle_new_rider() from anon;
revoke all on function public.handle_new_rider() from authenticated;
grant execute on function public.handle_new_rider() to supabase_auth_admin;

drop trigger if exists on_auth_user_created_rtr on auth.users;
create trigger on_auth_user_created_rtr
after insert on auth.users
for each row execute procedure public.handle_new_rider();

alter table public.athlete_profiles enable row level security;
alter table public.athlete_events enable row level security;
alter table public.rides enable row level security;
alter table public.processed_events enable row level security;
alter table public.sync_cursors enable row level security;

drop policy if exists "athletes_select_own_profile" on public.athlete_profiles;
create policy "athletes_select_own_profile"
on public.athlete_profiles for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "athletes_update_own_profile" on public.athlete_profiles;
create policy "athletes_update_own_profile"
on public.athlete_profiles for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "athletes_insert_own_profile" on public.athlete_profiles;
create policy "athletes_insert_own_profile"
on public.athlete_profiles for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "athletes_select_own_events" on public.athlete_events;
create policy "athletes_select_own_events"
on public.athlete_events for select to authenticated
using (athlete_id in (select athlete_id from public.athlete_profiles where user_id = (select auth.uid())));

drop policy if exists "athletes_insert_own_events" on public.athlete_events;
create policy "athletes_insert_own_events"
on public.athlete_events for insert to authenticated
with check (athlete_id in (select athlete_id from public.athlete_profiles where user_id = (select auth.uid())));

drop policy if exists "athletes_select_own_rides" on public.rides;
create policy "athletes_select_own_rides"
on public.rides for select to authenticated
using (athlete_id in (select athlete_id from public.athlete_profiles where user_id = (select auth.uid())));

drop policy if exists "athletes_insert_own_rides" on public.rides;
create policy "athletes_insert_own_rides"
on public.rides for insert to authenticated
with check (athlete_id in (select athlete_id from public.athlete_profiles where user_id = (select auth.uid())));

drop policy if exists "athletes_update_own_rides" on public.rides;
create policy "athletes_update_own_rides"
on public.rides for update to authenticated
using (athlete_id in (select athlete_id from public.athlete_profiles where user_id = (select auth.uid())))
with check (athlete_id in (select athlete_id from public.athlete_profiles where user_id = (select auth.uid())));

drop policy if exists "athletes_select_own_processed_events" on public.processed_events;
create policy "athletes_select_own_processed_events"
on public.processed_events for select to authenticated
using (athlete_id in (select athlete_id from public.athlete_profiles where user_id = (select auth.uid())));

drop policy if exists "athletes_insert_own_processed_events" on public.processed_events;
create policy "athletes_insert_own_processed_events"
on public.processed_events for insert to authenticated
with check (athlete_id in (select athlete_id from public.athlete_profiles where user_id = (select auth.uid())));

drop policy if exists "athletes_select_own_sync_cursors" on public.sync_cursors;
create policy "athletes_select_own_sync_cursors"
on public.sync_cursors for select to authenticated
using (athlete_id in (select athlete_id from public.athlete_profiles where user_id = (select auth.uid())));

drop policy if exists "athletes_insert_own_sync_cursors" on public.sync_cursors;
create policy "athletes_insert_own_sync_cursors"
on public.sync_cursors for insert to authenticated
with check (athlete_id in (select athlete_id from public.athlete_profiles where user_id = (select auth.uid())));

drop policy if exists "athletes_update_own_sync_cursors" on public.sync_cursors;
create policy "athletes_update_own_sync_cursors"
on public.sync_cursors for update to authenticated
using (athlete_id in (select athlete_id from public.athlete_profiles where user_id = (select auth.uid())))
with check (athlete_id in (select athlete_id from public.athlete_profiles where user_id = (select auth.uid())));
