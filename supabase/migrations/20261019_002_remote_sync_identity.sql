alter table public.rider_state
  add column if not exists career_snapshot jsonb not null default '{}'::jsonb;

alter table public.nutrition_entries
  add column if not exists local_id text;

alter table public.nutrition_templates
  add column if not exists local_id text;

alter table public.training_journal
  add column if not exists local_id text;

create unique index if not exists nutrition_entries_athlete_local_id_idx
  on public.nutrition_entries(athlete_id,local_id)
  where local_id is not null;

create unique index if not exists nutrition_templates_athlete_local_id_idx
  on public.nutrition_templates(athlete_id,local_id)
  where local_id is not null;

create unique index if not exists training_journal_athlete_local_id_idx
  on public.training_journal(athlete_id,local_id)
  where local_id is not null;
