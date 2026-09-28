create extension if not exists pgcrypto;

create table if not exists public.athlete_profiles (
  athlete_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  ftp_watts integer,
  weight_kg numeric,
  preferred_units text not null default 'imperial' check (preferred_units in ('imperial','metric')),
  profile_version integer not null default 1,
  updated_at timestamptz not null default now()
);

create table if not exists public.athlete_rides (
  athlete_id uuid not null references auth.users(id) on delete cascade,
  ride_id text not null,
  source text not null,
  payload jsonb not null,
  schema_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (athlete_id, ride_id)
);

create table if not exists public.athlete_events (
  athlete_id uuid not null references auth.users(id) on delete cascade,
  event_id text not null,
  event_type text not null,
  producer text not null,
  occurred_at timestamptz not null,
  payload jsonb not null,
  schema_version integer not null default 1,
  created_at timestamptz not null default now(),
  sequence_id bigint generated always as identity,
  primary key (athlete_id, event_id)
);

create unique index if not exists athlete_events_athlete_sequence
  on public.athlete_events(athlete_id, sequence_id);

create table if not exists public.processed_athlete_events (
  athlete_id uuid not null references auth.users(id) on delete cascade,
  consumer text not null,
  event_id text not null,
  processed_at timestamptz not null default now(),
  primary key (athlete_id, consumer, event_id)
);

create table if not exists public.device_sync_cursors (
  athlete_id uuid not null references auth.users(id) on delete cascade,
  device_id text not null,
  consumer text not null,
  sequence_id bigint not null default 0,
  updated_at timestamptz not null default now(),
  primary key (athlete_id, device_id, consumer)
);

alter table public.athlete_profiles enable row level security;
alter table public.athlete_rides enable row level security;
alter table public.athlete_events enable row level security;
alter table public.processed_athlete_events enable row level security;
alter table public.device_sync_cursors enable row level security;

create policy "athlete owns profile"
  on public.athlete_profiles for all
  using (auth.uid() = athlete_id)
  with check (auth.uid() = athlete_id);

create policy "athlete owns rides"
  on public.athlete_rides for all
  using (auth.uid() = athlete_id)
  with check (auth.uid() = athlete_id);

create policy "athlete owns events"
  on public.athlete_events for all
  using (auth.uid() = athlete_id)
  with check (auth.uid() = athlete_id);

create policy "athlete owns processed events"
  on public.processed_athlete_events for all
  using (auth.uid() = athlete_id)
  with check (auth.uid() = athlete_id);

create policy "athlete owns sync cursors"
  on public.device_sync_cursors for all
  using (auth.uid() = athlete_id)
  with check (auth.uid() = athlete_id);
