-- Shared athlete cloud foundation for Ride the Races + Mission France.
-- Authentication is external. Every application request must resolve a user_id
-- from a verified access token before reading or writing these tables.

create table if not exists athlete_profiles (
  athlete_id uuid primary key,
  user_id uuid not null unique,
  display_name text not null,
  ftp_watts integer,
  weight_kg numeric(6,2),
  preferred_units text not null check (preferred_units in ('imperial','metric')),
  profile_version integer not null default 1,
  updated_at timestamptz not null default now()
);

create table if not exists athlete_events (
  event_id uuid primary key,
  athlete_id uuid not null references athlete_profiles(athlete_id) on delete cascade,
  event_type text not null,
  schema_version integer not null,
  occurred_at timestamptz not null,
  producer text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists athlete_events_athlete_created_idx
  on athlete_events(athlete_id,created_at,event_id);

create table if not exists rides (
  ride_id uuid primary key,
  athlete_id uuid not null references athlete_profiles(athlete_id) on delete cascade,
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
  on rides(athlete_id,completed_at desc);

create table if not exists processed_events (
  consumer text not null,
  event_id uuid not null references athlete_events(event_id) on delete cascade,
  athlete_id uuid not null references athlete_profiles(athlete_id) on delete cascade,
  processed_at timestamptz not null default now(),
  primary key (consumer,event_id)
);

create table if not exists sync_cursors (
  athlete_id uuid not null references athlete_profiles(athlete_id) on delete cascade,
  device_id text not null,
  consumer text not null,
  cursor text,
  updated_at timestamptz not null default now(),
  primary key (athlete_id,device_id,consumer)
);

-- API authorization rule:
-- a verified user may only access rows where athlete_profiles.user_id equals
-- the token subject mapped by the API/auth provider. Enforce this in database
-- row-level security when a concrete auth provider is selected.
