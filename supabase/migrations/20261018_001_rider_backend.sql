-- RtR backend extension for the existing shared-athlete Supabase model.
-- The live project already owns athlete identity, ride storage, event processing,
-- sync cursors, and legacy imports. This migration extends that model rather than
-- creating a second rider identity or duplicate rides table.

create extension if not exists pgcrypto;

create table if not exists public.rider_state (
  athlete_id uuid primary key references public.athlete_profiles(athlete_id) on delete cascade,
  schema_version integer not null default 1,
  rider jsonb not null default '{}'::jsonb,
  equipment jsonb not null default '{}'::jsonb,
  season jsonb not null default '{}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.training_plans (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athlete_profiles(athlete_id) on delete cascade,
  start_date date,
  end_date date,
  phase text,
  version integer not null default 1,
  is_active boolean not null default true,
  plan jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists training_plans_athlete_active_idx on public.training_plans(athlete_id,is_active);

create table if not exists public.training_journal (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athlete_profiles(athlete_id) on delete cascade,
  date date not null,
  entry jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists training_journal_athlete_date_idx on public.training_journal(athlete_id,date desc);

create table if not exists public.nutrition_entries (
  id uuid primary key,
  athlete_id uuid not null references public.athlete_profiles(athlete_id) on delete cascade,
  logged_at timestamptz not null,
  date date not null,
  meal_type text not null,
  name text not null,
  calories numeric,
  protein_g numeric,
  carbs_g numeric,
  fluid_oz numeric,
  metadata jsonb not null default '{}'::jsonb
);
create index if not exists nutrition_entries_athlete_date_idx on public.nutrition_entries(athlete_id,date desc,logged_at desc);

create table if not exists public.nutrition_templates (
  id uuid primary key,
  athlete_id uuid not null references public.athlete_profiles(athlete_id) on delete cascade,
  name text not null,
  meal_type text not null,
  calories numeric,
  protein_g numeric,
  carbs_g numeric,
  fluid_oz numeric,
  aliases text[] not null default '{}',
  times_used integer not null default 0,
  last_used_at timestamptz
);
create index if not exists nutrition_templates_athlete_idx on public.nutrition_templates(athlete_id);

create table if not exists public.recipe_preferences (
  athlete_id uuid not null references public.athlete_profiles(athlete_id) on delete cascade,
  recipe_id text not null,
  saved_at timestamptz,
  times_planned integer not null default 0,
  times_cooked integer not null default 0,
  rating integer check (rating between 1 and 5),
  primary key(athlete_id,recipe_id)
);

create table if not exists public.readiness_entries (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athlete_profiles(athlete_id) on delete cascade,
  date date not null,
  entry jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists readiness_entries_athlete_date_idx on public.readiness_entries(athlete_id,date desc);

create table if not exists public.benchmark_blocks (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athlete_profiles(athlete_id) on delete cascade,
  block_key text not null,
  label text not null,
  starts_on date,
  ends_on date,
  metrics jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  unique(athlete_id,block_key)
);

alter table public.rider_state enable row level security;
alter table public.training_plans enable row level security;
alter table public.training_journal enable row level security;
alter table public.nutrition_entries enable row level security;
alter table public.nutrition_templates enable row level security;
alter table public.recipe_preferences enable row level security;
alter table public.readiness_entries enable row level security;
alter table public.benchmark_blocks enable row level security;

do $$
declare t text;
begin
  foreach t in array array['rider_state','training_plans','training_journal','nutrition_entries','nutrition_templates','recipe_preferences','readiness_entries','benchmark_blocks']
  loop
    execute format('drop policy if exists %I_select_own on public.%I',t,t);
    execute format('drop policy if exists %I_insert_own on public.%I',t,t);
    execute format('drop policy if exists %I_update_own on public.%I',t,t);
    execute format('drop policy if exists %I_delete_own on public.%I',t,t);

    execute format(
      'create policy %I_select_own on public.%I for select to authenticated using (athlete_id in (select ap.athlete_id from public.athlete_profiles ap where ap.user_id = (select auth.uid())))',
      t,t
    );
    execute format(
      'create policy %I_insert_own on public.%I for insert to authenticated with check (athlete_id in (select ap.athlete_id from public.athlete_profiles ap where ap.user_id = (select auth.uid())))',
      t,t
    );
    execute format(
      'create policy %I_update_own on public.%I for update to authenticated using (athlete_id in (select ap.athlete_id from public.athlete_profiles ap where ap.user_id = (select auth.uid()))) with check (athlete_id in (select ap.athlete_id from public.athlete_profiles ap where ap.user_id = (select auth.uid())))',
      t,t
    );
    execute format(
      'create policy %I_delete_own on public.%I for delete to authenticated using (athlete_id in (select ap.athlete_id from public.athlete_profiles ap where ap.user_id = (select auth.uid())))',
      t,t
    );
  end loop;
end $$;
