alter table public.training_plans add column if not exists local_plan_id text;
create unique index if not exists training_plans_athlete_local_plan_id_idx
  on public.training_plans(athlete_id, local_plan_id);
create unique index if not exists readiness_entries_athlete_date_unique_idx
  on public.readiness_entries(athlete_id, date);
